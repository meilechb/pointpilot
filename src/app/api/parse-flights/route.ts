import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const FLIGHT_KEYWORDS = ['flight', 'airport', 'depart', 'arriv', 'cabin', 'miles', 'price', 'fare', 'itinerary', 'segment', 'carrier']

const SYSTEM_PROMPT = `You are a flight data extractor. You will receive raw JSON data intercepted from airline booking websites. Extract all flight options and return them as a JSON array.

For each flight found, return an object with these exact fields (use null for missing values):
{
  "flightCode": string | null,        // e.g. "UA123", "DL456"
  "airlineName": string | null,       // e.g. "United Airlines"
  "departureAirport": string | null,  // IATA code, e.g. "JFK"
  "arrivalAirport": string | null,    // IATA code, e.g. "LHR"
  "departureTime": string | null,     // "HH:MM" 24h format
  "arrivalTime": string | null,       // "HH:MM" 24h format
  "date": string | null,              // "YYYY-MM-DD" departure date
  "arrivalDate": string | null,       // "YYYY-MM-DD" arrival date
  "duration": number | null,          // total flight duration in minutes
  "stops": number | null,             // 0 = nonstop, 1 = one stop, etc.
  "cashAmount": number | null,        // lowest cash price in USD (number only)
  "pointsAmount": number | null,      // points/miles required (number only)
  "feesAmount": number | null,        // taxes + fees in USD (number only)
  "cabinClass": string | null,        // e.g. "Economy", "Business", "First"
  "pricingTiers": [                   // all available cabin/price options
    {
      "label": string,                // e.g. "Economy", "Business", "Economy Saver"
      "paymentType": "cash" | "points",
      "cashAmount": number | null,
      "pointsAmount": number | null,
      "feesAmount": number | null
    }
  ]
}

Rules:
- Return ONLY a valid JSON array, no markdown, no explanation
- Each unique flight route+time combination is one entry
- If a flight has multiple cabin options (Economy/Business/First), list them all in pricingTiers
- If pricing is in points/miles, set paymentType to "points" and put the value in pointsAmount
- Deduplicate: do not return the same flight twice
- If the JSON contains no flight data at all, return []
- Focus on flight SEARCH RESULTS (itinerary options the user can book), not booking confirmations`

function looksLikeFlightData(payload: string): boolean {
  const lower = payload.toLowerCase()
  let matches = 0
  for (const kw of FLIGHT_KEYWORDS) {
    if (lower.includes(kw)) matches++
    if (matches >= 3) return true
  }
  return false
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { payloads, url } = body as { payloads: string[], url: string }

  if (!payloads || !Array.isArray(payloads) || payloads.length === 0) {
    return NextResponse.json({ flights: [] })
  }

  // Filter to payloads that look like flight data, truncate to 50KB each, keep best 5
  const filtered = payloads
    .filter(p => p && p.length > 200 && looksLikeFlightData(p))
    .map(p => p.substring(0, 50000))
    .sort((a, b) => b.length - a.length) // prefer larger payloads (more data)
    .slice(0, 5)

  if (filtered.length === 0) {
    return NextResponse.json({ flights: [] })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const userMessage = [
    `Site: ${url || 'unknown'}`,
    '',
    'Raw JSON data from airline API:',
    ...filtered.map((p, i) => `--- Payload ${i + 1} ---\n${p}`),
  ].join('\n')

  try {
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userMessage },
    ])

    const text = result.response.text().trim()

    // Extract JSON array from response (strip any markdown fences if present)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ flights: [] })
    }

    const flights = JSON.parse(jsonMatch[0])
    return NextResponse.json({ flights }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('Gemini parse error:', err)
    return NextResponse.json({ flights: [], error: 'AI parsing failed' }, { status: 200 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}

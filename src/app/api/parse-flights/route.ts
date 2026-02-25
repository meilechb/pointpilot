import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const FLIGHT_KEYWORDS = [
  'flight', 'airport', 'depart', 'arriv', 'cabin', 'miles', 'price', 'fare',
  'itinerary', 'segment', 'carrier', 'origin', 'destination', 'duration',
  'layover', 'stopover', 'airline', 'iata', 'aircraft', 'gate', 'terminal',
]

const SYSTEM_PROMPT = `You are a flight data extractor. You will receive data from a flight booking website — either raw JSON from API calls or visible page text. Extract all flight search result options and return them as a JSON array.

Different booking sites use different field names. Common patterns:
- Skyscanner: "legs" array with "origin"/"destination" (IATA codes), "departure"/"arrival" (ISO timestamps), "durationInMinutes", "stopCount", "carriers"
- United.com: "flightLegs" or segments with "departureAirport"/"arrivalAirport", "departureDateTime", "arrivalDateTime"
- Google Flights: "flights" with departure/arrival IATA codes and times
- Delta, AA: Similar structured JSON with flight numbers, times, prices

For each flight found, return an object with these exact fields (use null for missing values):
{
  "flightCode": string | null,        // e.g. "UA123", "DL456" — combine carrier code + flight number
  "airlineName": string | null,       // e.g. "United Airlines"
  "departureAirport": string | null,  // IATA code, e.g. "JFK"
  "arrivalAirport": string | null,    // IATA code, e.g. "LHR"
  "departureTime": string | null,     // "HH:MM" 24h format
  "arrivalTime": string | null,       // "HH:MM" 24h format
  "date": string | null,              // "YYYY-MM-DD" departure date
  "arrivalDate": string | null,       // "YYYY-MM-DD" arrival date
  "duration": number | null,          // total flight duration in minutes
  "stops": number | null,             // 0 = nonstop, 1 = one stop, etc.
  "cashAmount": number | null,        // lowest cash price in USD (number only, no currency symbols)
  "pointsAmount": number | null,      // points/miles required (number only)
  "feesAmount": number | null,        // taxes + fees in USD (number only)
  "cabinClass": string | null,        // e.g. "Economy", "Business", "First"
  "pricingTiers": [                   // all available cabin/price options for this flight
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
- Return ONLY a valid JSON array, no markdown, no explanation, no code fences
- Each unique flight route+time combination is one entry
- If a flight has multiple cabin options (Economy/Business/First), list them all in pricingTiers
- If pricing is in points/miles, set paymentType to "points" and put the value in pointsAmount
- Prices may be in minor currency units (e.g. 45000 = $450.00) — divide by 100 if they seem too large
- Deduplicate: do not return the same flight twice
- If no flight data is found at all, return []
- Focus on flight SEARCH RESULTS (bookable options), not confirmation pages or unrelated content
- When reading page text: look for flight cards showing departure/arrival airports, times, prices
- Extract as many flights as you can find — aim for completeness`

function looksLikeFlightData(payload: string): boolean {
  const lower = payload.toLowerCase()
  let matches = 0
  for (const kw of FLIGHT_KEYWORDS) {
    if (lower.includes(kw)) matches++
    if (matches >= 2) return true
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
  if (authError || !user) {
    console.error('[parse-flights] Auth failed:', authError?.message, '| SUPABASE_URL set:', !!process.env.NEXT_PUBLIC_SUPABASE_URL, '| token length:', token?.length)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { payloads, url } = body as { payloads: string[], url: string }

  if (!payloads || !Array.isArray(payloads) || payloads.length === 0) {
    return NextResponse.json({ flights: [] })
  }

  // Filter to payloads that look like flight data, truncate each, keep best 5
  const filtered = payloads
    .filter(p => p && p.length > 200 && looksLikeFlightData(p))
    .map(p => p.substring(0, 60000))
    .sort((a, b) => b.length - a.length) // prefer larger payloads (more data)
    .slice(0, 5)

  // If nothing passed the keyword filter, fall back to ALL payloads (no filter) — let Gemini decide
  const toSend = filtered.length > 0
    ? filtered
    : payloads.filter(p => p && p.length > 50).map(p => p.substring(0, 60000)).slice(0, 5)

  if (toSend.length === 0) {
    return NextResponse.json({ flights: [] })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const isPageText = toSend.length === 1 && !toSend[0].startsWith('{') && !toSend[0].startsWith('[')
  const dataLabel = isPageText ? 'Visible page text from flight booking site' : 'Raw JSON data from airline API'

  const userMessage = [
    `Site: ${url || 'unknown'}`,
    '',
    dataLabel + ':',
    ...toSend.map((p, i) => toSend.length > 1 ? `--- Data ${i + 1} ---\n${p}` : p),
  ].join('\n')

  console.log(`[parse-flights] Received ${payloads.length} payloads, filtered to ${toSend.length}. Sizes: ${toSend.map(p => p.length).join(', ')}. URL: ${url}`)
  console.log(`[parse-flights] All received payload sizes: ${payloads.map(p => p?.length ?? 0).join(', ')}`)
  console.log(`[parse-flights] First payload starts with: ${payloads[0]?.substring(0, 300)}`)
  console.log(`[parse-flights] First 300 chars of first SENT payload: ${toSend[0]?.substring(0, 300)}`)

  try {
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userMessage },
    ])

    const text = result.response.text().trim()
    console.log(`[parse-flights] Gemini response (first 500 chars): ${text.substring(0, 500)}`)

    // Extract JSON array from response (strip any markdown fences if present)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.log('[parse-flights] No JSON array found in response')
      return NextResponse.json({
        flights: [],
        debug: { geminiSaid: text.substring(0, 400), payloadSample: toSend[0]?.substring(0, 400), payloadCount: toSend.length, sizes: toSend.map(p => p.length) },
      }, { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    const flights = JSON.parse(jsonMatch[0])
    console.log(`[parse-flights] Extracted ${flights.length} flights`)
    return NextResponse.json({
      flights,
      debug: flights.length === 0 ? { geminiSaid: text.substring(0, 400), payloadSample: toSend[0]?.substring(0, 400), payloadCount: toSend.length, sizes: toSend.map(p => p.length) } : undefined,
    }, {
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

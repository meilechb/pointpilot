import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MULTI_AIRPORT_CITIES: Record<string, string[]> = {
  NYC: ['JFK', 'EWR', 'LGA'],
  LON: ['LHR', 'LGW', 'STN', 'LTN', 'LCY'],
  PAR: ['CDG', 'ORY'],
  TYO: ['NRT', 'HND'],
  CHI: ['ORD', 'MDW'],
  LAX: ['LAX', 'BUR', 'SNA', 'LGB', 'ONT'],
  SFO: ['SFO', 'OAK', 'SJC'],
  WAS: ['DCA', 'IAD', 'BWI'],
  MIA: ['MIA', 'FLL', 'PBI'],
  DFW: ['DFW', 'DAL'],
  HOU: ['IAH', 'HOU'],
  ROM: ['FCO', 'CIA'],
  MIL: ['MXP', 'LIN'],
  BER: ['BER', 'TXL', 'SXF'],
  SEL: ['ICN', 'GMP'],
  BKK: ['BKK', 'DMK'],
  IST: ['IST', 'SAW'],
  OSA: ['KIX', 'ITM'],
  YTO: ['YYZ', 'YTZ'],
  YMQ: ['YUL', 'YMX'],
  SHA: ['PVG', 'SHA'],
  BJS: ['PEK', 'PKX'],
  MOW: ['SVO', 'DME', 'VKO'],
  SAO: ['GRU', 'CGH', 'VCP'],
  RIO: ['GIG', 'SDU'],
  MEL: ['MEL', 'AVV'],
}

function buildCityHints(legs: { from: string; to: string }[]): string {
  const codes = new Set<string>()
  legs.forEach(l => { codes.add(l.from); codes.add(l.to) })

  const hints: string[] = []
  for (const [city, airports] of Object.entries(MULTI_AIRPORT_CITIES)) {
    const relevant = airports.filter(a => codes.has(a))
    if (relevant.length > 0) {
      hints.push(`${city} area: ${airports.join(', ')} are interchangeable`)
    }
  }
  // Also check if any leg code IS a city code
  for (const code of codes) {
    if (MULTI_AIRPORT_CITIES[code]) {
      hints.push(`"${code}" means any of: ${MULTI_AIRPORT_CITIES[code].join(', ')}`)
    }
  }
  return hints.length > 0 ? '\n\nMulti-airport city info:\n' + hints.join('\n') : ''
}

const SYSTEM_PROMPT = `You are a travel itinerary optimizer. You receive:
1. Trip details: legs (origin→destination pairs), dates, travelers count
2. A list of captured flights with full details (IDs, segments with times/airports/durations, prices)

Your job: select from the provided flights to form up to 3 complete, coherent itineraries covering ALL legs.

Rules:
- Each itinerary MUST cover every leg of the trip
- Match flights to legs by checking departure/arrival airports against each leg's from/to
- Multi-airport cities are interchangeable (e.g. JFK/EWR/LGA all serve New York)
- A flight can serve a leg if its first segment departs from (or near) the leg's origin AND its last segment arrives at (or near) the leg's destination
- Flights with multiple segments are a single booking (connecting flights)
- Consider timing: if legs are sequential, the next leg's flight should depart AFTER the previous leg's flight arrives, with reasonable connection time
- Each flight ID can only be used ONCE per itinerary (but different itineraries can reuse the same flight)

Generate 3 itineraries (or fewer if not enough flights):
1. "Best Overall" — best balance of price, duration, and convenience
2. "Cheapest" — lowest total cost
3. "Fastest" — shortest total travel time

For each itinerary, compute:
- totalDurationMinutes per leg (sum of segment durations + layovers within that flight)
- totalCashCost, totalPointsCost, totalFeesCost across ALL legs (sum of per-flight costs)

NEVER ask the user about connecting flights or direct flights. Simply use the available flights to build the best itineraries. The flights provided are the user's options - use them as-is.

Only ask questions if it is LITERALLY IMPOSSIBLE to build any itinerary (e.g., zero flights exist for a leg and no alternatives). Never ask about preferences, flight types, or connections.
If you must ask, return clarifying questions in the JSON. Example reasons to ask:
- No return date set for a roundtrip (and it matters for picking flights)
- Zero flights match a particular leg

Return ONLY valid JSON, no markdown, no explanation:
{
  "itineraries": [
    {
      "name": "Best Overall",
      "description": "Brief 1-line explanation",
      "tags": ["Recommended"],
      "legAssignments": [
        {
          "legIndex": 0,
          "flightIds": ["flight-id-1"],
          "totalDurationMinutes": 420,
          "summary": "UA123 JFK→LHR, 7h nonstop"
        }
      ],
      "totalCashCost": 485,
      "totalPointsCost": 0,
      "totalFeesCost": 45
    }
  ],
  "questions": [
    {
      "id": "return_date",
      "question": "What is your return date?",
      "type": "date"
    }
  ]
}`

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Subscription check (same pattern as parse-flights)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const isPro = sub && (sub.status === 'active' || sub.status === 'past_due') && sub.plan === 'pro'
  const isCanceledButActive = sub?.status === 'canceled' && sub?.plan === 'pro' && sub?.current_period_end && new Date(sub.current_period_end) > new Date()

  if (!isPro && !isCanceledButActive) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count } = await supabase
      .from('scan_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('scanned_at', monthStart)

    if ((count || 0) >= 1) {
      return NextResponse.json({
        itineraries: [],
        error: 'scan_limit',
        message: 'Free plan limit reached (1 scan/month). Upgrade to Pro for unlimited AI features.',
      })
    }
  }

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { trip, flights, answers } = body as {
    trip: {
      tripType: string
      legs: { from: string; to: string }[]
      departureDate: string
      returnDate: string
      travelers: number
      dateFlexibility: string
    }
    flights: any[]
    answers?: Record<string, string>
  }

  if (!trip?.legs || !flights || flights.length === 0) {
    return NextResponse.json({ itineraries: [], error: 'No trip data or flights provided' })
  }

  // Record usage
  await supabase.from('scan_usage').insert({ user_id: user.id, page_url: 'build-itinerary' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // Build the user message with trip context + flight data
  const cityHints = buildCityHints(trip.legs)

  // Serialize flights with only essential fields to save tokens
  const flightData = flights.map(f => ({
    id: f.id,
    legIndex: f.legIndex,
    segments: (f.segments || []).map((s: any) => ({
      flightCode: s.flightCode,
      airlineName: s.airlineName,
      date: s.date,
      arrivalDate: s.arrivalDate,
      departureAirport: s.departureAirport,
      arrivalAirport: s.arrivalAirport,
      departureTime: s.departureTime,
      arrivalTime: s.arrivalTime,
      duration: s.duration,
    })),
    bookingSite: f.bookingSite,
    paymentType: f.paymentType,
    cashAmount: f.cashAmount,
    pointsAmount: f.pointsAmount,
    feesAmount: f.feesAmount,
  }))

  const userMessage = [
    `Trip type: ${trip.tripType}`,
    `Legs: ${trip.legs.map((l, i) => `Leg ${i}: ${l.from} → ${l.to}`).join(' | ')}`,
    `Departure date: ${trip.departureDate || 'not set'}`,
    `Return date: ${trip.returnDate || 'not set'}`,
    `Travelers: ${trip.travelers || 1}`,
    `Date flexibility: ${trip.dateFlexibility || 'exact'}`,
    cityHints,
    answers ? `\nUser answered previous questions: ${JSON.stringify(answers)}` : '',
    `\nFlights (${flightData.length} total):`,
    JSON.stringify(flightData, null, 1),
  ].filter(Boolean).join('\n')

  console.log(`[build-itinerary] Sending ${flightData.length} flights to Gemini for ${trip.legs.length} legs`)

  try {
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userMessage },
    ])

    const text = result.response.text().trim()
    console.log(`[build-itinerary] Gemini response (first 500 chars): ${text.substring(0, 500)}`)

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.log('[build-itinerary] No JSON object found in response')
      return NextResponse.json({ itineraries: [], error: 'AI returned invalid response' })
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate flight IDs exist
    const validIds = new Set(flights.map((f: any) => f.id))
    if (parsed.itineraries) {
      for (const itin of parsed.itineraries) {
        if (itin.legAssignments) {
          for (const la of itin.legAssignments) {
            la.flightIds = (la.flightIds || []).filter((id: string) => validIds.has(id))
          }
        }
      }
    }

    return NextResponse.json({
      itineraries: parsed.itineraries || [],
      questions: parsed.questions || undefined,
    })
  } catch (err: any) {
    console.error('[build-itinerary] Gemini error:', err)
    const isQuota = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota')
    const errMsg = isQuota
      ? 'AI quota exceeded — please try again later'
      : `AI analysis failed: ${err?.message || err}`
    return NextResponse.json({ itineraries: [], error: errMsg })
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

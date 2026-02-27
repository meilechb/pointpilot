import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const AIRLINE_NAMES: Record<string, string> = {
  'UA': 'United Airlines', 'AA': 'American Airlines', 'DL': 'Delta Air Lines',
  'WN': 'Southwest Airlines', 'B6': 'JetBlue Airways', 'AS': 'Alaska Airlines',
  'NK': 'Spirit Airlines', 'F9': 'Frontier Airlines', 'HA': 'Hawaiian Airlines',
  'SY': 'Sun Country Airlines', 'G4': 'Allegiant Air',
  'BA': 'British Airways', 'LH': 'Lufthansa', 'AF': 'Air France',
  'KL': 'KLM', 'LX': 'Swiss International', 'OS': 'Austrian Airlines',
  'SN': 'Brussels Airlines', 'AZ': 'ITA Airways', 'IB': 'Iberia',
  'SK': 'SAS Scandinavian', 'AY': 'Finnair', 'TP': 'TAP Air Portugal',
  'EI': 'Aer Lingus', 'TK': 'Turkish Airlines', 'MS': 'EgyptAir',
  'EK': 'Emirates', 'QR': 'Qatar Airways', 'EY': 'Etihad Airways',
  'SV': 'Saudia', 'GF': 'Gulf Air', 'WY': 'Oman Air', 'RJ': 'Royal Jordanian',
  'LY': 'El Al Israel Airlines', 'AI': 'Air India', 'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific', 'TG': 'Thai Airways', 'MH': 'Malaysia Airlines',
  'GA': 'Garuda Indonesia', 'BR': 'EVA Air', 'CI': 'China Airlines',
  'NH': 'ANA All Nippon Airways', 'JL': 'Japan Airlines', 'KE': 'Korean Air',
  'OZ': 'Asiana Airlines', 'CA': 'Air China', 'MU': 'China Eastern',
  'CZ': 'China Southern', 'HU': 'Hainan Airlines',
  'QF': 'Qantas', 'NZ': 'Air New Zealand', 'VA': 'Virgin Australia',
  'AC': 'Air Canada', 'WS': 'WestJet', 'AM': 'Aeromexico',
  'CM': 'Copa Airlines', 'AV': 'Avianca', 'LA': 'LATAM Airlines',
  'ET': 'Ethiopian Airlines', 'SA': 'South African Airways', 'KQ': 'Kenya Airways',
  'VS': 'Virgin Atlantic', 'FR': 'Ryanair', 'U2': 'easyJet', 'W6': 'Wizz Air',
  'VY': 'Vueling', 'PC': 'Pegasus Airlines', 'QS': 'SmartWings',
  'DY': 'Norwegian Air', 'FI': 'Icelandair', 'GL': 'Air Greenland',
  'PS': 'Ukraine International', 'RO': 'TAROM', 'JU': 'Air Serbia',
  'BT': 'Air Baltic', 'OA': 'Olympic Air', 'A3': 'Aegean Airlines',
  'ME': 'Middle East Airlines', 'UL': 'SriLankan Airlines',
  'PK': 'Pakistan International', 'BG': 'Biman Bangladesh',
  'BI': 'Royal Brunei', 'MK': 'Air Mauritius', 'FJ': 'Fiji Airways',
  'PR': 'Philippine Airlines', 'VN': 'Vietnam Airlines',
  'DD': 'Nok Air', 'AK': 'AirAsia', 'TR': 'Scoot', '5J': 'Cebu Pacific',
}

// Parse AeroDataBox datetime like "2026-05-17 18:30+03:00" or "2026-05-17T18:30Z"
function parseDateTime(dt: string): { date: string; time: string } {
  if (!dt) return { date: '', time: '' }
  // Remove timezone offset for local time parsing
  const cleaned = dt.replace('T', ' ')
  const dateMatch = cleaned.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/)
  if (dateMatch) {
    return { date: dateMatch[1], time: dateMatch[2] }
  }
  return { date: '', time: '' }
}

export async function GET(request: NextRequest) {
  // Auth check — prevent unauthenticated API quota abuse
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const flightCode = request.nextUrl.searchParams.get('flight')
  const date = request.nextUrl.searchParams.get('date')

  if (!flightCode) {
    return NextResponse.json({ error: 'Flight code is required' }, { status: 400 })
  }

  // Default to today if no date provided
  const lookupDate = date || new Date().toISOString().split('T')[0]

  try {
    const apiKey = process.env.AERODATABOX_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Flight lookup service not configured' }, { status: 500 })
    }

    const code = flightCode.toUpperCase().replace(/\s+/g, '')
    const url = `https://aerodatabox.p.rapidapi.com/flights/number/${code}/${lookupDate}/${lookupDate}`

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
      },
    })

    if (response.status === 404) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Flight lookup failed' }, { status: response.status })
    }

    const data = await response.json()

    // AeroDataBox returns an array of flights (may include previous day's
    // overnight flight that arrives on the requested date). Pick the one
    // whose departure date matches the user's requested date.
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Flight not found for this date' }, { status: 404 })
    }

    const flight = data.find(f => {
      const depLocal = f.departure?.scheduledTime?.local || ''
      const depDate = depLocal.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
      return depDate === lookupDate
    }) || data[data.length - 1] // fallback to last (latest departure)

    const dep = flight.departure || {}
    const arr = flight.arrival || {}
    const airline = flight.airline || {}

    const airlineCode = airline.iata || code.replace(/\d+/g, '')
    const airlineName = airline.name || AIRLINE_NAMES[airlineCode] || airlineCode

    const depParsed = parseDateTime(dep.scheduledTime?.local || '')
    const arrParsed = parseDateTime(arr.scheduledTime?.local || '')

    // Calculate duration from UTC times
    let duration: number | null = null
    const depUtc = dep.scheduledTime?.utc || ''
    const arrUtc = arr.scheduledTime?.utc || ''
    if (depUtc && arrUtc) {
      const depMs = new Date(depUtc.replace(' ', 'T')).getTime()
      const arrMs = new Date(arrUtc.replace(' ', 'T')).getTime()
      if (!isNaN(depMs) && !isNaN(arrMs)) {
        duration = Math.round((arrMs - depMs) / 60000)
      }
    }

    // Build UTC time strings for downstream total-time calculations
    const depUtcParsed = parseDateTime(depUtc.replace('T', ' ').replace('Z', ''))
    const arrUtcParsed = parseDateTime(arrUtc.replace('T', ' ').replace('Z', ''))

    return NextResponse.json({
      flightCode: flight.number || code,
      airlineCode,
      airlineName,
      departureAirport: dep.airport?.iata || '',
      arrivalAirport: arr.airport?.iata || '',
      departureTime: depParsed.date && depParsed.time ? `${depParsed.date} ${depParsed.time}` : '',
      arrivalTime: arrParsed.date && arrParsed.time ? `${arrParsed.date} ${arrParsed.time}` : '',
      departureTimeUtc: depUtcParsed.date && depUtcParsed.time ? `${depUtcParsed.date} ${depUtcParsed.time}` : '',
      arrivalTimeUtc: arrUtcParsed.date && arrUtcParsed.time ? `${arrUtcParsed.date} ${arrUtcParsed.time}` : '',
      departureTerminal: dep.terminal || null,
      arrivalTerminal: arr.terminal || null,
      duration,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to look up flight' }, { status: 500 })
  }
}
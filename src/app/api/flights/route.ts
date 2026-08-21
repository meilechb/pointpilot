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

type AdbTime = { local?: string; utc?: string }
type AdbMovement = {
  airport?: { iata?: string }
  scheduledTime?: AdbTime
  terminal?: string | null
}
type AdbFlight = {
  number?: string
  departure?: AdbMovement
  arrival?: AdbMovement
  airline?: { name?: string; iata?: string }
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

// Simple in-memory rate limit. Serverless instances are short-lived and not
// shared, so this is a speed bump against quota abuse, not a hard guarantee.
const RATE_WINDOW_MS = 10 * 60 * 1000
const ANON_LIMIT = 10
const USER_LIMIT = 60
const recentHits = new Map<string, number[]>()

function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now()
  const hits = (recentHits.get(key) || []).filter(t => now - t < RATE_WINDOW_MS)
  if (hits.length >= limit) {
    recentHits.set(key, hits)
    return true
  }
  hits.push(now)
  recentHits.set(key, hits)
  if (recentHits.size > 5000) {
    for (const [k, v] of recentHits) {
      if (v.every(t => now - t >= RATE_WINDOW_MS)) recentHits.delete(k)
    }
  }
  return false
}

async function getUserId(token: string | undefined): Promise<string | null> {
  if (!token) return null
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  // Lookup is available to anonymous planners too (trips work without an
  // account), so auth is optional — it only buys a higher rate limit.
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const userId = await getUserId(token)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  if (isRateLimited(userId ? `u:${userId}` : `ip:${ip}`, userId ? USER_LIMIT : ANON_LIMIT)) {
    return NextResponse.json(
      { error: 'Too many flight lookups. Wait a few minutes, or add the flight manually.' },
      { status: 429 }
    )
  }

  const flightCode = request.nextUrl.searchParams.get('flight')
  const date = request.nextUrl.searchParams.get('date')

  if (!flightCode) {
    return NextResponse.json({ error: 'Flight code is required' }, { status: 400 })
  }

  const code = flightCode.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!/^[A-Z0-9]{3,10}$/.test(code)) {
    return NextResponse.json({ error: 'Enter a flight number like UA123' }, { status: 400 })
  }

  // Blank date means "nearest date this flight operates" — AeroDataBox handles
  // that when the date segment is omitted entirely.
  const lookupDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''

  try {
    const apiKey = process.env.AERODATABOX_API_KEY || process.env.RAPIDAPI_KEY
    if (!apiKey) {
      console.error('[flights] AERODATABOX_API_KEY is not set')
      return NextResponse.json({ error: 'Flight lookup service not configured' }, { status: 500 })
    }

    // Flight Status (single day) — Tier 2, 2 units per call. The date-range
    // variant (/number/{code}/{from}/{to}) is Tier 3 at 6 units and returns
    // the same data for a single day, so it burned 3x the API quota.
    // No dateLocalRole, so a red-eye entered by its arrival date still matches;
    // the departure-date preference below picks the right one.
    const url = lookupDate
      ? `https://aerodatabox.p.rapidapi.com/flights/number/${code}/${lookupDate}`
      : `https://aerodatabox.p.rapidapi.com/flights/number/${code}`

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error(
        `[flights] AeroDataBox ${response.status} for ${code} ${lookupDate || '(nearest)'}: ${detail.slice(0, 300)}`
      )

      if (response.status === 404) {
        return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
      }
      if (response.status === 401 || response.status === 403) {
        // Expired/unsubscribed RapidAPI plan or a bad key — not the user's fault.
        return NextResponse.json({
          error: 'Flight lookup is temporarily unavailable. Add the flight manually for now.',
        }, { status: 502 })
      }
      if (response.status === 429) {
        return NextResponse.json({
          error: 'Flight lookup is over its limit right now. Try again later, or add the flight manually.',
        }, { status: 429 })
      }
      return NextResponse.json({
        error: 'Flight lookup failed. Add the flight manually for now.',
      }, { status: 502 })
    }

    const raw = await response.json()

    // AeroDataBox returns an array of flights (a flight number can run more
    // than once a day, and an overnight leg may straddle the date).
    const flights: AdbFlight[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.flights) ? raw.flights : []

    if (flights.length === 0) {
      return NextResponse.json({ error: 'Flight not found for this date' }, { status: 404 })
    }

    const flight = (lookupDate && flights.find(f => {
      const depLocal = f.departure?.scheduledTime?.local || ''
      return depLocal.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] === lookupDate
    })) || flights[flights.length - 1] // fallback to latest departure

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
    console.error('[flights] lookup threw:', error)
    return NextResponse.json({ error: 'Failed to look up flight' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  const flightCode = request.nextUrl.searchParams.get('flight')
  const date = request.nextUrl.searchParams.get('date')

  if (!flightCode) {
    return NextResponse.json({ error: 'Flight code is required' }, { status: 400 })
  }

  try {
    const apiKey = process.env.AIRLABS_API_KEY
    const url = `https://airlabs.co/api/v9/flight?flight_iata=${flightCode}&api_key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (!data.response) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
    }

    const flight = data.response
    const airlineCode = flight.airline_iata || ''
    const airlineName = AIRLINE_NAMES[airlineCode] || airlineCode

    return NextResponse.json({
      flightCode: flight.flight_iata,
      airlineCode: airlineCode,
      airlineName: airlineName,
      departureAirport: flight.dep_iata,
      arrivalAirport: flight.arr_iata,
      departureTime: flight.dep_time,
      arrivalTime: flight.arr_time,
      departureTimeUtc: flight.dep_time_utc,
      arrivalTimeUtc: flight.arr_time_utc,
      departureTerminal: flight.dep_terminal,
      arrivalTerminal: flight.arr_terminal,
      duration: flight.duration,
      status: flight.status,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to look up flight' }, { status: 500 })
  }
}
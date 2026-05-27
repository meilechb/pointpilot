import type { BookingStrategy, FlightBooking } from './tripOptimizer'

export type SurchargeProfile = {
  id: string
  booking_program: string
  operating_airline: string
  route_type: string | null
  cabin_class: string | null
  estimated_surcharge_usd: number
  surcharge_level: 'none' | 'low' | 'medium' | 'high' | 'extreme'
  notes: string | null
}

function programMatch(a: string, b: string): boolean {
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return true
  if (la.includes(lb) || lb.includes(la)) return true
  return false
}

function extractAirlineFromLabel(flightLabel: string): string | null {
  const codeMatch = flightLabel.match(/^([A-Z]{2})\d/)
  if (codeMatch) return codeMatch[1]
  const multiSegMatch = flightLabel.match(/^([A-Z]{2})\d.*?\(/)
  if (multiSegMatch) return multiSegMatch[1]
  return null
}

const IATA_TO_AIRLINE: Record<string, string> = {
  'BA': 'British Airways', 'LH': 'Lufthansa', 'LX': 'Swiss',
  'OS': 'Austrian', 'SQ': 'Singapore Airlines', 'NH': 'ANA',
  'JL': 'JAL', 'CX': 'Cathay Pacific', 'QF': 'Qantas',
  'EK': 'Emirates', 'QR': 'Qatar Airways', 'EY': 'Etihad',
  'UA': 'United', 'AA': 'American Airlines', 'DL': 'Delta',
  'AC': 'Air Canada', 'AF': 'Air France', 'KL': 'KLM',
  'TK': 'Turkish Airlines', 'VS': 'Virgin Atlantic',
  'AV': 'Avianca', 'IB': 'Iberia', 'AS': 'Alaska Airlines',
  'B6': 'JetBlue', 'WN': 'Southwest', 'TP': 'TAP Portugal',
  'EI': 'Aer Lingus',
}

function findSurcharge(
  bookingProgram: string,
  operatingAirlineCode: string | null,
  profiles: SurchargeProfile[]
): SurchargeProfile | null {
  if (!operatingAirlineCode) return null
  const airlineName = IATA_TO_AIRLINE[operatingAirlineCode]
  if (!airlineName) return null

  for (const p of profiles) {
    if (programMatch(p.booking_program, bookingProgram) &&
        programMatch(p.operating_airline, airlineName)) {
      return p
    }
    if (programMatch(p.booking_program, bookingProgram) &&
        programMatch(p.operating_airline, operatingAirlineCode)) {
      return p
    }
  }
  return null
}

export function enrichStrategiesWithSurcharges(
  strategies: BookingStrategy[],
  surchargeProfiles: SurchargeProfile[]
): BookingStrategy[] {
  if (surchargeProfiles.length === 0) return strategies

  return strategies.map(strategy => {
    const newWarnings = [...strategy.warnings]

    for (const booking of strategy.bookings) {
      if (booking.method === 'cash') continue

      const airlineCode = extractAirlineFromLabel(booking.flightLabel)
      const programToCheck = booking.transferTo || booking.pointsProgram
      const surcharge = findSurcharge(programToCheck, airlineCode, surchargeProfiles)

      if (surcharge && (surcharge.surcharge_level === 'high' || surcharge.surcharge_level === 'extreme')) {
        const airlineName = airlineCode ? (IATA_TO_AIRLINE[airlineCode] || airlineCode) : 'this airline'
        const warning = `High fuel surcharges (~$${surcharge.estimated_surcharge_usd}) when booking ${airlineName} through ${programToCheck}${surcharge.notes ? '. ' + surcharge.notes : ''}`
        if (!newWarnings.includes(warning)) {
          newWarnings.push(warning)
        }
      }
    }

    return newWarnings.length > strategy.warnings.length
      ? { ...strategy, warnings: newWarnings }
      : strategy
  })
}

export async function fetchSurchargeProfiles(): Promise<SurchargeProfile[]> {
  try {
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const { data } = await sb.from('surcharge_profiles').select('*')
    return (data as SurchargeProfile[]) || []
  } catch {
    return []
  }
}

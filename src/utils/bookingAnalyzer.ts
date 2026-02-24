import { transferPartners, PointsProgram, TransferPartner } from '@/data/transferPartners'

type WalletEntry = {
  id: string
  currency_type: 'bank_points' | 'airline_miles' | 'cashback' | 'cash'
  program: string
  balance: number
  redemption_value: number | null
  notes: string
}

type Flight = {
  id: string
  segments: any[]
  bookingSite: string
  paymentType: string
  cashAmount: number | null
  pointsAmount: number | null
  feesAmount: number | null
}

export type BookingStep = {
  type: 'direct_miles' | 'transfer' | 'cash' | 'shortfall'
  flightLabel: string
  pointsNeeded: number
  walletProgram?: string
  walletBalance?: number
  transferFrom?: string
  transferTo?: string
  transferRatio?: [number, number]
  bankPointsNeeded?: number
  cashAmount?: number
  feesAmount?: number
  shortfall?: number
  message: string
}

// Map booking site names to transfer partner search terms
const BOOKING_SITE_TO_PROGRAM: Record<string, string> = {
  // Airline names
  'united': 'United MileagePlus', 'united airlines': 'United MileagePlus',
  'delta': 'Delta SkyMiles', 'delta airlines': 'Delta SkyMiles',
  'american': 'American Airlines AAdvantage', 'american airlines': 'American Airlines AAdvantage', 'aa': 'American Airlines AAdvantage',
  'british airways': 'British Airways Executive Club', 'ba': 'British Airways Executive Club',
  'virgin atlantic': 'Virgin Atlantic Flying Club',
  'air canada': 'Air Canada Aeroplan', 'aeroplan': 'Air Canada Aeroplan',
  'air france': 'Air France-KLM Flying Blue', 'klm': 'Air France-KLM Flying Blue', 'flying blue': 'Air France-KLM Flying Blue',
  'emirates': 'Emirates Skywards',
  'qatar': 'Qatar Airways Privilege Club', 'qatar airways': 'Qatar Airways Privilege Club',
  'singapore': 'Singapore Airlines KrisFlyer', 'singapore airlines': 'Singapore Airlines KrisFlyer',
  'jetblue': 'JetBlue TrueBlue', 'southwest': 'Southwest Rapid Rewards',
  'alaska': 'Alaska Airlines Mileage Plan', 'alaska airlines': 'Alaska Airlines Mileage Plan',
  'avianca': 'Avianca LifeMiles', 'lifemiles': 'Avianca LifeMiles',
  'cathay': 'Cathay Pacific Asia Miles', 'cathay pacific': 'Cathay Pacific Asia Miles',
  'etihad': 'Etihad Guest', 'iberia': 'Iberia Plus',
  'turkish': 'Turkish Airlines Miles&Smiles', 'turkish airlines': 'Turkish Airlines Miles&Smiles',
  'ana': 'ANA Mileage Club', 'aer lingus': 'Aer Lingus AerClub',
  'qantas': 'Qantas Frequent Flyer', 'tap': 'TAP Portugal Miles&Go', 'tap portugal': 'TAP Portugal Miles&Go',
  // Booking site URLs (from programOptions.ts bookingSites)
  'united.com': 'United MileagePlus',
  'aa.com': 'American Airlines AAdvantage',
  'delta.com': 'Delta SkyMiles',
  'southwest.com': 'Southwest Rapid Rewards',
  'jetblue.com': 'JetBlue TrueBlue',
  'alaskaair.com': 'Alaska Airlines Mileage Plan',
  'britishairways.com': 'British Airways Executive Club',
  'emirates.com': 'Emirates Skywards',
  'qatarairways.com': 'Qatar Airways Privilege Club',
  'singaporeair.com': 'Singapore Airlines KrisFlyer',
  'ana.co.jp': 'ANA Mileage Club',
  'aircanada.com': 'Air Canada Aeroplan',
  'virginatlantic.com': 'Virgin Atlantic Flying Club',
  'aerlingus.com': 'Aer Lingus AerClub',
  'iberia.com': 'Iberia Plus',
  'avianca.com': 'Avianca LifeMiles',
  'turkishairlines.com': 'Turkish Airlines Miles&Smiles',
  'flyingblue.com': 'Air France-KLM Flying Blue',
  'cathaypacific.com': 'Cathay Pacific Asia Miles',
  'jal.co.jp': 'Japan Airlines Mileage Bank',
  'koreanair.com': 'Korean Air SKYPASS',
  'qantas.com': 'Qantas Frequent Flyer',
}

function resolvePartnerName(bookingSite: string): string | null {
  const lower = bookingSite.toLowerCase().trim()
  if (BOOKING_SITE_TO_PROGRAM[lower]) return BOOKING_SITE_TO_PROGRAM[lower]
  // Strip .com/.co.jp etc and try again
  const stripped = lower.replace(/\.(com|co\.jp|co\.uk|net|org)$/i, '')
  if (BOOKING_SITE_TO_PROGRAM[stripped]) return BOOKING_SITE_TO_PROGRAM[stripped]
  // Fuzzy: check if any key is contained in the booking site
  for (const [key, value] of Object.entries(BOOKING_SITE_TO_PROGRAM)) {
    if (lower.includes(key) || key.includes(lower)) return value
    if (stripped.includes(key) || key.includes(stripped)) return value
  }
  return null
}

// Robust program name matching — checks multiple strategies
function programNamesMatch(walletProgram: string, targetProgram: string): boolean {
  const w = walletProgram.toLowerCase().trim()
  const t = targetProgram.toLowerCase().trim()
  if (w === t) return true
  if (w.includes(t) || t.includes(w)) return true
  // Check each significant word (3+ chars) from target appears in wallet
  const targetWords = t.split(/[\s\-]+/).filter(word => word.length >= 3)
  if (targetWords.length > 0 && targetWords.every(word => w.includes(word))) return true
  // Check each significant word from wallet appears in target
  const walletWords = w.split(/[\s\-]+/).filter(word => word.length >= 3)
  if (walletWords.length > 0 && walletWords.every(word => t.includes(word))) return true
  return false
}

function getFlightLabel(flight: Flight): string {
  const segs = flight.segments
  if (segs.length === 0) return 'Unknown flight'
  const codes = segs.map((s: any) => s.flightCode).filter(Boolean).join(' + ')
  const from = segs[0]?.departureAirport
  const to = segs[segs.length - 1]?.arrivalAirport
  return codes ? `${codes} (${from} → ${to})` : `${from} → ${to}`
}

export function analyzeItinerary(
  assignments: Record<number, string[]>,
  flights: Flight[],
  wallet: WalletEntry[],
  travelers: number
): BookingStep[] {
  const steps: BookingStep[] = []
  const flightMap: Record<string, Flight> = {}
  flights.forEach(f => { flightMap[f.id] = f })

  // Track wallet usage across flights so we don't double-spend
  const walletUsage: Record<string, number> = {} // walletId -> points used

  const allFlightIds = Object.values(assignments).flat()
  for (const fId of allFlightIds) {
    const flight = flightMap[fId]
    if (!flight) continue

    const label = getFlightLabel(flight)

    // Cash flights — simple
    if (flight.paymentType === 'cash') {
      if (flight.cashAmount) {
        steps.push({
          type: 'cash',
          flightLabel: label,
          pointsNeeded: 0,
          cashAmount: flight.cashAmount * travelers,
          feesAmount: 0,
          message: `Pay $${(flight.cashAmount * travelers).toLocaleString()} cash${travelers > 1 ? ` ($${flight.cashAmount.toLocaleString()} × ${travelers})` : ''} on ${flight.bookingSite || 'booking site'}`,
        })
      }
      continue
    }

    // Points flights
    if (flight.paymentType === 'points' && flight.pointsAmount) {
      const totalPointsNeeded = flight.pointsAmount * travelers
      const partnerName = resolvePartnerName(flight.bookingSite || '')

      // Gather all available sources for this airline program
      let remainingNeeded = totalPointsNeeded

      // 1. Use direct airline miles first (if available)
      if (partnerName) {
        const directMatch = wallet.find(w =>
          w.currency_type === 'airline_miles' &&
          programNamesMatch(w.program, partnerName)
        )

        if (directMatch) {
          const used = walletUsage[directMatch.id] || 0
          const available = directMatch.balance - used
          const useAmount = Math.min(available, remainingNeeded)

          if (useAmount > 0) {
            walletUsage[directMatch.id] = used + useAmount
            remainingNeeded -= useAmount
            steps.push({
              type: 'direct_miles',
              flightLabel: label,
              pointsNeeded: useAmount,
              walletProgram: directMatch.program,
              walletBalance: available,
              feesAmount: remainingNeeded === 0 ? (flight.feesAmount || 0) * travelers : 0,
              message: remainingNeeded === 0
                ? `Use ${useAmount.toLocaleString()} ${directMatch.program} miles${(flight.feesAmount ? ` + $${((flight.feesAmount) * travelers).toLocaleString()} fees` : '')} to book on ${flight.bookingSite}`
                : `Use ${useAmount.toLocaleString()} of your ${directMatch.program} miles (${(totalPointsNeeded - remainingNeeded).toLocaleString()} of ${totalPointsNeeded.toLocaleString()} needed)`,
            })
          }
        }
      }

      // 2. If still need more, transfer from bank points
      if (remainingNeeded > 0 && partnerName) {
        // Try each bank program that can transfer to this airline
        for (const program of transferPartners) {
          if (remainingNeeded <= 0) break
          const partner = program.partners.find(p =>
            p.partner.toLowerCase() === partnerName.toLowerCase()
          )
          if (!partner) continue

          const walletEntry = wallet.find(w =>
            w.currency_type === 'bank_points' &&
            programNamesMatch(w.program, program.name)
          )
          if (!walletEntry) continue

          const used = walletUsage[walletEntry.id] || 0
          const available = walletEntry.balance - used
          if (available <= 0) continue

          // How many bank points needed for the remaining airline miles
          const bankPointsForRemaining = Math.ceil(remainingNeeded * partner.ratio[0] / partner.ratio[1])
          const bankPointsToUse = Math.min(available, bankPointsForRemaining)
          // How many airline miles does that get us
          const milesFromTransfer = Math.floor(bankPointsToUse * partner.ratio[1] / partner.ratio[0])

          walletUsage[walletEntry.id] = used + bankPointsToUse
          remainingNeeded -= milesFromTransfer

          const ratioStr = partner.ratio[0] === partner.ratio[1] ? '1:1' : `${partner.ratio[0]}:${partner.ratio[1]}`
          steps.push({
            type: 'transfer',
            flightLabel: label,
            pointsNeeded: milesFromTransfer,
            walletProgram: walletEntry.program,
            walletBalance: available,
            transferFrom: program.name,
            transferTo: partner.partner,
            transferRatio: partner.ratio,
            bankPointsNeeded: bankPointsToUse,
            feesAmount: remainingNeeded <= 0 ? (flight.feesAmount || 0) * travelers : 0,
            message: `Transfer ${bankPointsToUse.toLocaleString()} ${program.name} → ${partner.partner} (${ratioStr}), then book on ${flight.bookingSite}${remainingNeeded <= 0 && flight.feesAmount ? ` + $${((flight.feesAmount) * travelers).toLocaleString()} fees` : ''}`,
          })
        }
      }

      // 3. If STILL not enough after all sources, show shortfall
      if (remainingNeeded > 0) {
        let shortfallMsg = ''
        if (partnerName) {
          shortfallMsg = `Still need ${remainingNeeded.toLocaleString()} more ${partnerName} miles — add more points or consider a cash booking`
        } else {
          shortfallMsg = `Need ${totalPointsNeeded.toLocaleString()} points on ${flight.bookingSite || 'unknown program'} — add this program to your wallet or check transfer partners`
        }
        steps.push({
          type: 'shortfall',
          flightLabel: label,
          pointsNeeded: remainingNeeded,
          feesAmount: (flight.feesAmount || 0) * travelers,
          message: shortfallMsg,
        })
      }
    }
  }

  return steps
}
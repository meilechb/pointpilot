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
  'united': 'United MileagePlus',
  'united airlines': 'United MileagePlus',
  'delta': 'Delta SkyMiles',
  'delta airlines': 'Delta SkyMiles',
  'american': 'American Airlines AAdvantage',
  'american airlines': 'American Airlines AAdvantage',
  'aa': 'American Airlines AAdvantage',
  'british airways': 'British Airways Executive Club',
  'ba': 'British Airways Executive Club',
  'virgin atlantic': 'Virgin Atlantic Flying Club',
  'air canada': 'Air Canada Aeroplan',
  'aeroplan': 'Air Canada Aeroplan',
  'air france': 'Air France-KLM Flying Blue',
  'klm': 'Air France-KLM Flying Blue',
  'flying blue': 'Air France-KLM Flying Blue',
  'emirates': 'Emirates Skywards',
  'qatar': 'Qatar Airways Privilege Club',
  'qatar airways': 'Qatar Airways Privilege Club',
  'singapore': 'Singapore Airlines KrisFlyer',
  'singapore airlines': 'Singapore Airlines KrisFlyer',
  'jetblue': 'JetBlue TrueBlue',
  'southwest': 'Southwest Rapid Rewards',
  'alaska': 'Alaska Airlines Mileage Plan',
  'alaska airlines': 'Alaska Airlines Mileage Plan',
  'avianca': 'Avianca LifeMiles',
  'lifemiles': 'Avianca LifeMiles',
  'cathay': 'Cathay Pacific Asia Miles',
  'cathay pacific': 'Cathay Pacific Asia Miles',
  'etihad': 'Etihad Guest',
  'iberia': 'Iberia Plus',
  'turkish': 'Turkish Airlines Miles&Smiles',
  'turkish airlines': 'Turkish Airlines Miles&Smiles',
  'ana': 'ANA Mileage Club',
  'aer lingus': 'Aer Lingus AerClub',
  'qantas': 'Qantas Frequent Flyer',
  'tap': 'TAP Portugal Miles&Go',
  'tap portugal': 'TAP Portugal Miles&Go',
}

function resolvePartnerName(bookingSite: string): string | null {
  const lower = bookingSite.toLowerCase().trim()
  if (BOOKING_SITE_TO_PROGRAM[lower]) return BOOKING_SITE_TO_PROGRAM[lower]
  // Fuzzy: check if any key is contained in the booking site
  for (const [key, value] of Object.entries(BOOKING_SITE_TO_PROGRAM)) {
    if (lower.includes(key) || key.includes(lower)) return value
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

      // 1. Check direct airline miles in wallet
      if (partnerName) {
        const directMatch = wallet.find(w =>
          w.currency_type === 'airline_miles' &&
          programNamesMatch(w.program, partnerName)
        )

        if (directMatch) {
          const used = walletUsage[directMatch.id] || 0
          const available = directMatch.balance - used

          if (available >= totalPointsNeeded) {
            walletUsage[directMatch.id] = used + totalPointsNeeded
            steps.push({
              type: 'direct_miles',
              flightLabel: label,
              pointsNeeded: totalPointsNeeded,
              walletProgram: directMatch.program,
              walletBalance: available,
              feesAmount: (flight.feesAmount || 0) * travelers,
              message: `Use ${totalPointsNeeded.toLocaleString()} ${directMatch.program} miles${(flight.feesAmount ? ` + $${((flight.feesAmount) * travelers).toLocaleString()} fees` : '')} to book on ${flight.bookingSite}`,
            })
            continue
          }
        }
      }

      // 2. Check bank points that can transfer
      if (partnerName) {
        let found = false
        for (const program of transferPartners) {
          const partner = program.partners.find(p =>
            p.partner.toLowerCase() === partnerName.toLowerCase()
          )
          if (!partner) continue

          // Find this program in wallet
          const walletEntry = wallet.find(w =>
            w.currency_type === 'bank_points' &&
            programNamesMatch(w.program, program.name)
          )
          if (!walletEntry) continue

          const used = walletUsage[walletEntry.id] || 0
          const available = walletEntry.balance - used

          // Calculate how many bank points needed
          const bankPointsNeeded = Math.ceil(totalPointsNeeded * partner.ratio[0] / partner.ratio[1])

          if (available >= bankPointsNeeded) {
            walletUsage[walletEntry.id] = used + bankPointsNeeded
            const ratioStr = partner.ratio[0] === partner.ratio[1] ? '1:1' : `${partner.ratio[0]}:${partner.ratio[1]}`
            steps.push({
              type: 'transfer',
              flightLabel: label,
              pointsNeeded: totalPointsNeeded,
              walletProgram: walletEntry.program,
              walletBalance: available,
              transferFrom: program.name,
              transferTo: partner.partner,
              transferRatio: partner.ratio,
              bankPointsNeeded,
              feesAmount: (flight.feesAmount || 0) * travelers,
              message: `Transfer ${bankPointsNeeded.toLocaleString()} ${program.name} → ${partner.partner} (${ratioStr}), then book on ${flight.bookingSite}${flight.feesAmount ? ` + $${((flight.feesAmount) * travelers).toLocaleString()} fees` : ''}`,
            })
            found = true
            break
          }
        }
        if (found) continue
      }

      // 3. Not enough points anywhere — provide helpful message about what was found
      let shortfallMsg = ''
      if (partnerName) {
        // Check if user has any matching wallet entries (direct or transfer)
        const directEntry = wallet.find(w => w.currency_type === 'airline_miles' && programNamesMatch(w.program, partnerName))
        const transferEntry = wallet.find(w => {
          if (w.currency_type !== 'bank_points') return false
          return transferPartners.some(p => programNamesMatch(w.program, p.name) && p.partners.some(pt => pt.partner.toLowerCase() === partnerName.toLowerCase()))
        })

        if (directEntry) {
          const used = walletUsage[directEntry.id] || 0
          shortfallMsg = `Need ${totalPointsNeeded.toLocaleString()} ${partnerName} miles but only have ${(directEntry.balance - used).toLocaleString()} ${directEntry.program} remaining`
        } else if (transferEntry) {
          const used = walletUsage[transferEntry.id] || 0
          shortfallMsg = `Need ${totalPointsNeeded.toLocaleString()} ${partnerName} miles — your ${transferEntry.program} (${(transferEntry.balance - used).toLocaleString()} pts) doesn't have enough to transfer`
        } else {
          shortfallMsg = `Need ${totalPointsNeeded.toLocaleString()} ${partnerName} miles but no matching program found in your wallet — add ${partnerName} or a bank program that transfers to it`
        }
      } else {
        shortfallMsg = `Need ${totalPointsNeeded.toLocaleString()} points on ${flight.bookingSite || 'unknown program'} — add this program to your wallet or check transfer partners`
      }

      steps.push({
        type: 'shortfall',
        flightLabel: label,
        pointsNeeded: totalPointsNeeded,
        feesAmount: (flight.feesAmount || 0) * travelers,
        message: shortfallMsg,
      })
    }
  }

  return steps
}
// AI Trip Optimizer
// Analyzes all flights added to a trip + user's wallet + transfer partners
// Generates up to 3 optimal booking combinations

import { transferPartners } from '@/data/transferPartners'
import { bookingPortals, pointValuations, sweetSpots, findProgramByIata, findBookablePrograms } from '@/data/pointsKnowledge'

type WalletEntry = {
  id: string
  currency_type: 'bank_points' | 'airline_miles' | 'cashback' | 'cash'
  program: string
  balance: number
  redemption_value: number | null
  notes: string
}

type Segment = {
  flightCode: string
  airlineName: string
  departureAirport: string
  arrivalAirport: string
}

type PricingTier = {
  id: string
  label: string
  paymentType: 'cash' | 'points'
  cashAmount: number | null
  pointsAmount: number | null
  feesAmount: number | null
}

type Flight = {
  id: string
  legIndex: number | null
  segments: Segment[]
  bookingSite: string
  paymentType: 'cash' | 'points'
  cashAmount: number | null
  pointsAmount: number | null
  feesAmount: number | null
  pricingTiers?: PricingTier[]
  defaultTierLabel?: string
}

type Leg = { from: string; to: string }

// A single flight's booking method in a strategy
export type FlightBooking = {
  flightId: string
  flightLabel: string
  legIndex: number
  method: 'cash' | 'direct_miles' | 'transfer' | 'portal'
  cashCost: number          // total cash out of pocket (price or fees)
  pointsCost: number        // points spent from wallet
  pointsProgram: string     // which program the points come from
  transferFrom?: string     // bank program name (if transfer)
  transferTo?: string       // airline program name (if transfer)
  transferRatio?: string    // e.g. "1:1"
  portalName?: string       // e.g. "Chase Travel Portal"
  portalCpp?: number        // cents per point in portal
  description: string       // human-readable step
  tierLabel?: string        // cabin class if from a pricing tier
}

// A complete booking strategy for the whole trip
export type BookingStrategy = {
  id: string
  name: string
  description: string
  bookings: FlightBooking[]
  totalCash: number
  totalPoints: number       // bank/airline points spent
  estimatedValue: number    // estimated total dollar value of the trip
  estimatedCpp: number      // cents per point achieved
  savingsVsCash: number     // how much cash saved vs paying all cash
  warnings: string[]
  tags: string[]            // e.g. "Best Value", "Lowest Cash", "Points Saver"
}

// ── Helpers ──

function getFlightLabel(flight: Flight): string {
  const segs = flight.segments
  if (!segs || segs.length === 0) return 'Unknown flight'
  const codes = segs.map(s => s.flightCode).filter(Boolean).join(' + ')
  const from = segs[0]?.departureAirport
  const to = segs[segs.length - 1]?.arrivalAirport
  return codes ? `${codes} (${from} → ${to})` : `${from} → ${to}`
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

// Match a wallet entry to a bank program in transferPartners
function matchWalletToProgram(wallet: WalletEntry): string | null {
  if (wallet.currency_type !== 'bank_points') return null
  for (const p of transferPartners) {
    if (programNamesMatch(wallet.program, p.name)) return p.id
  }
  return null
}

// Match a wallet entry to an airline program name
function matchWalletToAirline(wallet: WalletEntry): string | null {
  if (wallet.currency_type !== 'airline_miles') return null
  return wallet.program
}

// Find which airline program a booking site maps to
const SITE_TO_PROGRAM: Record<string, string> = {
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

function resolveAirlineProgram(bookingSite: string): string | null {
  const lower = (bookingSite || '').toLowerCase().trim()
  if (SITE_TO_PROGRAM[lower]) return SITE_TO_PROGRAM[lower]
  // Strip .com/.co.jp etc and try again
  const stripped = lower.replace(/\.(com|co\.jp|co\.uk|net|org)$/i, '')
  if (SITE_TO_PROGRAM[stripped]) return SITE_TO_PROGRAM[stripped]
  for (const [key, value] of Object.entries(SITE_TO_PROGRAM)) {
    if (lower.includes(key) || key.includes(lower)) return value
    if (stripped.includes(key) || key.includes(stripped)) return value
  }
  return null
}

// Get all possible ways to pay for a single flight
type PayOption = {
  method: 'cash' | 'direct_miles' | 'transfer' | 'portal'
  cashCost: number
  pointsCost: number
  pointsProgram: string
  walletId: string
  transferFrom?: string
  transferTo?: string
  transferRatio?: string
  portalName?: string
  portalCpp?: number
  estimatedCashValue: number // what the flight is "worth" in cash
  description: string
  cpp: number // cents per point achieved (higher = better)
  tierLabel?: string // cabin class label if from a pricing tier
}

function getPayOptions(flight: Flight, wallet: WalletEntry[], travelers: number): PayOption[] {
  const options: PayOption[] = []
  const label = getFlightLabel(flight)

  // Option A: Pay cash (always available if flight has a cash price)
  if (flight.cashAmount) {
    options.push({
      method: 'cash',
      cashCost: flight.cashAmount * travelers,
      pointsCost: 0,
      pointsProgram: 'Cash',
      walletId: '__cash__',
      estimatedCashValue: flight.cashAmount * travelers,
      description: `Pay $${(flight.cashAmount * travelers).toLocaleString()} cash on ${flight.bookingSite || 'booking site'}`,
      cpp: 0,
    })
  }

  // For points flights, find all the ways to pay
  if (flight.paymentType === 'points' && flight.pointsAmount) {
    const totalPoints = flight.pointsAmount * travelers
    const totalFees = (flight.feesAmount || 0) * travelers
    const airlineProgram = resolveAirlineProgram(flight.bookingSite || '')

    // Estimate cash value: if we know the cash price, use it; otherwise estimate from points
    const estimatedCashValue = flight.cashAmount
      ? flight.cashAmount * travelers
      : totalPoints * 0.015 + totalFees // rough 1.5 cpp estimate

    // Option B: Direct airline miles from wallet
    if (airlineProgram) {
      let foundDirectMatch = false
      for (const w of wallet) {
        if (w.currency_type !== 'airline_miles') continue
        if (!programNamesMatch(w.program, airlineProgram)) continue

        foundDirectMatch = true
        const cpp = estimatedCashValue > 0 ? (estimatedCashValue - totalFees) / totalPoints * 100 : 1.5
        options.push({
          method: 'direct_miles',
          cashCost: totalFees,
          pointsCost: totalPoints,
          pointsProgram: w.program,
          walletId: w.id,
          estimatedCashValue,
          description: w.balance >= totalPoints
            ? `Use ${totalPoints.toLocaleString()} ${w.program}${totalFees ? ` + $${totalFees.toLocaleString()} fees` : ''} on ${flight.bookingSite}`
            : `Use ${totalPoints.toLocaleString()} ${w.program}${totalFees ? ` + $${totalFees.toLocaleString()} fees` : ''} on ${flight.bookingSite} (need ${(totalPoints - w.balance).toLocaleString()} more miles)`,
          cpp,
        })
      }

      // Always add a baseline "pay points" option so the flight isn't invisible to the optimizer
      if (!foundDirectMatch) {
        const cpp = estimatedCashValue > 0 ? (estimatedCashValue - totalFees) / totalPoints * 100 : 1.5
        const programLabel = airlineProgram || flight.bookingSite || 'airline miles'
        options.push({
          method: 'direct_miles',
          cashCost: totalFees,
          pointsCost: totalPoints,
          pointsProgram: programLabel,
          walletId: '__points_no_wallet__',
          estimatedCashValue,
          description: `Use ${totalPoints.toLocaleString()} ${programLabel}${totalFees ? ` + $${totalFees.toLocaleString()} fees` : ''} on ${flight.bookingSite} (not in your wallet)`,
          cpp,
        })
      }
    } else {
      // No recognized airline program — still add a generic points option
      options.push({
        method: 'direct_miles',
        cashCost: totalFees,
        pointsCost: totalPoints,
        pointsProgram: flight.bookingSite || 'points',
        walletId: '__points_no_wallet__',
        estimatedCashValue,
        description: `Use ${totalPoints.toLocaleString()} points${totalFees ? ` + $${totalFees.toLocaleString()} fees` : ''} on ${flight.bookingSite || 'booking site'}`,
        cpp: estimatedCashValue > 0 ? (estimatedCashValue - totalFees) / totalPoints * 100 : 1.5,
      })
    }

    // Option C: Transfer bank points → airline program
    if (airlineProgram) {
      for (const program of transferPartners) {
        const partner = program.partners.find(p =>
          p.partner.toLowerCase() === airlineProgram.toLowerCase()
        )
        if (!partner) continue

        // Find this bank program in wallet
        for (const w of wallet) {
          if (w.currency_type !== 'bank_points') continue
          if (!programNamesMatch(w.program, program.name)) continue

          const bankPointsNeeded = Math.ceil(totalPoints * partner.ratio[0] / partner.ratio[1])
          const ratioStr = partner.ratio[0] === partner.ratio[1] ? '1:1' : `${partner.ratio[0]}:${partner.ratio[1]}`
          const cpp = estimatedCashValue > 0 ? (estimatedCashValue - totalFees) / bankPointsNeeded * 100 : 1.5

          options.push({
            method: 'transfer',
            cashCost: totalFees,
            pointsCost: bankPointsNeeded,
            pointsProgram: w.program,
            walletId: w.id,
            transferFrom: program.name,
            transferTo: partner.partner,
            transferRatio: ratioStr,
            estimatedCashValue,
            description: w.balance >= bankPointsNeeded
              ? `Transfer ${bankPointsNeeded.toLocaleString()} ${program.name} → ${partner.partner} (${ratioStr}), book on ${flight.bookingSite}${totalFees ? ` + $${totalFees.toLocaleString()} fees` : ''}`
              : `Transfer ${bankPointsNeeded.toLocaleString()} ${program.name} → ${partner.partner} (${ratioStr}), book on ${flight.bookingSite}${totalFees ? ` + $${totalFees.toLocaleString()} fees` : ''} (need ${(bankPointsNeeded - w.balance).toLocaleString()} more pts)`,
            cpp,
          })
        }
      }
    }
  }

  // Option D: Portal booking (use bank points at fixed cpp rate)
  if (flight.cashAmount) {
    const totalCash = flight.cashAmount * travelers
    for (const w of wallet) {
      if (w.currency_type !== 'bank_points') continue
      const programId = matchWalletToProgram(w)
      if (!programId) continue

      const portal = bookingPortals.find(p => p.bankProgram === programId)
      if (!portal) continue

      const cpp = portal.premiumCentsPerPoint || portal.centsPerPoint
      const pointsNeeded = Math.ceil(totalCash / (cpp / 100))

      options.push({
        method: 'portal',
        cashCost: 0,
        pointsCost: pointsNeeded,
        pointsProgram: w.program,
        walletId: w.id,
        portalName: portal.name,
        portalCpp: cpp,
        estimatedCashValue: totalCash,
        description: w.balance >= pointsNeeded
          ? `Book through ${portal.name} for ${pointsNeeded.toLocaleString()} ${w.program} (${cpp} cpp)`
          : `Book through ${portal.name} for ${pointsNeeded.toLocaleString()} ${w.program} (${cpp} cpp) (need ${(pointsNeeded - w.balance).toLocaleString()} more pts)`,
        cpp,
      })
    }
  }

  // Label base options with default tier label if set
  if (flight.defaultTierLabel && flight.pricingTiers && flight.pricingTiers.length > 0) {
    for (const opt of options) {
      opt.tierLabel = flight.defaultTierLabel
      opt.description = `[${flight.defaultTierLabel}] ${opt.description}`
    }
  }

  // Also evaluate pricing tiers (e.g. Business, First class options)
  if (flight.pricingTiers && flight.pricingTiers.length > 0) {
    for (const tier of flight.pricingTiers) {
      const tierFlight: Flight = {
        ...flight,
        paymentType: tier.paymentType,
        cashAmount: tier.cashAmount,
        pointsAmount: tier.pointsAmount,
        feesAmount: tier.feesAmount,
        pricingTiers: undefined, // prevent recursion
      }
      const tierOptions = getPayOptions(tierFlight, wallet, travelers)
      for (const opt of tierOptions) {
        opt.tierLabel = tier.label
        opt.description = `[${tier.label}] ${opt.description}`
      }
      options.push(...tierOptions)
    }
  }

  return options
}

// ── Main Optimizer ──

export function optimizeTrip(
  legs: Leg[],
  flights: Flight[],
  wallet: WalletEntry[],
  travelers: number
): BookingStrategy[] {
  // Group flights by leg
  const flightsByLeg: Record<number, Flight[]> = {}
  for (const f of flights) {
    const idx = f.legIndex ?? -1
    if (!flightsByLeg[idx]) flightsByLeg[idx] = []
    flightsByLeg[idx].push(f)
  }

  // For each leg, pick the best flight options
  // We need at least one flight per leg to have a complete trip
  const legFlights: Flight[][] = []
  const coveredLegs: number[] = []
  const uncoveredLegs: number[] = []

  for (let i = 0; i < legs.length; i++) {
    const assigned = flightsByLeg[i]
    if (assigned && assigned.length > 0) {
      legFlights.push(assigned)
      coveredLegs.push(i)
    } else {
      legFlights.push([])
      uncoveredLegs.push(i)
    }
  }

  // Also include unassigned flights (legIndex = -1 or null)
  const unassigned = flightsByLeg[-1] || []

  // Build strategies
  const strategies: BookingStrategy[] = []

  // For each leg, get pay options for EACH flight in that leg.
  // All flights in a leg are needed (they form a connecting itinerary),
  // so we book ALL of them, choosing the best payment for each.
  type FlightPayOptions = { flight: Flight; payOptions: PayOption[] }
  const legFlightOptions: FlightPayOptions[][] = [] // [legIndex][flightInLeg]

  for (let i = 0; i < legs.length; i++) {
    const flightsForLeg = legFlights[i]
    const flightOpts: FlightPayOptions[] = []
    for (const f of flightsForLeg) {
      const payOpts = getPayOptions(f, wallet, travelers)
      flightOpts.push({ flight: f, payOptions: payOpts })
    }
    legFlightOptions.push(flightOpts)
  }

  // Strategy 1: BEST VALUE — maximize cpp
  const bestValue = buildStrategy('best-value', 'Best Value',
    'Maximize the value of your points — use them where you get the highest cents-per-point, pay cash elsewhere.',
    legFlightOptions, wallet, legs, uncoveredLegs, 'best_cpp')
  if (bestValue) strategies.push(bestValue)

  // Strategy 2: LOWEST CASH — minimize out-of-pocket
  const lowestCash = buildStrategy('lowest-cash', 'Lowest Cash Out-of-Pocket',
    'Minimize cash spending — use points and transfers wherever possible.',
    legFlightOptions, wallet, legs, uncoveredLegs, 'min_cash')
  if (lowestCash) strategies.push(lowestCash)

  // Strategy 3: ALL CASH — baseline comparison
  const allCash = buildStrategy('all-cash', 'All Cash',
    'Pay cash for everything — use this as a baseline to see how much your points save.',
    legFlightOptions, wallet, legs, uncoveredLegs, 'all_cash')
  if (allCash) strategies.push(allCash)

  // Tag strategies
  if (strategies.length > 0) {
    const bestCpp = strategies.reduce((a, b) => a.estimatedCpp > b.estimatedCpp ? a : b)
    if (!bestCpp.tags.includes('Best Value')) bestCpp.tags.push('Best Value')
    const lowestCashStrategy = strategies.reduce((a, b) => a.totalCash < b.totalCash ? a : b)
    if (!lowestCashStrategy.tags.includes('Lowest Cash')) lowestCashStrategy.tags.push('Lowest Cash')
  }

  return strategies
}

// Pick the best payment option for a single flight given the mode and wallet state
function pickPayOption(
  payOptions: PayOption[],
  walletUsage: Record<string, number>,
  wallet: WalletEntry[],
  mode: 'best_cpp' | 'min_cash' | 'all_cash'
): { chosen: PayOption; warnings: string[] } {
  const warnings: string[] = []

  // Filter affordable options
  let affordable = payOptions.filter(o => {
    if (o.walletId === '__cash__' || o.walletId === '__points_no_wallet__') return true
    const used = walletUsage[o.walletId] || 0
    const w = wallet.find(we => we.id === o.walletId)
    if (!w) return true
    return (w.balance - used) >= o.pointsCost
  })

  if (affordable.length === 0) {
    // Check for insufficient balance
    const pointsOpts = payOptions.filter(o => o.method !== 'cash')
    if (pointsOpts.length > 0) {
      const best = [...pointsOpts].sort((a, b) => b.cpp - a.cpp)[0]
      const used = walletUsage[best.walletId] || 0
      const w = wallet.find(we => we.id === best.walletId)
      const available = w ? w.balance - used : 0
      warnings.push(`Insufficient ${best.pointsProgram} (have ${available.toLocaleString()}, need ${best.pointsCost.toLocaleString()})`)
    }
    // Fall back to cash
    const cashOpt = payOptions.find(o => o.method === 'cash')
    if (cashOpt) {
      affordable = [cashOpt]
    } else {
      // No cash option either — use the first available option
      affordable = [payOptions[0]]
    }
  }

  let chosen: PayOption
  if (mode === 'all_cash') {
    chosen = affordable.find(o => o.method === 'cash')
      || affordable.find(o => o.method === 'portal')
      || affordable[0]
  } else if (mode === 'min_cash') {
    chosen = [...affordable].sort((a, b) => {
      const cashDiff = a.cashCost - b.cashCost
      if (cashDiff !== 0) return cashDiff
      return b.cpp - a.cpp
    })[0]
  } else {
    // best_cpp
    const pointsOpts = affordable.filter(o => o.method !== 'cash' && o.cpp > 0)
    if (pointsOpts.length > 0) {
      chosen = [...pointsOpts].sort((a, b) => b.cpp - a.cpp)[0]
    } else {
      chosen = [...affordable].sort((a, b) => a.cashCost - b.cashCost)[0]
    }
  }

  return { chosen, warnings }
}

function buildStrategy(
  id: string,
  name: string,
  description: string,
  legFlightOptions: { flight: Flight; payOptions: PayOption[] }[][],
  wallet: WalletEntry[],
  legs: Leg[],
  uncoveredLegs: number[],
  mode: 'best_cpp' | 'min_cash' | 'all_cash'
): BookingStrategy | null {
  const bookings: FlightBooking[] = []
  const walletUsage: Record<string, number> = {}
  let totalCash = 0
  let totalPoints = 0
  let totalEstimatedValue = 0
  const warnings: string[] = []

  for (let legIdx = 0; legIdx < legFlightOptions.length; legIdx++) {
    const flightsInLeg = legFlightOptions[legIdx]
    if (flightsInLeg.length === 0) {
      warnings.push(`No flights for ${legs[legIdx].from} → ${legs[legIdx].to}`)
      continue
    }

    // Book EVERY flight in this leg (they're all part of the connecting itinerary)
    for (const { flight, payOptions } of flightsInLeg) {
      if (payOptions.length === 0) {
        warnings.push(`No booking options for ${getFlightLabel(flight)}`)
        continue
      }

      const { chosen: po, warnings: flightWarnings } = pickPayOption(payOptions, walletUsage, wallet, mode)
      for (const w of flightWarnings) {
        warnings.push(`${getFlightLabel(flight)}: ${w}`)
      }

      // Track wallet usage
      if (po.walletId !== '__cash__' && po.walletId !== '__points_no_wallet__') {
        walletUsage[po.walletId] = (walletUsage[po.walletId] || 0) + po.pointsCost
      }

      totalCash += po.cashCost
      totalPoints += po.pointsCost
      totalEstimatedValue += po.estimatedCashValue

      bookings.push({
        flightId: flight.id,
        flightLabel: getFlightLabel(flight),
        legIndex: legIdx,
        method: po.method,
        cashCost: po.cashCost,
        pointsCost: po.pointsCost,
        pointsProgram: po.pointsProgram,
        transferFrom: po.transferFrom,
        transferTo: po.transferTo,
        transferRatio: po.transferRatio,
        portalName: po.portalName,
        portalCpp: po.portalCpp,
        description: po.description,
        tierLabel: po.tierLabel,
      })
    }
  }

  if (bookings.length === 0) return null

  // Calculate overall cpp
  const estimatedCpp = totalPoints > 0 ? ((totalEstimatedValue - totalCash) / totalPoints) * 100 : 0

  // Calculate savings vs all-cash: for each booking, find the cash price of that same flight
  const allCashCost = bookings.reduce((sum, b) => {
    const legFlights = legFlightOptions[b.legIndex]
    const flightEntry = legFlights?.find(fo => fo.flight.id === b.flightId)
    const cashOpt = flightEntry?.payOptions.find(o => o.method === 'cash')
    return sum + (cashOpt?.cashCost || b.cashCost)
  }, 0)

  if (uncoveredLegs.length > 0) {
    warnings.push(`${uncoveredLegs.length} leg(s) have no flights assigned yet — assign flights in the Plan tab first`)
  }

  return {
    id, name, description, bookings, totalCash, totalPoints,
    estimatedValue: totalEstimatedValue,
    estimatedCpp: Math.round(estimatedCpp * 10) / 10,
    savingsVsCash: Math.max(0, allCashCost - totalCash),
    warnings, tags: [],
  }
}

// Get relevant sweet spots for a trip's flights
export function getRelevantSweetSpots(flights: Flight[]): typeof sweetSpots[number][] {
  const airlineIatas = new Set<string>()
  for (const f of flights) {
    for (const s of f.segments || []) {
      if (s.flightCode) {
        // Extract airline IATA from flight code (e.g. "UA123" → "UA")
        const iata = s.flightCode.replace(/\d+/g, '').trim()
        if (iata) airlineIatas.add(iata)
      }
    }
  }

  // Find sweet spots relevant to these airlines
  const relevant: typeof sweetSpots[number][] = []
  for (const spot of sweetSpots) {
    for (const iata of airlineIatas) {
      const program = findProgramByIata(iata)
      if (program && spot.programs.some(p =>
        p.toLowerCase().includes(program.programName.toLowerCase().split(' ')[0]) ||
        program.programName.toLowerCase().includes(p.toLowerCase().split(' ')[0])
      )) {
        if (!relevant.includes(spot)) relevant.push(spot)
      }
    }
  }

  return relevant
}

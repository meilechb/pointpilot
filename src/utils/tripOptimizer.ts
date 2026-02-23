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

type Flight = {
  id: string
  legIndex: number | null
  segments: Segment[]
  bookingSite: string
  paymentType: 'cash' | 'points'
  cashAmount: number | null
  pointsAmount: number | null
  feesAmount: number | null
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

// Match a wallet entry to a bank program in transferPartners
function matchWalletToProgram(wallet: WalletEntry): string | null {
  if (wallet.currency_type !== 'bank_points') return null
  const lower = wallet.program.toLowerCase()
  for (const p of transferPartners) {
    if (lower.includes(p.name.toLowerCase().split(' ')[0])) return p.id
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
}

function resolveAirlineProgram(bookingSite: string): string | null {
  const lower = (bookingSite || '').toLowerCase().trim()
  if (SITE_TO_PROGRAM[lower]) return SITE_TO_PROGRAM[lower]
  for (const [key, value] of Object.entries(SITE_TO_PROGRAM)) {
    if (lower.includes(key) || key.includes(lower)) return value
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
      for (const w of wallet) {
        if (w.currency_type !== 'airline_miles') continue
        if (!w.program.toLowerCase().includes(airlineProgram.toLowerCase().split(' ')[0])) continue
        if (w.balance < totalPoints) continue

        const cpp = estimatedCashValue > 0 ? (estimatedCashValue - totalFees) / totalPoints * 100 : 1.5
        options.push({
          method: 'direct_miles',
          cashCost: totalFees,
          pointsCost: totalPoints,
          pointsProgram: w.program,
          walletId: w.id,
          estimatedCashValue,
          description: `Use ${totalPoints.toLocaleString()} ${w.program}${totalFees ? ` + $${totalFees.toLocaleString()} fees` : ''} on ${flight.bookingSite}`,
          cpp,
        })
      }
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
          if (!w.program.toLowerCase().includes(program.name.toLowerCase().split(' ')[0])) continue

          const bankPointsNeeded = Math.ceil(totalPoints * partner.ratio[0] / partner.ratio[1])
          if (w.balance < bankPointsNeeded) continue

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
            description: `Transfer ${bankPointsNeeded.toLocaleString()} ${program.name} → ${partner.partner} (${ratioStr}), book on ${flight.bookingSite}${totalFees ? ` + $${totalFees.toLocaleString()} fees` : ''}`,
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
      if (w.balance < pointsNeeded) continue

      options.push({
        method: 'portal',
        cashCost: 0,
        pointsCost: pointsNeeded,
        pointsProgram: w.program,
        walletId: w.id,
        portalName: portal.name,
        portalCpp: cpp,
        estimatedCashValue: totalCash,
        description: `Book through ${portal.name} for ${pointsNeeded.toLocaleString()} ${w.program} (${cpp} cpp)`,
        cpp,
      })
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

  // For each flight option per leg, get all pay options
  // Then compose strategies: Best Value, Lowest Cash, Points Maximizer

  // Collect all flight+payOption combos per leg
  type LegOption = { flight: Flight; payOption: PayOption; legIndex: number }
  const allLegOptions: LegOption[][] = []

  for (let i = 0; i < legs.length; i++) {
    const legOpts: LegOption[] = []
    const flightsForLeg = legFlights[i]

    for (const f of flightsForLeg) {
      const payOpts = getPayOptions(f, wallet, travelers)
      for (const po of payOpts) {
        legOpts.push({ flight: f, payOption: po, legIndex: i })
      }
    }

    // Also check unassigned flights that might work for this leg
    // (skip for now — user should assign flights to legs first)

    allLegOptions.push(legOpts)
  }

  // Check if we have options for every leg
  const hasAllLegs = allLegOptions.every(opts => opts.length > 0)

  if (!hasAllLegs) {
    // Not all legs covered — still generate what we can
    // but warn the user
  }

  // Strategy 1: BEST VALUE — maximize cpp (use points where they get best value, cash where not)
  const bestValue = buildStrategy(
    'best-value',
    'Best Value',
    'Maximize the value of your points — use them where you get the highest cents-per-point, pay cash elsewhere.',
    allLegOptions,
    wallet,
    legs,
    uncoveredLegs,
    'best_cpp'
  )
  if (bestValue) strategies.push(bestValue)

  // Strategy 2: LOWEST CASH — minimize out-of-pocket cash
  const lowestCash = buildStrategy(
    'lowest-cash',
    'Lowest Cash Out-of-Pocket',
    'Minimize cash spending — use points and transfers wherever possible.',
    allLegOptions,
    wallet,
    legs,
    uncoveredLegs,
    'min_cash'
  )
  if (lowestCash) strategies.push(lowestCash)

  // Strategy 3: ALL CASH — just pay cash for everything (baseline comparison)
  const allCash = buildStrategy(
    'all-cash',
    'All Cash',
    'Pay cash for everything — use this as a baseline to see how much your points save.',
    allLegOptions,
    wallet,
    legs,
    uncoveredLegs,
    'all_cash'
  )
  if (allCash) strategies.push(allCash)

  // Sort: best value first, then lowest cash, then all cash
  // Tag them
  if (strategies.length > 0) {
    // Find the one with best cpp
    const bestCpp = strategies.reduce((a, b) => a.estimatedCpp > b.estimatedCpp ? a : b)
    if (!bestCpp.tags.includes('Best Value')) bestCpp.tags.push('Best Value')

    // Find lowest cash
    const lowestCashStrategy = strategies.reduce((a, b) => a.totalCash < b.totalCash ? a : b)
    if (!lowestCashStrategy.tags.includes('Lowest Cash')) lowestCashStrategy.tags.push('Lowest Cash')
  }

  return strategies
}

function buildStrategy(
  id: string,
  name: string,
  description: string,
  allLegOptions: { flight: Flight; payOption: PayOption; legIndex: number }[][],
  wallet: WalletEntry[],
  legs: Leg[],
  uncoveredLegs: number[],
  mode: 'best_cpp' | 'min_cash' | 'all_cash'
): BookingStrategy | null {
  const bookings: FlightBooking[] = []
  const walletUsage: Record<string, number> = {} // walletId → points used
  let totalCash = 0
  let totalPoints = 0
  let totalEstimatedValue = 0
  const warnings: string[] = []

  for (let legIdx = 0; legIdx < allLegOptions.length; legIdx++) {
    const opts = allLegOptions[legIdx]
    if (opts.length === 0) {
      warnings.push(`No flight options for ${legs[legIdx].from} → ${legs[legIdx].to}`)
      continue
    }

    // Filter options that we can still afford (wallet not depleted)
    const affordable = opts.filter(o => {
      if (o.payOption.walletId === '__cash__') return true
      const used = walletUsage[o.payOption.walletId] || 0
      const w = wallet.find(w => w.id === o.payOption.walletId)
      if (!w) return true
      return (w.balance - used) >= o.payOption.pointsCost
    })

    if (affordable.length === 0) {
      // Fall back to any cash option
      const cashOpt = opts.find(o => o.payOption.method === 'cash')
      if (cashOpt) {
        affordable.push(cashOpt)
      } else {
        warnings.push(`Cannot afford any option for ${legs[legIdx].from} → ${legs[legIdx].to}`)
        continue
      }
    }

    // Pick the best option based on mode
    let chosen: typeof affordable[0]

    if (mode === 'all_cash') {
      // Prefer cash, then portal, then anything
      chosen = affordable.find(o => o.payOption.method === 'cash')
        || affordable.find(o => o.payOption.method === 'portal')
        || affordable[0]
    } else if (mode === 'min_cash') {
      // Sort by lowest cash cost, then by highest cpp
      chosen = affordable.sort((a, b) => {
        const cashDiff = a.payOption.cashCost - b.payOption.cashCost
        if (cashDiff !== 0) return cashDiff
        return b.payOption.cpp - a.payOption.cpp
      })[0]
    } else {
      // best_cpp: prefer points options with highest cpp, but only if cpp > portal rate
      const pointsOpts = affordable.filter(o => o.payOption.method !== 'cash' && o.payOption.cpp > 0)
      if (pointsOpts.length > 0) {
        chosen = pointsOpts.sort((a, b) => b.payOption.cpp - a.payOption.cpp)[0]
      } else {
        chosen = affordable.sort((a, b) => a.payOption.cashCost - b.payOption.cashCost)[0]
      }
    }

    // Record this choice
    const po = chosen.payOption
    if (po.walletId !== '__cash__') {
      walletUsage[po.walletId] = (walletUsage[po.walletId] || 0) + po.pointsCost
    }

    totalCash += po.cashCost
    totalPoints += po.pointsCost
    totalEstimatedValue += po.estimatedCashValue

    bookings.push({
      flightId: chosen.flight.id,
      flightLabel: getFlightLabel(chosen.flight),
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
    })
  }

  if (bookings.length === 0) return null

  // Calculate overall cpp
  const estimatedCpp = totalPoints > 0 ? ((totalEstimatedValue - totalCash) / totalPoints) * 100 : 0

  // Calculate savings vs all-cash
  const allCashCost = bookings.reduce((sum, b) => {
    const flight = allLegOptions[b.legIndex]?.find(o => o.flight.id === b.flightId)
    const cashOpt = flight ? allLegOptions[b.legIndex].find(o => o.flight.id === b.flightId && o.payOption.method === 'cash') : null
    return sum + (cashOpt?.payOption.cashCost || b.cashCost)
  }, 0)

  if (uncoveredLegs.length > 0) {
    warnings.push(`${uncoveredLegs.length} leg(s) have no flights assigned yet — assign flights in the Plan tab first`)
  }

  return {
    id,
    name,
    description,
    bookings,
    totalCash,
    totalPoints,
    estimatedValue: totalEstimatedValue,
    estimatedCpp: Math.round(estimatedCpp * 10) / 10,
    savingsVsCash: Math.max(0, allCashCost - totalCash),
    warnings,
    tags: [],
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

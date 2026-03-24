// Route Points Advisor — Recommendation Engine
// Cross-references user's wallet against every possible booking path for a route
// Returns ranked options showing points needed, fees, CPP, transfer path, and booking steps

import { transferPartners, findProgramsForPartner } from '@/data/transferPartners'
import {
  findBookablePrograms,
  findProgramByIata,
  pointValuations,
  airlinePrograms,
  alliances,
  bookingPortals,
  type AirlineProgram,
} from '@/data/pointsKnowledge'

// ── Types ──

export type WalletEntry = {
  id: string
  currency_type: 'bank_points' | 'airline_miles' | 'cashback' | 'cash'
  program: string
  balance: number
  redemption_value: number | null
  notes: string
}

export type TransferBonus = {
  bank_program: string
  partner: string
  bonus_percent: number
  expires_at: string | null
  notes: string | null
}

export type AwardChartEntry = {
  id: string
  program_name: string
  origin_region: string
  destination_region: string
  cabin_class: string
  pricing_type: 'fixed' | 'dynamic' | 'mixed'
  points_min: number
  points_max: number | null
  is_one_way: boolean
  partner_airlines: string[] | null
  notes: string | null
}

export type RouteRegion = {
  id: string
  region_name: string
  program_name: string | null
  airport_codes: string[] | null
  country_codes: string[] | null
}

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

export type ProgramRule = {
  id: string
  program_name: string
  rule_type: string
  rule_value: Record<string, unknown>
  notes: string | null
}

export type RecommendationRequest = {
  origin: string
  destination: string
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first'
  travelers: number
  wallet: WalletEntry[]
  transferBonuses: TransferBonus[]
  // DB data passed in from the API route
  awardCharts: AwardChartEntry[]
  routeRegions: RouteRegion[]
  surchargeProfiles: SurchargeProfile[]
  programRules: ProgramRule[]
}

export type BookingRecommendation = {
  rank: number
  bookingProgram: string
  operatingAirline: string
  pointsRequired: number
  pointsSource: 'direct' | 'transfer' | 'portal'
  transferPath?: {
    fromProgram: string
    toProgram: string
    ratio: string
    bonusPercent: number
    bankPointsNeeded: number
    transferTimeHours?: number
  }
  estimatedFees: number
  estimatedCpp: number
  surchargeLevel: string
  surchargeWarning?: string
  warnings: string[]
  bookingSteps: string[]
  tags: string[]
  canAfford: boolean
  shortfall?: number
  cabinClass: string
}

// ── Helpers ──

function resolveRegions(airport: string, routeRegions: RouteRegion[]): string[] {
  const regions: string[] = []
  for (const r of routeRegions) {
    if (r.airport_codes?.includes(airport)) {
      regions.push(r.region_name)
    }
  }
  // If no specific match, try common region fallbacks based on airport code patterns
  if (regions.length === 0) {
    // Common US airports
    const usAirports = ['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'ATL', 'DFW', 'SEA', 'BOS', 'DCA', 'IAD', 'EWR', 'LGA', 'IAH', 'DEN', 'PHX', 'MSP', 'DTW', 'PHL', 'CLT', 'FLL', 'MCO', 'TPA', 'SAN', 'SJC', 'OAK', 'BWI', 'MDW', 'HNL']
    if (usAirports.includes(airport)) regions.push('North America')
  }
  return regions.length > 0 ? regions : ['Unknown']
}

function programNamesMatch(a: string, b: string): boolean {
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return true
  if (la.includes(lb) || lb.includes(la)) return true
  const wordsA = la.split(/[\s\-]+/).filter(w => w.length >= 3)
  const wordsB = lb.split(/[\s\-]+/).filter(w => w.length >= 3)
  if (wordsB.length > 0 && wordsB.every(w => la.includes(w))) return true
  if (wordsA.length > 0 && wordsA.every(w => lb.includes(w))) return true
  return false
}

function estimateCashValue(cabinClass: string, isTransatlantic: boolean): number {
  // Rough cash value estimates for one-way flights
  if (cabinClass === 'first') return isTransatlantic ? 6000 : 3000
  if (cabinClass === 'business') return isTransatlantic ? 3500 : 1500
  if (cabinClass === 'premium_economy') return isTransatlantic ? 1200 : 600
  return isTransatlantic ? 500 : 250 // economy
}

function findMatchingCharts(
  programName: string,
  originRegions: string[],
  destRegions: string[],
  cabinClass: string,
  awardCharts: AwardChartEntry[],
): AwardChartEntry[] {
  return awardCharts.filter(c => {
    if (!programNamesMatch(c.program_name, programName)) return false
    if (c.cabin_class !== cabinClass) return false
    const originMatch = originRegions.some(r => r.toLowerCase() === c.origin_region.toLowerCase())
    const destMatch = destRegions.some(r => r.toLowerCase() === c.destination_region.toLowerCase())
    return originMatch && destMatch
  })
}

function findSurcharge(
  bookingProgram: string,
  operatingIata: string,
  surchargeProfiles: SurchargeProfile[],
): SurchargeProfile | null {
  return surchargeProfiles.find(s =>
    programNamesMatch(s.booking_program, bookingProgram) &&
    s.operating_airline === operatingIata
  ) || null
}

function getTransferTimeRule(programName: string, programRules: ProgramRule[]): number | null {
  const rule = programRules.find(r =>
    programNamesMatch(r.program_name, programName) && r.rule_type === 'transfer_time'
  )
  if (rule?.rule_value && typeof rule.rule_value === 'object') {
    return (rule.rule_value as { typical_hours?: number }).typical_hours ?? null
  }
  return null
}

// ── Main Engine ──

export function generateRecommendations(req: RecommendationRequest): BookingRecommendation[] {
  const {
    origin, destination, cabinClass, travelers, wallet,
    transferBonuses, awardCharts, routeRegions, surchargeProfiles, programRules,
  } = req

  const originRegions = resolveRegions(origin, routeRegions)
  const destRegions = resolveRegions(destination, routeRegions)
  const isLongHaul = originRegions[0] !== destRegions[0]
  const estCashValue = estimateCashValue(cabinClass, isLongHaul)

  // Find airlines likely operating this route (we use all airlines as candidates
  // since we don't have live route data — the award charts filter will narrow it down)
  const allBookablePrograms = new Set<string>()
  // Collect all programs that have award chart entries for this route
  for (const chart of awardCharts) {
    if (chart.cabin_class !== cabinClass) continue
    const originMatch = originRegions.some(r => r.toLowerCase() === chart.origin_region.toLowerCase())
    const destMatch = destRegions.some(r => r.toLowerCase() === chart.destination_region.toLowerCase())
    if (originMatch && destMatch) {
      allBookablePrograms.add(chart.program_name)
    }
  }

  // Also check all airline programs and their bookable programs
  // to catch programs that might not be in the award_charts table yet
  for (const ap of airlinePrograms) {
    const bookable = findBookablePrograms(ap.iataCode)
    for (const prog of bookable) {
      allBookablePrograms.add(prog)
    }
  }

  const recommendations: BookingRecommendation[] = []

  for (const bookingProgram of allBookablePrograms) {
    // Find award chart pricing for this program on this route
    const charts = findMatchingCharts(bookingProgram, originRegions, destRegions, cabinClass, awardCharts)

    // If we have chart data, use it; otherwise use valuation-based estimate
    let pointsNeeded: number
    let pricingNote: string

    if (charts.length > 0) {
      // Use the best (lowest) chart pricing
      const bestChart = charts.reduce((a, b) => a.points_min < b.points_min ? a : b)
      pointsNeeded = bestChart.points_min * travelers
      pricingNote = bestChart.pricing_type === 'dynamic'
        ? `${bestChart.points_min.toLocaleString()}-${(bestChart.points_max || bestChart.points_min).toLocaleString()} miles (dynamic)`
        : `${bestChart.points_min.toLocaleString()} miles`
    } else {
      // Estimate from point valuations
      const valuation = pointValuations.find(v => programNamesMatch(v.program, bookingProgram))
      const cpp = valuation?.centsPerPoint || 1.3
      pointsNeeded = Math.ceil((estCashValue * 100) / cpp) * travelers
      pricingNote = `~${pointsNeeded.toLocaleString()} miles (estimated)`
    }

    // Find which airline this program primarily operates
    const programInfo = airlinePrograms.find(ap => programNamesMatch(ap.programName, bookingProgram))
    const operatingAirline = programInfo?.airline || bookingProgram
    const operatingIata = programInfo?.iataCode || ''

    // Check surcharges
    const surcharge = findSurcharge(bookingProgram, operatingIata, surchargeProfiles)
    const surchargeAmount = surcharge ? Number(surcharge.estimated_surcharge_usd) * travelers : 0
    const surchargeLevel = surcharge?.surcharge_level || 'none'
    const baseFees = surchargeAmount

    // Path 1: Direct airline miles from wallet
    for (const w of wallet) {
      if (w.currency_type !== 'airline_miles') continue
      if (!programNamesMatch(w.program, bookingProgram)) continue

      const canAfford = w.balance >= pointsNeeded
      const cpp = estCashValue > 0 ? ((estCashValue * travelers - baseFees) / pointsNeeded) * 100 : 1.5

      recommendations.push({
        rank: 0,
        bookingProgram,
        operatingAirline,
        pointsRequired: pointsNeeded,
        pointsSource: 'direct',
        estimatedFees: baseFees,
        estimatedCpp: Math.round(cpp * 10) / 10,
        surchargeLevel,
        surchargeWarning: surchargeLevel === 'high' || surchargeLevel === 'extreme'
          ? `High fuel surcharges (~$${surchargeAmount.toLocaleString()}) when booking through ${bookingProgram}`
          : undefined,
        warnings: [],
        bookingSteps: [
          `Log into ${bookingProgram}`,
          `Search for ${origin} → ${destination} in ${cabinClass}`,
          `Book with ${pointsNeeded.toLocaleString()} ${w.program} (${pricingNote})`,
          baseFees > 0 ? `Pay $${baseFees.toLocaleString()} in taxes/fees` : 'Minimal taxes/fees',
        ],
        tags: canAfford ? ['Can Afford'] : [],
        canAfford,
        shortfall: canAfford ? undefined : pointsNeeded - w.balance,
        cabinClass,
      })
    }

    // Path 2: Transfer bank points → airline program
    for (const bankProg of transferPartners) {
      const partner = bankProg.partners.find(p => programNamesMatch(p.partner, bookingProgram))
      if (!partner) continue

      for (const w of wallet) {
        if (w.currency_type !== 'bank_points') continue
        if (!programNamesMatch(w.program, bankProg.name)) continue

        // Check for active transfer bonus
        const bonus = transferBonuses.find(b =>
          programNamesMatch(b.bank_program, bankProg.name) &&
          programNamesMatch(b.partner, partner.partner) &&
          (!b.expires_at || new Date(b.expires_at) > new Date())
        )
        const bonusPct = bonus ? bonus.bonus_percent : 0
        const effectiveRatio: [number, number] = bonusPct > 0
          ? [partner.ratio[0], Math.round(partner.ratio[1] * (1 + bonusPct / 100))]
          : partner.ratio
        const bankPointsNeeded = Math.ceil(pointsNeeded * effectiveRatio[0] / effectiveRatio[1])
        const ratioStr = effectiveRatio[0] === effectiveRatio[1] ? '1:1' : `${effectiveRatio[0]}:${effectiveRatio[1]}`
        const bonusLabel = bonusPct > 0 ? ` (+${bonusPct}% bonus!)` : ''

        const canAfford = w.balance >= bankPointsNeeded
        const cpp = estCashValue > 0 ? ((estCashValue * travelers - baseFees) / bankPointsNeeded) * 100 : 1.5
        const transferTime = getTransferTimeRule(bookingProgram, programRules)

        const steps = [
          `Transfer ${bankPointsNeeded.toLocaleString()} ${bankProg.name} → ${partner.partner} (${ratioStr}${bonusLabel})`,
          transferTime ? `Wait ~${transferTime} hours for transfer to complete` : 'Transfer typically completes in 1-2 days',
          `Log into ${bookingProgram} and search ${origin} → ${destination}`,
          `Book ${cabinClass} with ${pointsNeeded.toLocaleString()} miles`,
          baseFees > 0 ? `Pay $${baseFees.toLocaleString()} in taxes/fees` : 'Minimal taxes/fees',
        ]

        const tags: string[] = []
        if (canAfford) tags.push('Can Afford')
        if (bonusPct > 0) tags.push(`${bonusPct}% Transfer Bonus`)
        if (surchargeLevel === 'none' || surchargeLevel === 'low') tags.push('Low Surcharges')

        recommendations.push({
          rank: 0,
          bookingProgram,
          operatingAirline,
          pointsRequired: bankPointsNeeded,
          pointsSource: 'transfer',
          transferPath: {
            fromProgram: bankProg.name,
            toProgram: partner.partner,
            ratio: ratioStr,
            bonusPercent: bonusPct,
            bankPointsNeeded,
            transferTimeHours: transferTime ?? undefined,
          },
          estimatedFees: baseFees,
          estimatedCpp: Math.round(cpp * 10) / 10,
          surchargeLevel,
          surchargeWarning: surchargeLevel === 'high' || surchargeLevel === 'extreme'
            ? `High fuel surcharges (~$${surchargeAmount.toLocaleString()}) when booking through ${bookingProgram}`
            : undefined,
          warnings: [],
          bookingSteps: steps,
          tags,
          canAfford,
          shortfall: canAfford ? undefined : bankPointsNeeded - w.balance,
          cabinClass,
        })
      }
    }

    // Path 3: Portal booking
    for (const w of wallet) {
      if (w.currency_type !== 'bank_points') continue
      const progId = transferPartners.find(p => programNamesMatch(w.program, p.name))?.id
      if (!progId) continue
      const portal = bookingPortals.find(p => p.bankProgram === progId)
      if (!portal) continue

      const cpp = portal.premiumCentsPerPoint || portal.centsPerPoint
      const cashCost = estCashValue * travelers
      const portalPointsNeeded = Math.ceil(cashCost / (cpp / 100))
      const canAfford = w.balance >= portalPointsNeeded

      recommendations.push({
        rank: 0,
        bookingProgram: portal.name,
        operatingAirline: 'Any airline',
        pointsRequired: portalPointsNeeded,
        pointsSource: 'portal',
        estimatedFees: 0,
        estimatedCpp: cpp,
        surchargeLevel: 'none',
        warnings: [],
        bookingSteps: [
          `Log into ${portal.name}`,
          `Search for ${origin} → ${destination} in ${cabinClass}`,
          `Book with ${portalPointsNeeded.toLocaleString()} ${w.program} at ${cpp} cpp`,
        ],
        tags: canAfford ? ['Can Afford', 'No Surcharges', 'No Transfer Needed'] : ['No Surcharges', 'No Transfer Needed'],
        canAfford,
        shortfall: canAfford ? undefined : portalPointsNeeded - w.balance,
        cabinClass,
      })
    }
  }

  // Rank: prioritize affordable options, then by CPP descending
  recommendations.sort((a, b) => {
    // Affordable first
    if (a.canAfford && !b.canAfford) return -1
    if (!a.canAfford && b.canAfford) return 1
    // Higher CPP is better
    return b.estimatedCpp - a.estimatedCpp
  })

  // Assign ranks and tag top options
  recommendations.forEach((r, i) => {
    r.rank = i + 1
  })

  // Tag best value and lowest fees among affordable options
  const affordable = recommendations.filter(r => r.canAfford)
  if (affordable.length > 0) {
    const bestCpp = affordable.reduce((a, b) => a.estimatedCpp > b.estimatedCpp ? a : b)
    if (!bestCpp.tags.includes('Best Value')) bestCpp.tags.push('Best Value')
    const lowestFees = affordable.reduce((a, b) => a.estimatedFees < b.estimatedFees ? a : b)
    if (!lowestFees.tags.includes('Lowest Fees')) lowestFees.tags.push('Lowest Fees')
  }

  // Deduplicate: if same booking program + same source from same wallet, keep best CPP
  const seen = new Map<string, BookingRecommendation>()
  const deduped: BookingRecommendation[] = []
  for (const r of recommendations) {
    const key = `${r.bookingProgram}|${r.pointsSource}|${r.transferPath?.fromProgram || 'direct'}`
    const existing = seen.get(key)
    if (!existing || r.estimatedCpp > existing.estimatedCpp) {
      seen.set(key, r)
    }
  }
  for (const r of seen.values()) {
    deduped.push(r)
  }

  // Re-sort and re-rank after dedup
  deduped.sort((a, b) => {
    if (a.canAfford && !b.canAfford) return -1
    if (!a.canAfford && b.canAfford) return 1
    return b.estimatedCpp - a.estimatedCpp
  })
  deduped.forEach((r, i) => { r.rank = i + 1 })

  return deduped
}

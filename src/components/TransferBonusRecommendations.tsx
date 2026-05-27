'use client'

import { transferPartners } from '@/data/transferPartners'
import { sweetSpots } from '@/data/pointsKnowledge'

type Bonus = {
  id: string
  bank_program: string
  partner: string
  bonus_percent: number
  expires_at: string | null
  notes: string | null
}

type WalletEntry = {
  id: string
  currency_type: 'bank_points' | 'airline_miles' | 'cashback' | 'cash'
  program: string
  balance: number
  redemption_value: number | null
  notes: string
}

type Props = {
  bonuses: Bonus[]
  entries: WalletEntry[]
}

type Recommendation = {
  bonus: Bonus
  walletEntry: WalletEntry
  transferRatio: [number, number]
  milesAfterBonus: number
  matchingSweetSpots: {
    title: string
    routes: string
    milesNeeded: number | null
    shortfall: number
  }[]
}

/** Case-insensitive substring match in either direction */
function programNamesMatch(a: string, b: string): boolean {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  return al.includes(bl) || bl.includes(al)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Extract a short name from a full program name, e.g. "Chase Ultimate Rewards" -> "Chase UR" */
function shortName(program: string): string {
  const abbrevMap: Record<string, string> = {
    'Chase Ultimate Rewards': 'Chase UR',
    'Amex Membership Rewards': 'Amex MR',
    'Citi ThankYou Points': 'Citi TYP',
    'Capital One Miles': 'Cap One',
    'Bilt Rewards': 'Bilt',
  }
  for (const [full, short] of Object.entries(abbrevMap)) {
    if (programNamesMatch(program, full)) return short
  }
  // Fallback: first word
  return program.split(' ')[0]
}

function shortPartnerName(partner: string): string {
  const abbrevMap: Record<string, string> = {
    'Virgin Atlantic Flying Club': 'Virgin Atlantic',
    'British Airways Executive Club': 'BA Avios',
    'Air France-KLM Flying Blue': 'Flying Blue',
    'Singapore Airlines KrisFlyer': 'KrisFlyer',
    'Air Canada Aeroplan': 'Aeroplan',
    'Turkish Airlines Miles&Smiles': 'Turkish M&S',
    'Emirates Skywards': 'Emirates',
    'Alaska Airlines Mileage Plan': 'Alaska',
    'Cathay Pacific Asia Miles': 'Asia Miles',
    'United MileagePlus': 'United',
    'Delta SkyMiles': 'Delta',
    'ANA Mileage Club': 'ANA',
    'Avianca LifeMiles': 'LifeMiles',
    'Qatar Airways Privilege Club': 'Qatar Avios',
    'Qantas Frequent Flyer': 'Qantas',
    'JetBlue TrueBlue': 'JetBlue',
    'Southwest Rapid Rewards': 'Southwest',
    'Iberia Plus': 'Iberia Avios',
    'Etihad Guest': 'Etihad',
    'Aer Lingus AerClub': 'Aer Lingus',
    'Aeromexico Rewards': 'Aeromexico',
  }
  for (const [full, short] of Object.entries(abbrevMap)) {
    if (programNamesMatch(partner, full)) return short
  }
  return partner.split(' ')[0]
}

/**
 * Estimate the miles required for a sweet spot from its description.
 * Looks for patterns like "90,000-120,000 points", "45,000 miles", "7,500 points", etc.
 * Returns the lower bound number or null if not parseable.
 */
function estimateMilesNeeded(description: string): number | null {
  // Match patterns like "90,000" or "120,000" in context of points/miles
  const match = description.match(/([\d,]+)\s*(?:-\s*[\d,]+\s*)?(?:points|miles|Avios)/i)
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10)
  }
  return null
}

function buildRecommendations(bonuses: Bonus[], entries: WalletEntry[]): Recommendation[] {
  const recommendations: Recommendation[] = []

  for (const bonus of bonuses) {
    // Find matching wallet entry for this bonus's bank program
    const walletEntry = entries.find(
      (e) => e.currency_type === 'bank_points' && programNamesMatch(e.program, bonus.bank_program)
    )
    if (!walletEntry) continue

    // Find the transfer partner data to get the ratio
    const bankProgram = transferPartners.find((tp) => programNamesMatch(tp.name, bonus.bank_program))
    if (!bankProgram) continue

    const partnerData = bankProgram.partners.find((p) => programNamesMatch(p.partner, bonus.partner))
    if (!partnerData) continue

    const [bankPoints, partnerPoints] = partnerData.ratio
    const milesAfterBonus = Math.floor(
      walletEntry.balance * (partnerPoints / bankPoints) * (1 + bonus.bonus_percent / 100)
    )

    // Find matching sweet spots where the bonus partner appears in programs
    const matchingSweetSpots = sweetSpots
      .filter((ss) => ss.programs.some((prog) => programNamesMatch(prog, bonus.partner)))
      .map((ss) => {
        const milesNeeded = estimateMilesNeeded(ss.description)
        const shortfall = milesNeeded !== null ? milesNeeded - milesAfterBonus : 0
        return {
          title: ss.title,
          routes: ss.routes,
          milesNeeded,
          shortfall,
        }
      })

    recommendations.push({
      bonus,
      walletEntry,
      transferRatio: partnerData.ratio,
      milesAfterBonus,
      matchingSweetSpots,
    })
  }

  // Sort by bonus percent descending
  recommendations.sort((a, b) => b.bonus.bonus_percent - a.bonus.bonus_percent)

  return recommendations
}

export default function TransferBonusRecommendations({ bonuses, entries }: Props) {
  const recommendations = buildRecommendations(bonuses, entries)

  if (recommendations.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 18 }}>&#x26A1;</span>
        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Active Transfer Bonuses
        </h2>
      </div>

      {/* Recommendation Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.bonus.id} rec={rec} />
        ))}
      </div>
    </div>
  )
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const { bonus, walletEntry, milesAfterBonus, matchingSweetSpots } = rec
  const bankShort = shortName(bonus.bank_program)
  const partnerShort = shortPartnerName(bonus.partner)

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-light)',
        padding: '16px 18px',
        overflow: 'hidden',
      }}
    >
      {/* Top row: bonus badge + transfer direction */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        {/* Bonus badge */}
        <span
          style={{
            display: 'inline-block',
            fontSize: 13,
            fontWeight: 700,
            color: '#92710C',
            backgroundColor: '#FFF3CD',
            border: '1px solid #F0E4B8',
            padding: '3px 10px',
            borderRadius: 12,
            whiteSpace: 'nowrap',
          }}
        >
          {bonus.bonus_percent}% bonus
        </span>

        {/* Transfer direction */}
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {bonus.bank_program}
        </span>
        <span
          style={{
            fontSize: 14,
            color: 'var(--text-muted)',
          }}
        >
          &rarr;
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {bonus.partner}
        </span>
      </div>

      {/* Miles calculation */}
      <div
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginBottom: 10,
          lineHeight: 1.6,
        }}
      >
        Your{' '}
        <strong style={{ color: 'var(--text-primary)' }}>
          {walletEntry.balance.toLocaleString()} {bankShort}
        </strong>{' '}
        &rarr;{' '}
        <strong style={{ color: '#92710C' }}>
          {milesAfterBonus.toLocaleString()} {partnerShort}
        </strong>{' '}
        miles
      </div>

      {/* Sweet spot tips */}
      {matchingSweetSpots.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {matchingSweetSpots.map((ss) => {
            if (ss.milesNeeded !== null && ss.shortfall <= 0) {
              // User has enough miles
              return (
                <div
                  key={ss.title}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#15803D',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 'var(--radius)',
                    padding: '8px 12px',
                    lineHeight: 1.5,
                  }}
                >
                  Enough for {ss.title}!
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 400,
                      color: '#166534',
                      marginTop: 2,
                    }}
                  >
                    {ss.routes}
                  </span>
                </div>
              )
            } else if (ss.milesNeeded !== null && ss.shortfall > 0) {
              // User is short
              return (
                <div
                  key={ss.title}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#92710C',
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 'var(--radius)',
                    padding: '8px 12px',
                    lineHeight: 1.5,
                  }}
                >
                  Just {ss.shortfall.toLocaleString()} miles short of {ss.title}
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 400,
                      color: '#A16207',
                      marginTop: 2,
                    }}
                  >
                    {ss.routes}
                  </span>
                </div>
              )
            } else {
              // No miles estimate available, just mention the sweet spot
              return (
                <div
                  key={ss.title}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#15803D',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 'var(--radius)',
                    padding: '8px 12px',
                    lineHeight: 1.5,
                  }}
                >
                  Unlocks: {ss.title}
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 400,
                      color: '#166534',
                      marginTop: 2,
                    }}
                  >
                    {ss.routes}
                  </span>
                </div>
              )
            }
          })}
        </div>
      )}

      {/* Expiry and notes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {bonus.expires_at && (
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            Expires {formatDate(bonus.expires_at)}
          </span>
        )}
        {bonus.notes && (
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            {bonus.notes}
          </span>
        )}
      </div>
    </div>
  )
}

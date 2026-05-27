'use client'

import { useState, useEffect } from 'react'
import { sweetSpots as staticSweetSpots } from '@/data/pointsKnowledge'
import { transferPartners } from '@/data/transferPartners'

type WalletEntry = {
  id: string
  currency_type: 'bank_points' | 'airline_miles' | 'cashback' | 'cash'
  program: string
  balance: number
  redemption_value: number | null
  notes: string
}

type Props = {
  entries: WalletEntry[]
}

// DB sweet spot shape (from /api/sweet-spots)
type DbSweetSpot = {
  id: string
  title: string
  programs: string[]
  origin_region?: string
  destination_region?: string
  cabin_class?: string
  points_required?: number
  estimated_cpp?: number
  estimated_cash_value?: number
  description: string
  booking_steps?: string[]
  tags?: string[]
}

// Static sweet spot shape (from pointsKnowledge.ts)
type StaticSweetSpot = {
  title: string
  programs: string[]
  routes: string
  description: string
  estimatedValue: string
}

// Unified shape used internally after normalizing both sources
type NormalizedSweetSpot = {
  id: string
  title: string
  programs: string[]
  route: string
  valueBadge: string
  description: string
  estimatedValueNum: number // for sorting, higher is better
}

type ReachablePath = {
  type: 'direct' | 'transfer'
  airlineProgram: string
  bankProgram?: string
  milesAvailable: number
}

type ReachableAlert = {
  spot: NormalizedSweetSpot
  bestPath: ReachablePath
}

function programNamesMatch(a: string, b: string): boolean {
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return true
  if (la.includes(lb) || lb.includes(la)) return true
  return false
}

function normalizeDbSpot(spot: DbSweetSpot): NormalizedSweetSpot {
  let route = ''
  if (spot.origin_region && spot.destination_region) {
    route = `${spot.origin_region} → ${spot.destination_region}`
  }
  if (spot.cabin_class) {
    route = route ? `${route} (${spot.cabin_class})` : spot.cabin_class
  }

  let valueBadge = ''
  if (spot.estimated_cpp) {
    valueBadge = `~${spot.estimated_cpp} cpp`
  } else if (spot.estimated_cash_value) {
    valueBadge = `~$${spot.estimated_cash_value.toLocaleString()} value`
  }

  return {
    id: spot.id,
    title: spot.title,
    programs: spot.programs || [],
    route,
    valueBadge,
    description: spot.description,
    estimatedValueNum: spot.estimated_cpp || spot.estimated_cash_value || 0,
  }
}

function normalizeStaticSpot(spot: StaticSweetSpot, idx: number): NormalizedSweetSpot {
  // Parse estimated value like "3-5 cpp" or "1.5 cpp" to get a number for sorting
  let estimatedValueNum = 0
  const match = spot.estimatedValue.match(/([\d.]+)(?:\s*-\s*([\d.]+))?/)
  if (match) {
    const low = parseFloat(match[1])
    const high = match[2] ? parseFloat(match[2]) : low
    estimatedValueNum = (low + high) / 2
  }

  return {
    id: `static-${idx}`,
    title: spot.title,
    programs: spot.programs,
    route: spot.routes,
    valueBadge: spot.estimatedValue,
    description: spot.description,
    estimatedValueNum,
  }
}

function findBestPath(
  spot: NormalizedSweetSpot,
  entries: WalletEntry[],
): ReachablePath | null {
  const airlineEntries = entries.filter(e => e.currency_type === 'airline_miles')
  const bankEntries = entries.filter(e => e.currency_type === 'bank_points')

  // 1. Check direct airline miles match
  let bestDirect: ReachablePath | null = null
  for (const entry of airlineEntries) {
    for (const program of spot.programs) {
      if (programNamesMatch(entry.program, program)) {
        if (!bestDirect || entry.balance > bestDirect.milesAvailable) {
          bestDirect = {
            type: 'direct',
            airlineProgram: entry.program,
            milesAvailable: entry.balance,
          }
        }
      }
    }
  }
  if (bestDirect) return bestDirect

  // 2. Check transfer from bank points
  let bestTransfer: ReachablePath | null = null
  let bestTransferMiles = 0

  for (const bankEntry of bankEntries) {
    // Find the matching bank program in transferPartners
    const bankProgram = transferPartners.find(tp =>
      programNamesMatch(tp.name, bankEntry.program)
    )
    if (!bankProgram) continue

    for (const spotProgram of spot.programs) {
      const partner = bankProgram.partners.find(p =>
        programNamesMatch(p.partner, spotProgram)
      )
      if (!partner) continue

      const [bankPoints, partnerPoints] = partner.ratio
      const milesAvailable = Math.floor(bankEntry.balance * (partnerPoints / bankPoints))

      if (milesAvailable > bestTransferMiles) {
        bestTransferMiles = milesAvailable
        bestTransfer = {
          type: 'transfer',
          airlineProgram: partner.partner,
          bankProgram: bankEntry.program,
          milesAvailable,
        }
      }
    }
  }

  return bestTransfer
}

export default function SweetSpotAlerts({ entries }: Props) {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<ReachableAlert[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadSweetSpots() {
      let normalized: NormalizedSweetSpot[] = []

      try {
        const res = await fetch('/api/sweet-spots')
        if (res.ok) {
          const data = await res.json()
          const dbSpots: DbSweetSpot[] = data.sweetSpots || data || []
          if (dbSpots.length > 0) {
            normalized = dbSpots.map(normalizeDbSpot)
          }
        }
      } catch {
        // API failed, will fall back below
      }

      // Fallback to static data
      if (normalized.length === 0) {
        normalized = staticSweetSpots.map(normalizeStaticSpot)
      }

      if (cancelled) return

      // Find reachable sweet spots
      const reachable: ReachableAlert[] = []
      for (const spot of normalized) {
        const bestPath = findBestPath(spot, entries)
        if (bestPath) {
          reachable.push({ spot, bestPath })
        }
      }

      // Sort: by estimated value descending
      reachable.sort((a, b) => b.spot.estimatedValueNum - a.spot.estimatedValueNum)

      setAlerts(reachable.slice(0, 3))
      setLoading(false)
    }

    loadSweetSpots()
    return () => { cancelled = true }
  }, [entries])

  if (loading) {
    return (
      <div style={{
        padding: '16px 18px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-light)',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            Trips You Can Book
          </span>
        </div>
        <a
          href="/tools/sweet-spots"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#059669',
            textDecoration: 'none',
          }}
        >
          See all sweet spots →
        </a>
      </div>

      {/* Sweet spot cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.map((alert) => (
          <div
            key={alert.spot.id}
            style={{
              backgroundColor: '#f0fdf4',
              borderRadius: 'var(--radius)',
              border: '1px solid #bbf7d0',
              boxShadow: 'var(--shadow)',
              padding: '14px 16px',
              transition: 'box-shadow 0.15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.15)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow)'
            }}
          >
            {/* Top row: title + value badge */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 4,
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
              }}>
                {alert.spot.title}
              </div>
              {alert.spot.valueBadge && (
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#059669',
                  backgroundColor: '#bbf7d0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {alert.spot.valueBadge}
                </span>
              )}
            </div>

            {/* Route info */}
            {alert.spot.route && (
              <div style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}>
                {alert.spot.route}
              </div>
            )}

            {/* How to reach */}
            <div style={{
              fontSize: 13,
              color: '#059669',
              fontWeight: 500,
            }}>
              {alert.bestPath.type === 'direct' ? (
                <>Direct with {alert.bestPath.airlineProgram}</>
              ) : (
                <>Via {alert.bestPath.bankProgram} → {alert.bestPath.airlineProgram}</>
              )}
              <span style={{
                color: 'var(--text-secondary)',
                fontWeight: 400,
                marginLeft: 6,
              }}>
                ({alert.bestPath.milesAvailable.toLocaleString()} miles available)
              </span>
            </div>

            {/* Learn more link */}
            <a
              href="/tools/sweet-spots"
              style={{
                display: 'inline-block',
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#059669',
                textDecoration: 'none',
              }}
            >
              Learn more →
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { loadWallet } from '@/lib/dataService'
import { sweetSpots as staticSweetSpots } from '@/data/pointsKnowledge'
import { transferPartners } from '@/data/transferPartners'

type SweetSpotEntry = {
  id?: string
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
  // Personalization fields
  reachableVia?: string[]
  isReachable?: boolean
  // Static sweet spot fields
  routes?: string
  estimatedValue?: string
}

function programNamesMatch(a: string, b: string): boolean {
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return true
  if (la.includes(lb) || lb.includes(la)) return true
  return false
}

export default function SweetSpotsPage() {
  const { user } = useAuth()
  const [spots, setSpots] = useState<SweetSpotEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [walletPrograms, setWalletPrograms] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'reachable'>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const wallet = await loadWallet()
      setWalletPrograms(wallet.map((w: any) => w.program))

      // Try to load DB sweet spots
      try {
        const walletParam = wallet.length > 0 ? `?wallet=${encodeURIComponent(JSON.stringify(wallet))}` : ''
        const res = await fetch(`/api/sweet-spots${walletParam}`)
        const data = await res.json()
        if (data.sweetSpots && data.sweetSpots.length > 0) {
          setSpots(data.sweetSpots)
          setLoading(false)
          return
        }
      } catch {
        // fallback to static
      }

      // Fallback: use static sweet spots with personalization
      const personalized = staticSweetSpots.map(s => {
        const reachableVia: string[] = []
        for (const program of s.programs) {
          const hasDirect = wallet.some((w: any) =>
            w.currency_type === 'airline_miles' && programNamesMatch(w.program, program)
          )
          if (hasDirect) {
            reachableVia.push(program + ' (direct)')
            continue
          }
          for (const bankProg of transferPartners) {
            const hasBank = wallet.some((w: any) =>
              w.currency_type === 'bank_points' && programNamesMatch(w.program, bankProg.name)
            )
            if (!hasBank) continue
            if (bankProg.partners.some(p => programNamesMatch(p.partner, program))) {
              reachableVia.push(`${program} (via ${bankProg.name})`)
              break
            }
          }
        }
        return {
          title: s.title,
          programs: s.programs,
          description: s.description,
          routes: s.routes,
          estimatedValue: s.estimatedValue,
          reachableVia,
          isReachable: reachableVia.length > 0,
        }
      })

      personalized.sort((a, b) => {
        if (a.isReachable && !b.isReachable) return -1
        if (!a.isReachable && b.isReachable) return 1
        return 0
      })

      setSpots(personalized)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'reachable' ? spots.filter(s => s.isReachable) : spots

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <a href="/tools" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
          &larr; Back to Tools
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Sweet Spots</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>
          The best-value redemptions in award travel, personalized to your wallet.
          {walletPrograms.length === 0 && (
            <span style={{ display: 'block', marginTop: 8, color: '#d97706' }}>
              Add points to your <a href="/wallet" style={{ color: '#d97706', textDecoration: 'underline' }}>wallet</a> to see which sweet spots you can reach.
            </span>
          )}
        </p>
      </div>

      {/* Filter */}
      {walletPrograms.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              backgroundColor: filter === 'all' ? '#2563eb' : 'var(--bg-card)',
              color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            All ({spots.length})
          </button>
          <button
            onClick={() => setFilter('reachable')}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              backgroundColor: filter === 'reachable' ? '#059669' : 'var(--bg-card)',
              color: filter === 'reachable' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Reachable ({spots.filter(s => s.isReachable).length})
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading sweet spots...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((spot, i) => (
            <div
              key={spot.id || spot.title}
              style={{
                backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
                border: `1px solid ${spot.isReachable ? '#059669' : 'var(--border-light)'}`,
                padding: 20, boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {spot.title}
                </h3>
                {(spot.estimatedValue || spot.estimated_cpp) && (
                  <span style={{
                    padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                    backgroundColor: '#05966915', color: '#059669',
                  }}>
                    {spot.estimatedValue || `${spot.estimated_cpp} cpp`}
                  </span>
                )}
              </div>

              {(spot.routes || (spot.origin_region && spot.destination_region)) && (
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                  {spot.routes || `${spot.origin_region} → ${spot.destination_region}`}
                  {spot.cabin_class && ` (${spot.cabin_class})`}
                </div>
              )}

              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0' }}>
                {spot.description}
              </p>

              {spot.points_required && (
                <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, marginBottom: 6 }}>
                  {spot.points_required.toLocaleString()} points
                  {spot.estimated_cash_value && ` (worth ~$${spot.estimated_cash_value.toLocaleString()})`}
                </div>
              )}

              {/* Programs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {spot.programs.map((p, j) => (
                  <span key={j} style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 11,
                    backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                  }}>
                    {p}
                  </span>
                ))}
              </div>

              {/* Reachability */}
              {spot.isReachable && spot.reachableVia && spot.reachableVia.length > 0 && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  backgroundColor: '#f0fdf4', color: '#166534',
                  border: '1px solid #bbf7d0',
                }}>
                  <strong>You can reach this!</strong>
                  {spot.reachableVia.map((via, j) => (
                    <div key={j} style={{ fontSize: 12, marginTop: 2 }}>{via}</div>
                  ))}
                </div>
              )}

              {/* Booking steps (DB entries) */}
              {spot.booking_steps && spot.booking_steps.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>How to Book:</div>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    {spot.booking_steps.map((step, j) => (
                      <li key={j} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tags */}
              {spot.tags && spot.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {spot.tags.map((tag, j) => (
                    <span key={j} style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      backgroundColor: '#dbeafe', color: '#1e40af',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              {filter === 'reachable'
                ? 'No sweet spots are reachable with your current wallet. Add more points programs!'
                : 'No sweet spots available.'
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}

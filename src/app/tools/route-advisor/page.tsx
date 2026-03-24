'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { loadWallet, loadTransferBonuses } from '@/lib/dataService'
import { createClient } from '@/lib/supabase'

type BookingRecommendation = {
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

const CABIN_OPTIONS = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
]

export default function RouteAdvisorPage() {
  const { user } = useAuth()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [cabinClass, setCabinClass] = useState('economy')
  const [travelers, setTravelers] = useState(1)
  const [results, setResults] = useState<BookingRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [walletLoaded, setWalletLoaded] = useState(false)
  const [walletCount, setWalletCount] = useState(0)

  useEffect(() => {
    loadWallet().then(w => {
      setWalletCount(w.length)
      setWalletLoaded(true)
    })
  }, [])

  async function handleSearch() {
    if (!origin || !destination) {
      setError('Please enter both origin and destination airport codes')
      return
    }
    setLoading(true)
    setError('')
    setResults([])

    try {
      const [wallet, bonuses] = await Promise.all([loadWallet(), loadTransferBonuses()])

      const sb = createClient()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token

      const res = await fetch('/api/route-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          cabinClass,
          travelers,
          wallet,
          transferBonuses: bonuses,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get recommendations')
      setResults(data.recommendations || [])
      if (data.recommendations?.length === 0) {
        setError('No booking options found. Try adding points to your wallet or adjusting the route.')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const tagColor = (tag: string) => {
    if (tag === 'Best Value') return '#059669'
    if (tag === 'Can Afford') return '#2563eb'
    if (tag.includes('Bonus')) return '#d97706'
    if (tag === 'Low Surcharges' || tag === 'No Surcharges') return '#059669'
    if (tag === 'Lowest Fees') return '#7c3aed'
    if (tag === 'No Transfer Needed') return '#6b7280'
    return '#6b7280'
  }

  const surchargeColor = (level: string) => {
    if (level === 'none' || level === 'low') return '#059669'
    if (level === 'medium') return '#d97706'
    return '#dc2626'
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <a href="/tools" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
          &larr; Back to Tools
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Route Points Advisor</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>
          Enter a route and we'll find every way to book it using your points — ranked by value.
          {walletLoaded && walletCount === 0 && (
            <span style={{ display: 'block', marginTop: 8, color: '#d97706' }}>
              Add points to your <a href="/wallet" style={{ color: '#d97706', textDecoration: 'underline' }}>wallet</a> first for personalized results.
            </span>
          )}
        </p>
      </div>

      {/* Search Form */}
      <div style={{
        backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border-light)', padding: 24, marginBottom: 24,
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--text-secondary)' }}>
              Origin Airport
            </label>
            <input
              type="text"
              placeholder="e.g. JFK"
              value={origin}
              onChange={e => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border-light)', fontSize: 16, fontWeight: 600,
                backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
                letterSpacing: 2, textTransform: 'uppercase',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--text-secondary)' }}>
              Destination Airport
            </label>
            <input
              type="text"
              placeholder="e.g. NRT"
              value={destination}
              onChange={e => setDestination(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border-light)', fontSize: 16, fontWeight: 600,
                backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
                letterSpacing: 2, textTransform: 'uppercase',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--text-secondary)' }}>
              Cabin Class
            </label>
            <select
              value={cabinClass}
              onChange={e => setCabinClass(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border-light)', fontSize: 14,
                backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
              }}
            >
              {CABIN_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--text-secondary)' }}>
              Travelers
            </label>
            <input
              type="number"
              min={1}
              max={9}
              value={travelers}
              onChange={e => setTravelers(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border-light)', fontSize: 14,
                backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 24px', borderRadius: 10,
            backgroundColor: loading ? '#6b7280' : '#2563eb', color: '#fff',
            fontWeight: 600, fontSize: 15, border: 'none', cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Searching...' : 'Find Best Booking Options'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: 16, borderRadius: 10, backgroundColor: '#fef2f2',
          border: '1px solid #fecaca', color: '#991b1b', fontSize: 14, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {results.length} Booking Option{results.length !== 1 ? 's' : ''} Found
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((rec) => {
              const isExpanded = expandedCard === rec.rank
              return (
                <div
                  key={rec.rank}
                  style={{
                    backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
                    border: `1px solid ${rec.canAfford ? (rec.tags.includes('Best Value') ? '#059669' : 'var(--border-light)') : '#e5e7eb'}`,
                    padding: 20, boxShadow: 'var(--shadow)',
                    opacity: rec.canAfford ? 1 : 0.75,
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedCard(isExpanded ? null : rec.rank)}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>#{rec.rank}</span>
                        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {rec.bookingProgram}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {rec.pointsSource === 'transfer' && rec.transferPath
                          ? `Transfer ${rec.transferPath.fromProgram} → ${rec.transferPath.toProgram} (${rec.transferPath.ratio}${rec.transferPath.bonusPercent > 0 ? ` +${rec.transferPath.bonusPercent}%` : ''})`
                          : rec.pointsSource === 'portal'
                            ? 'Book through travel portal'
                            : `Direct ${rec.bookingProgram} miles`
                        }
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>
                        {rec.pointsRequired.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        points {rec.estimatedFees > 0 && `+ $${rec.estimatedFees.toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      backgroundColor: `${surchargeColor(rec.surchargeLevel)}15`,
                      color: surchargeColor(rec.surchargeLevel),
                    }}>
                      {rec.estimatedCpp} cpp
                    </span>
                    {rec.tags.map((tag, i) => (
                      <span key={i} style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        backgroundColor: `${tagColor(tag)}15`,
                        color: tagColor(tag),
                      }}>
                        {tag}
                      </span>
                    ))}
                    {!rec.canAfford && rec.shortfall && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        backgroundColor: '#dc262615', color: '#dc2626',
                      }}>
                        Need {rec.shortfall.toLocaleString()} more
                      </span>
                    )}
                  </div>

                  {/* Surcharge Warning */}
                  {rec.surchargeWarning && (
                    <div style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 13,
                      backgroundColor: '#fef2f2', color: '#991b1b', marginBottom: 10,
                      border: '1px solid #fecaca',
                    }}>
                      {rec.surchargeWarning}
                    </div>
                  )}

                  {/* Expanded: Booking Steps */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                        How to Book
                      </h4>
                      <ol style={{ margin: 0, paddingLeft: 20 }}>
                        {rec.bookingSteps.map((step, i) => (
                          <li key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>
                            {step}
                          </li>
                        ))}
                      </ol>
                      {rec.warnings.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          {rec.warnings.map((w, i) => (
                            <div key={i} style={{ fontSize: 13, color: '#d97706' }}>{w}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>
                    {isExpanded ? 'Click to collapse' : 'Click for booking steps'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

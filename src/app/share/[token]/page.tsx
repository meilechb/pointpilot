'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import FlightCard from '@/components/FlightCard'
import { getCityName, formatDate } from '@/utils/airportUtils'

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function SharedTripPage() {
  const params = useParams()
  const token = params.token as string

  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`/api/share/${token}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (data?.trip) setTrip(data.trip)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading shared trip…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (notFound || !trip) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Link not found</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            This share link is invalid or has been revoked by the trip owner.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block', padding: '10px 24px',
              backgroundColor: 'var(--primary)', color: 'white',
              borderRadius: 'var(--radius-sm)', textDecoration: 'none',
              fontWeight: 600, fontSize: 14,
            }}
          >
            Go to Point Tripper
          </a>
        </div>
      </div>
    )
  }

  const flightsByLeg: Record<number, any[]> = {}
  for (const f of trip.flights || []) {
    const li = f.legIndex ?? -1
    if (!flightsByLeg[li]) flightsByLeg[li] = []
    flightsByLeg[li].push(f)
  }

  const cashFlights = (trip.flights || []).filter((f: any) => f.paymentType === 'cash' && f.cashAmount)
  const pointsFlights = (trip.flights || []).filter((f: any) => f.paymentType === 'points' && f.pointsAmount)
  const minCash = cashFlights.length > 0 ? Math.min(...cashFlights.map((f: any) => f.cashAmount)) : null
  const minPoints = pointsFlights.length > 0 ? Math.min(...pointsFlights.map((f: any) => f.pointsAmount)) : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Shared trip notice bar */}
      <div style={{
        backgroundColor: 'var(--primary-light)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>✈️</span>
          <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
            Shared trip — read-only view
          </span>
        </div>
        <a
          href="/"
          style={{
            fontSize: 12, fontWeight: 600, color: 'var(--primary)',
            textDecoration: 'none', padding: '5px 12px',
            border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)',
          }}
        >
          Open Point Tripper
        </a>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

        {/* Trip header card */}
        <div style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 24,
          border: '1px solid var(--border-light)',
        }}>
          {/* Gradient header */}
          <div style={{
            background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
            padding: '24px 28px',
            color: 'white',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7, marginBottom: 6 }}>
              {trip.tripType === 'roundtrip' ? 'Round Trip' : trip.tripType === 'oneway' ? 'One Way' : 'Multi-City'}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>
              {trip.tripName || `${getCityName(trip.departureCity) || trip.departureCity} → ${getCityName(trip.destinationCity) || trip.destinationCity}`}
            </h1>
            <div style={{ opacity: 0.8, fontSize: 14 }}>
              {trip.departureDate && formatShortDate(trip.departureDate)}
              {trip.returnDate && trip.tripType === 'roundtrip' && ` – ${formatShortDate(trip.returnDate)}`}
              {trip.travelers > 1 && ` · ${trip.travelers} travelers`}
            </div>
          </div>

          {/* Stats strip */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Flights', value: (trip.flights || []).length },
              { label: 'Itineraries', value: (trip.itineraries || []).length },
              ...(minCash !== null ? [{ label: 'Best Cash', value: `$${minCash.toLocaleString()}`, highlight: 'success' }] : []),
              ...(minPoints !== null ? [{ label: 'Best Points', value: minPoints.toLocaleString() + ' pts', highlight: 'primary' }] : []),
            ].map((stat, i) => (
              <div key={i} style={{
                flex: '1 1 100px', padding: '14px 20px', textAlign: 'center',
                borderRight: '1px solid var(--border-light)',
              }}>
                <div style={{
                  fontSize: 20, fontWeight: 700,
                  color: stat.highlight === 'success' ? 'var(--success)' : stat.highlight === 'primary' ? 'var(--primary)' : 'var(--text)',
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route */}
        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
          padding: '20px 24px', marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Route</h2>
          {(trip.legs || []).map((leg: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--primary)', border: '2px solid var(--primary)', flexShrink: 0 }} />
                <div style={{ width: 2, flex: 1, backgroundColor: 'var(--border)', margin: '2px 0' }} />
              </div>
              <div style={{ paddingBottom: 16, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{getCityName(leg.from) || leg.from}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{
                    display: 'inline-block', padding: '1px 6px',
                    backgroundColor: 'var(--primary-light)', borderRadius: 8,
                    fontSize: 11, fontWeight: 600, color: 'var(--primary)',
                  }}>
                    {leg.from} → {leg.to}
                  </span>
                  {i === 0 && trip.departureDate && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatShortDate(trip.departureDate)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* Final destination dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'center', width: 16, flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--primary)', border: '2px solid var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                {getCityName(trip.legs?.[trip.legs.length - 1]?.to) || trip.legs?.[trip.legs.length - 1]?.to}
              </div>
              {trip.returnDate && trip.tripType === 'roundtrip' && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatShortDate(trip.returnDate)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Flights */}
        {(trip.flights || []).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
              Flights <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>({trip.flights.length})</span>
            </h2>
            {(trip.legs || []).map((leg: any, legIdx: number) => {
              const legFlights = flightsByLeg[legIdx] || []
              if (legFlights.length === 0) return null
              return (
                <div key={legIdx} style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}>
                    Leg {legIdx + 1}: {leg.from} → {leg.to}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {legFlights.map((flight: any) => (
                      <FlightCard key={flight.id} flight={flight} />
                    ))}
                  </div>
                </div>
              )
            })}
            {/* Unassigned flights */}
            {(flightsByLeg[-1] || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: 10,
                }}>
                  Other Flights
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(flightsByLeg[-1] || []).map((flight: any) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Itineraries */}
        {(trip.itineraries || []).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
              Itineraries <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>({trip.itineraries.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(trip.itineraries || []).map((itin: any) => {
                const totalPoints = itin.totals?.points ?? 0
                const totalCash = itin.totals?.cash ?? 0
                const totalFees = itin.totals?.fees ?? 0
                return (
                  <div
                    key={itin.id}
                    style={{
                      backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
                      padding: '18px 22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{itin.name}</div>
                        {itin.createdAt && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(itin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {totalPoints > 0 && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>{totalPoints.toLocaleString()} pts</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Points</div>
                          </div>
                        )}
                        {totalCash > 0 && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>${totalCash.toLocaleString()}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cash</div>
                          </div>
                        )}
                        {totalFees > 0 && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>${totalFees.toLocaleString()}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fees</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            Plan your own trip with points
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Track flights, compare award options, and build itineraries — all in one place.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'linear-gradient(135deg, #4338CA, #6366F1)',
              color: 'white', borderRadius: 'var(--radius-sm)',
              textDecoration: 'none', fontWeight: 700, fontSize: 15,
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}
          >
            Try Point Tripper Free
          </a>
        </div>
      </div>
    </div>
  )
}

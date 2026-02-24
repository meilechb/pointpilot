'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SavePrompt from '@/components/SavePrompt'
import { loadTrips, deleteTrip as deleteRemoteTrip } from '@/lib/dataService'

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function tripTypeLabel(type: string): string {
  if (type === 'oneway') return 'One Way'
  if (type === 'multicity') return 'Multi-City'
  return 'Round Trip'
}

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])
  const [savePromptTrigger, setSavePromptTrigger] = useState<'flight' | 'plan' | 'trip' | 'wallet' | null>(null)

  useEffect(() => {
    loadTrips().then(saved => {
      setTrips(saved)
      if (saved.length === 1) {
        setSavePromptTrigger('trip')
      }
    })
  }, [])

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation()
    if (!confirm('Delete this trip? This cannot be undone.')) return
    await deleteRemoteTrip(tripId)
    setTrips(trips.filter(t => t.id !== tripId))
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>My Trips</h1>
          {trips.length > 0 && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
              {trips.length} trip{trips.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/trip/new')}
          style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'var(--text-inverse)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(67, 56, 202, 0.3)',
          }}
        >
          + New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No trips yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Create your first trip to start comparing flight options.</p>
          <button
            onClick={() => router.push('/trip/new')}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'var(--text-inverse)',
              border: 'none', borderRadius: 'var(--radius)',
              cursor: 'pointer', fontSize: 15, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(67, 56, 202, 0.3)',
            }}
          >
            Start Your First Trip
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trips.map((trip: any) => {
            const route = trip.legs?.map((l: any) => l.from).concat(trip.legs?.[trip.legs.length - 1]?.to).filter(Boolean)
            const hasRoute = route && route.length >= 2
            const flightCount = trip.flights?.length || 0
            const itineraryCount = trip.itineraries?.length || 0

            return (
              <div
                key={trip.id}
                onClick={() => router.push(`/trip/${trip.id}`)}
                style={{
                  padding: '20px 22px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {/* Top row: name + delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>
                    {trip.tripName || 'Untitled Trip'}
                  </h2>
                  <button
                    onClick={(e) => handleDelete(e, trip.id)}
                    title="Delete trip"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: 16, padding: '2px 6px',
                      borderRadius: 4, flexShrink: 0,
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)' }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Route */}
                {hasRoute && (
                  <div style={{
                    fontSize: 15, color: 'var(--text-secondary)', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                  }}>
                    {route.map((city: string, i: number) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{city}</span>
                        {i < route.length - 1 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>→</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Date + trip type + badges row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {trip.departureDate && (
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {formatShortDate(trip.departureDate)}
                      {trip.returnDate && ` – ${formatShortDate(trip.returnDate)}`}
                    </span>
                  )}

                  {trip.tripType && (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 10,
                      backgroundColor: 'var(--bg)', color: 'var(--text-muted)',
                      border: '1px solid var(--border-light)',
                    }}>
                      {tripTypeLabel(trip.tripType)}
                    </span>
                  )}

                  {trip.travelers > 1 && (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 10,
                      backgroundColor: 'var(--bg)', color: 'var(--text-muted)',
                      border: '1px solid var(--border-light)',
                    }}>
                      {trip.travelers} travelers
                    </span>
                  )}

                  {flightCount > 0 && (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 10,
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                    }}>
                      {flightCount} flight{flightCount > 1 ? 's' : ''}
                    </span>
                  )}

                  {itineraryCount > 0 && (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 10,
                      backgroundColor: 'var(--success-bg)',
                      color: 'var(--success)',
                    }}>
                      {itineraryCount} plan{itineraryCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SavePrompt trigger={savePromptTrigger} />
    </div>
  )
}

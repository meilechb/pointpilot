'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SavePrompt from '@/components/SavePrompt'

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])
  const [savePromptTrigger, setSavePromptTrigger] = useState<'flight' | 'plan' | 'trip' | 'wallet' | null>(null)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('trips') || '[]')
    setTrips(saved)
    if (saved.length === 1) {
      setSavePromptTrigger('trip')
    }
  }, [])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Trips</h1>
        <button
          onClick={() => router.push('/trip/new')}
          style={{
            padding: '8px 20px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'var(--text-inverse)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          + New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 48,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✈️</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>No trips yet</p>
          <button
            onClick={() => router.push('/trip/new')}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'var(--text-inverse)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            Start Your First Trip →
          </button>
        </div>
      ) : (
        trips.map((trip: any) => (
          <div
            key={trip.id}
            onClick={() => router.push(`/trip/${trip.id}`)}
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-light)',
              marginBottom: 8,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'box-shadow 0.15s, transform 0.15s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{trip.tripName || 'Untitled Trip'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {trip.legs?.map((l: any) => `${l.from} → ${l.to}`).join(' · ')}
                {trip.departureDate && <span> · {trip.departureDate}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {trip.flights?.length > 0 && (
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 10,
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                }}>
                  {trip.flights.length} flight{trip.flights.length > 1 ? 's' : ''}
                </span>
              )}
              <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
            </div>
          </div>
        ))
      )}

      <SavePrompt trigger={savePromptTrigger} />
    </div>
  )
}
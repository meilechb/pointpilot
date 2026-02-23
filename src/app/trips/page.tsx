'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('trips') || '[]')
    setTrips(saved.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }, [])

  const handleDelete = (id: string) => {
    const updated = trips.filter(t => t.id !== id)
    localStorage.setItem('trips', JSON.stringify(updated))
    setTrips(updated)
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24 }}>My Trips</h1>
        <button
          onClick={() => router.push('/trip/new')}
          style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          + New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <p style={{ color: '#999' }}>No trips yet. Create your first one!</p>
      ) : (
        trips.map((trip) => (
          <div
            key={trip.id}
            style={{
              padding: 14,
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              marginBottom: 8,
              cursor: 'pointer',
            }}
            onClick={() => router.push(`/trip/${trip.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>{trip.tripName || 'Untitled Trip'}</span>
                <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                  {trip.legs?.map((l: any) => l.from).join(' → ')} → {trip.legs?.[trip.legs.length - 1]?.to}
                </div>
                <div style={{ color: '#999', fontSize: 13, marginTop: 2 }}>
                  {trip.departureDate}{trip.returnDate ? ` → ${trip.returnDate}` : ''} · {trip.flights?.length || 0} flight{trip.flights?.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(trip.id) }}
                style={{ padding: '4px 10px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff', color: '#cc0000', fontSize: 13 }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
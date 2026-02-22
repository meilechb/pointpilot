'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function TripDetail() {
  const params = useParams()
  const [trip, setTrip] = useState<any>(null)

  useEffect(() => {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]')
    const found = trips.find((t: any) => t.id === params.id)
    setTrip(found)
  }, [params.id])

  if (!trip) return <div style={{ padding: 40, textAlign: 'center' }}>Trip not found</div>

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{trip.tripName}</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>
        {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''} · {trip.departureDate}
        {trip.returnDate ? ` → ${trip.returnDate}` : ''} · {trip.dateFlexibility === 'exact' ? 'Exact dates' : trip.dateFlexibility}
      </p>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Legs</h2>
      {trip.legs.map((leg: any, i: number) => (
        <div
          key={i}
          style={{
            padding: 12,
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 'bold' }}>Leg {i + 1}</span>
          <span>{leg.from} → {leg.to}</span>
        </div>
      ))}

      <h2 style={{ fontSize: 18, marginTop: 30, marginBottom: 12 }}>Flights</h2>
      <p style={{ color: '#999', marginBottom: 12 }}>No flights added yet</p>

      <button
        style={{
          padding: '10px 20px',
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 15,
        }}
      >
        + Add Flight
      </button>
    </div>
  )
}
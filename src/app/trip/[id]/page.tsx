'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AddFlight from '@/components/AddFlight'
import TripPlanner from '@/components/TripPlanner'

export default function TripDetail() {
  const params = useParams()
  const [trip, setTrip] = useState<any>(null)
  const [showAddFlight, setShowAddFlight] = useState(false)
  const [editingFlight, setEditingFlight] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'flights' | 'plan'>('flights')

  useEffect(() => {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]')
    const found = trips.find((t: any) => t.id === params.id)
    setTrip(found)
  }, [params.id])

  const saveTrip = (updatedTrip: any) => {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]')
    const tripIndex = trips.findIndex((t: any) => t.id === params.id)
    trips[tripIndex] = updatedTrip
    localStorage.setItem('trips', JSON.stringify(trips))
    setTrip({ ...updatedTrip })
  }

  const handleSaveFlight = (flight: any) => {
    const updatedTrip = { ...trip }
    if (editingFlight) {
      const flightIndex = updatedTrip.flights.findIndex((f: any) => f.id === editingFlight.id)
      updatedTrip.flights[flightIndex] = flight
    } else {
      updatedTrip.flights.push(flight)
    }
    saveTrip(updatedTrip)
    setShowAddFlight(false)
    setEditingFlight(null)
  }

  const handleDeleteFlight = (flightId: string) => {
    const updatedTrip = { ...trip }
    updatedTrip.flights = updatedTrip.flights.filter((f: any) => f.id !== flightId)
    saveTrip(updatedTrip)
  }

  const handleEditFlight = (flight: any) => {
    setEditingFlight(flight)
    setShowAddFlight(true)
  }

  const handleSavePlan = (assignments: any) => {
    const updatedTrip = { ...trip }
    updatedTrip.flights = updatedTrip.flights.map((f: any) => {
      for (const [legIndex, flightIds] of Object.entries(assignments)) {
        if ((flightIds as string[]).includes(f.id)) {
          return { ...f, legIndex: Number(legIndex) }
        }
      }
      return { ...f, legIndex: null }
    })
    updatedTrip.planAssignments = assignments
    saveTrip(updatedTrip)
  }

  if (!trip) return <div style={{ padding: 40, textAlign: 'center' }}>Trip not found</div>

  const tabStyle = (tab: string) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    border: 'none',
    borderBottom: activeTab === tab ? '3px solid #000' : '3px solid transparent',
    backgroundColor: 'transparent',
    fontWeight: activeTab === tab ? 700 : 400,
    fontSize: 15,
    color: activeTab === tab ? '#000' : '#999',
  })

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{trip.tripName}</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>
        {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''} · {trip.departureDate}
        {trip.returnDate ? ` → ${trip.returnDate}` : ''} · {trip.dateFlexibility === 'exact' ? 'Exact dates' : trip.dateFlexibility}
      </p>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #eee', marginBottom: 20 }}>
        <button onClick={() => setActiveTab('flights')} style={tabStyle('flights')}>Flights</button>
        <button onClick={() => setActiveTab('plan')} style={tabStyle('plan')}>
          Plan
          {trip.flights.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: 12, backgroundColor: '#eee', padding: '2px 6px', borderRadius: 10 }}>
              {trip.flights.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'flights' && (
        <>
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

          {trip.flights.length === 0 ? (
            <p style={{ color: '#999', marginBottom: 12 }}>No flights added yet</p>
          ) : (
            trip.flights.map((flight: any) => (
              <div
                key={flight.id}
                style={{
                  padding: 12,
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {flight.segments.map((s: any) => s.flightCode || s.airlineName).join(' + ')}
                  </span>
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  {flight.segments[0]?.departureAirport} → {flight.segments[flight.segments.length - 1]?.arrivalAirport}
                  {flight.segments.length > 1 ? ` · ${flight.segments.length} segments` : ''}
                </div>
                <div style={{ color: '#444', fontSize: 14, marginTop: 4 }}>
                  {flight.paymentType === 'cash' && flight.cashAmount && `$${flight.cashAmount}`}
                  {flight.paymentType === 'points' && flight.pointsAmount && `${flight.pointsAmount.toLocaleString()} pts${flight.feesAmount ? ` + $${flight.feesAmount} fees` : ''}`}
                  {flight.bookingSite ? ` · via ${flight.bookingSite}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => handleEditFlight(flight)}
                    style={{ padding: '4px 12px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff', fontSize: 13, color: '#444' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFlight(flight.id)}
                    style={{ padding: '4px 12px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff', fontSize: 13, color: '#cc0000' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          {showAddFlight ? (
            <AddFlight
              legs={trip.legs}
              onSave={handleSaveFlight}
              onCancel={() => { setShowAddFlight(false); setEditingFlight(null) }}
              editingFlight={editingFlight}
            />
          ) : (
            <button
              onClick={() => setShowAddFlight(true)}
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
          )}
        </>
      )}

      {activeTab === 'plan' && (
        <>
          {trip.flights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <p style={{ fontSize: 16, marginBottom: 12 }}>Add some flights first</p>
              <button
                onClick={() => setActiveTab('flights')}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff' }}
              >
                Go to Flights →
              </button>
            </div>
          ) : (
            <TripPlanner
              legs={trip.legs}
              flights={trip.flights}
              travelers={trip.travelers || 1}
              onSave={handleSavePlan}
            />
          )}
        </>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTrip() {
  const router = useRouter()
  const [tripName, setTripName] = useState('')
  const [tripType, setTripType] = useState('roundtrip')
  const [departureCity, setDepartureCity] = useState('')
  const [destinationCity, setDestinationCity] = useState('')
  const [stops, setStops] = useState<string[]>([])
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [dateFlexibility, setDateFlexibility] = useState('exact')

  const addStop = () => {
    setStops([...stops, ''])
  }

  const updateStop = (index: number, value: string) => {
    const updated = [...stops]
    updated[index] = value
    setStops(updated)
  }

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index))
  }

  const buildLegs = () => {
    if (tripType === 'oneway') {
      return [{ from: departureCity, to: destinationCity }]
    }
    if (tripType === 'roundtrip') {
      return [
        { from: departureCity, to: destinationCity },
        { from: destinationCity, to: departureCity },
      ]
    }
    // multi-city
    const cities = [departureCity, ...stops, destinationCity]
    return cities.slice(0, -1).map((city, i) => ({
      from: city,
      to: cities[i + 1],
    }))
  }

  const handleCreate = () => {
    const legs = buildLegs()
    const trip = {
      id: crypto.randomUUID(),
      tripName,
      tripType,
      departureCity,
      destinationCity,
      stops,
      legs,
      departureDate,
      returnDate,
      travelers,
      dateFlexibility,
      flights: [],
      createdAt: new Date().toISOString(),
    }

    const existing = JSON.parse(localStorage.getItem('trips') || '[]')
    existing.push(trip)
    localStorage.setItem('trips', JSON.stringify(existing))

    router.push(`/trip/${trip.id}`)
  }

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Create a Trip</h1>

      <input
        type="text"
        placeholder="Trip name (e.g. Family Israel Trip)"
        value={tripName}
        onChange={(e) => setTripName(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4 }}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        {['roundtrip', 'oneway', 'multicity'].map((type) => (
          <button
            key={type}
            onClick={() => {
              setTripType(type)
              if (type !== 'multicity') setStops([])
            }}
            style={{
              flex: 1,
              padding: 10,
              border: tripType === type ? '2px solid #000' : '1px solid #ccc',
              borderRadius: 4,
              backgroundColor: tripType === type ? '#f0f0f0' : '#fff',
              cursor: 'pointer',
              fontWeight: tripType === type ? 'bold' : 'normal',
            }}
          >
            {type === 'roundtrip' ? 'Round Trip' : type === 'oneway' ? 'One Way' : 'Multi-City'}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Departure city (e.g. EWR)"
        value={departureCity}
        onChange={(e) => setDepartureCity(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4 }}
      />

      {tripType === 'multicity' && stops.map((stop, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            placeholder={`Stop ${i + 1} (e.g. DXB)`}
            value={stop}
            onChange={(e) => updateStop(i, e.target.value)}
            style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
          />
          <button
            onClick={() => removeStop(i)}
            style={{ padding: '10px 14px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff' }}
          >
            ✕
          </button>
        </div>
      ))}

      {tripType === 'multicity' && (
        <button
          onClick={addStop}
          style={{ marginBottom: 10, padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff', color: '#666' }}
        >
          + Add Stop
        </button>
      )}

      <input
        type="text"
        placeholder={tripType === 'multicity' ? 'Final destination (e.g. EWR)' : 'Destination (e.g. TLV)'}
        value={destinationCity}
        onChange={(e) => setDestinationCity(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4 }}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, color: '#666' }}>Departure</label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>
        {tripType !== 'oneway' && (
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, color: '#666' }}>Return</label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              style={{ display: 'block', width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, color: '#666' }}>Travelers</label>
          <input
            type="number"
            min={1}
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            style={{ display: 'block', width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, color: '#666' }}>Date flexibility</label>
          <select
            value={dateFlexibility}
            onChange={(e) => setDateFlexibility(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 4, backgroundColor: '#fff' }}
          >
            <option value="exact">Exact dates</option>
            <option value="plus_minus_1">± 1 day</option>
            <option value="plus_minus_2">± 2 days</option>
            <option value="plus_minus_3">± 3 days</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleCreate}
        style={{ width: '100%', padding: 12, backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
      >
        Start Trip →
      </button>
    </div>
  )
}
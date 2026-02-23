'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import AirportInput from '@/components/AirportInput'
import CustomSelect from '@/components/CustomSelect'

const fieldLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 4,
  display: 'block',
}

const fieldInput: React.CSSProperties = {
  width: '100%',
  height: 42,
  padding: '10px 12px',
  fontSize: 14,
  color: 'var(--text)',
  backgroundColor: 'var(--bg-input)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

export default function NewTrip() {
  const router = useRouter()
  const [tripName, setTripName] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const name = params.get('name')
    if (name) setTripName(name)
  }, [])
  const [tripType, setTripType] = useState('roundtrip')
  const [departureCity, setDepartureCity] = useState('')
  const [destinationCity, setDestinationCity] = useState('')
  const [stops, setStops] = useState<string[]>([])
  const [departureDate, setDepartureDate] = useState<Date | null>(null)
  const [returnDate, setReturnDate] = useState<Date | null>(null)
  const [travelers, setTravelers] = useState(1)
  const [dateFlexibility, setDateFlexibility] = useState('exact')

  const addStop = () => setStops([...stops, ''])
  const updateStop = (index: number, value: string) => {
    const updated = [...stops]
    updated[index] = value
    setStops(updated)
  }
  const removeStop = (index: number) => setStops(stops.filter((_, i) => i !== index))

  const toDateStr = (d: Date | null): string => {
    if (!d) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const buildLegs = () => {
    if (tripType === 'oneway') return [{ from: departureCity, to: destinationCity }]
    if (tripType === 'roundtrip') return [
      { from: departureCity, to: destinationCity },
      { from: destinationCity, to: departureCity },
    ]
    const cities = [departureCity, ...stops, destinationCity]
    return cities.slice(0, -1).map((city, i) => ({ from: city, to: cities[i + 1] }))
  }

  const handleCreate = () => {
    const trip = {
      id: crypto.randomUUID(),
      tripName,
      tripType,
      departureCity,
      destinationCity,
      stops,
      legs: buildLegs(),
      departureDate: toDateStr(departureDate),
      returnDate: toDateStr(returnDate),
      travelers,
      dateFlexibility,
      flights: [],
      itineraries: [],
      createdAt: new Date().toISOString(),
    }
    const existing = JSON.parse(localStorage.getItem('trips') || '[]')
    existing.push(trip)
    localStorage.setItem('trips', JSON.stringify(existing))
    router.push(`/trip/${trip.id}`)
  }

  const canCreate = departureCity && destinationCity && departureDate

  const tripTypes = [
    { value: 'roundtrip', label: 'Round Trip' },
    { value: 'oneway', label: 'One Way' },
    { value: 'multicity', label: 'Multi-City' },
  ]

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-light)',
        padding: 28,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Create a Trip</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Set up your route and we'll help you find the best booking strategy.
        </p>

        <label style={fieldLabel}>Trip name</label>
        <input
          type="text"
          placeholder="e.g. Family Israel Trip"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          style={{ ...fieldInput, marginBottom: 16 }}
        />

        <label style={{ ...fieldLabel, marginBottom: 6 }}>Trip type</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {tripTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => { setTripType(type.value); if (type.value !== 'multicity') setStops([]); if (type.value === 'oneway') setReturnDate(null) }}
              style={{
                flex: 1,
                padding: '10px 8px',
                height: 42,
                border: tripType === type.value ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: tripType === type.value ? 'var(--primary-light)' : 'var(--bg-card)',
                cursor: 'pointer',
                fontWeight: tripType === type.value ? 600 : 400,
                fontSize: 14,
                color: tripType === type.value ? 'var(--primary)' : 'var(--text)',
                transition: 'all 0.15s',
              }}
            >
              {type.label}
            </button>
          ))}
        </div>

        <label style={fieldLabel}>From</label>
        <div style={{ marginBottom: 12 }}>
          <AirportInput
            value={departureCity}
            onChange={setDepartureCity}
            placeholder="Departure airport or city"
          />
        </div>

        {tripType === 'multicity' && stops.map((stop, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <AirportInput
                value={stop}
                onChange={(val) => updateStop(i, val)}
                placeholder={`Stop ${i + 1}`}
              />
            </div>
            <button
              onClick={() => removeStop(i)}
              style={{
                padding: '10px 14px', height: 42,
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-muted)',
                fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {tripType === 'multicity' && (
          <button
            onClick={addStop}
            style={{
              marginBottom: 12,
              padding: '8px 16px',
              height: 42,
              border: '1.5px dashed var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              width: '100%',
            }}
          >
            + Add Stop
          </button>
        )}

        <label style={fieldLabel}>To</label>
        <div style={{ marginBottom: 16 }}>
          <AirportInput
            value={destinationCity}
            onChange={setDestinationCity}
            placeholder={tripType === 'multicity' ? 'Final destination' : 'Destination airport or city'}
          />
        </div>

        <div className="trip-date-row">
          <div className="date-col">
            <label style={fieldLabel}>{tripType === 'oneway' ? 'Departure' : 'Travel dates'}</label>
            {tripType === 'oneway' ? (
              <DatePicker
                selected={departureDate}
                onChange={(d: Date | null) => { setDepartureDate(d); setReturnDate(null) }}
                dateFormat="MMM d, yyyy"
                placeholderText="Select date"
                minDate={new Date()}
                customInput={<input type="text" style={fieldInput} />}
              />
            ) : (
              <DatePicker
                selectsRange
                startDate={departureDate}
                endDate={returnDate}
                onChange={(dates: [Date | null, Date | null]) => { setDepartureDate(dates[0]); setReturnDate(dates[1]) }}
                dateFormat="MMM d, yyyy"
                placeholderText="Select dates"
                minDate={new Date()}
                monthsShown={2}
                customInput={<input type="text" style={fieldInput} />}
              />
            )}
          </div>
          <div className="travelers-col">
            <label style={fieldLabel}>Travelers</label>
            <input
              type="number"
              min={1}
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              style={fieldInput}
            />
          </div>
          <div className="flex-col">
            <label style={fieldLabel}>Flexibility</label>
            <CustomSelect
              value={dateFlexibility}
              onChange={(v) => setDateFlexibility(v as string)}
              options={[
                { value: 'exact', label: 'Exact dates' },
                { value: 'plus_minus_1', label: '± 1 day' },
                { value: 'plus_minus_2', label: '± 2 days' },
                { value: 'plus_minus_3', label: '± 3 days' },
                { value: 'flexible', label: 'Flexible' },
              ]}
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!canCreate}
          style={{
            width: '100%',
            padding: 14,
            height: 48,
            background: canCreate ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'var(--border)',
            color: canCreate ? 'var(--text-inverse)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: canCreate ? 'pointer' : 'default',
            fontSize: 16,
            fontWeight: 600,
            boxShadow: canCreate ? '0 2px 8px rgba(67, 56, 202, 0.3)' : 'none',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          Start Trip →
        </button>
      </div>
    </div>
  )
}
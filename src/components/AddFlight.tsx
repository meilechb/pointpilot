'use client'

import { useState } from 'react'
import AirportInput from '@/components/AirportInput'

type Segment = {
  flightCode: string
  airlineName: string
  date: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  duration: number | null
}

type Props = {
  legs: { from: string; to: string }[]
  onSave: (flight: any) => void
  onCancel: () => void
  editingFlight?: any
}

export default function AddFlight({ legs, onSave, onCancel, editingFlight }: Props) {
  const [mode, setMode] = useState<'lookup' | 'manual'>('lookup')
  const [step, setStep] = useState<'flight' | 'booking'>('flight')
  const [segments, setSegments] = useState<Segment[]>(editingFlight?.segments || [])

  // Lookup
  const [lookupCode, setLookupCode] = useState('')
  const [lookupDate, setLookupDate] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')

  // Manual
  const [manualCode, setManualCode] = useState('')
  const [manualAirline, setManualAirline] = useState('')
  const [manualDate, setManualDate] = useState('')
  const [manualFrom, setManualFrom] = useState('')
  const [manualTo, setManualTo] = useState('')
  const [manualDepart, setManualDepart] = useState('')
  const [manualArrive, setManualArrive] = useState('')

  // Booking
  const [selectedLeg, setSelectedLeg] = useState(editingFlight?.legIndex || 0)
  const [bookingSite, setBookingSite] = useState(editingFlight?.bookingSite || '')
  const [paymentType, setPaymentType] = useState(editingFlight?.paymentType || 'cash')
  const [cashAmount, setCashAmount] = useState(editingFlight?.cashAmount?.toString() || '')
  const [pointsAmount, setPointsAmount] = useState(editingFlight?.pointsAmount?.toString() || '')
  const [feesAmount, setFeesAmount] = useState(editingFlight?.feesAmount?.toString() || '')

  const handleLookup = async () => {
    setLookupLoading(true)
    setLookupError('')
    try {
      const res = await fetch(`/api/flights?flight=${lookupCode}&date=${lookupDate}`)
      const data = await res.json()
      if (data.error) {
        setLookupError(data.error)
        setLookupLoading(false)
        return
      }
      const newSegment: Segment = {
        flightCode: data.flightCode || lookupCode.toUpperCase(),
        airlineName: data.airlineName || '',
        date: lookupDate || data.departureTime?.split(' ')[0] || '',
        departureAirport: data.departureAirport || '',
        arrivalAirport: data.arrivalAirport || '',
        departureTime: data.departureTime?.split(' ')[1] || '',
        arrivalTime: data.arrivalTime?.split(' ')[1] || '',
        duration: data.duration || null,
      }
      setSegments([...segments, newSegment])
      setLookupCode('')
      setLookupDate('')
      setLookupLoading(false)
    } catch {
      setLookupError('Something went wrong')
      setLookupLoading(false)
    }
  }

  const handleManualAdd = () => {
    const newSegment: Segment = {
      flightCode: manualCode.toUpperCase(),
      airlineName: manualAirline,
      date: manualDate,
      departureAirport: manualFrom.toUpperCase(),
      arrivalAirport: manualTo.toUpperCase(),
      departureTime: manualDepart,
      arrivalTime: manualArrive,
      duration: null,
    }
    setSegments([...segments, newSegment])
    setManualCode('')
    setManualAirline('')
    setManualDate('')
    setManualFrom('')
    setManualTo('')
    setManualDepart('')
    setManualArrive('')
  }

  const updateSegment = (index: number, field: keyof Segment, value: string | number | null) => {
    const updated = [...segments]
    updated[index] = { ...updated[index], [field]: value }
    setSegments(updated)
  }

  const removeSegment = (index: number) => {
    setSegments(segments.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave({
      id: editingFlight?.id || crypto.randomUUID(),
      legIndex: selectedLeg,
      segments,
      bookingSite,
      paymentType,
      cashAmount: cashAmount ? parseFloat(cashAmount) : null,
      pointsAmount: pointsAmount ? parseInt(pointsAmount) : null,
      feesAmount: feesAmount ? parseFloat(feesAmount) : null,
    })
  }

  const inputSmall = { padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 13, minWidth: 0, boxSizing: 'border-box' as const }

  // Booking step
  if (step === 'booking') {
    return (
      <div style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: 16, marginTop: 8 }}>
        <p style={{ marginBottom: 4, fontWeight: 'bold' }}>Booking details</p>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
          {segments.map(s => `${s.flightCode} ${s.departureAirport}→${s.arrivalAirport}`).join(' · ')}
        </p>

        <label style={{ fontSize: 13, color: '#666' }}>Which leg?</label>
        <select
          value={selectedLeg}
          onChange={(e) => setSelectedLeg(Number(e.target.value))}
          style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4, backgroundColor: '#fff' }}
        >
          {legs.map((leg, i) => (
            <option key={i} value={i}>Leg {i + 1}: {leg.from} → {leg.to}</option>
          ))}
        </select>

        <label style={{ fontSize: 13, color: '#666' }}>Booking site</label>
        <input
          type="text"
          placeholder="e.g. United, Virgin Atlantic, Chase Travel, Expedia"
          value={bookingSite}
          onChange={(e) => setBookingSite(e.target.value)}
          style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4 }}
        />

        <label style={{ fontSize: 13, color: '#666' }}>Payment</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <button
            onClick={() => setPaymentType('cash')}
            style={{
              flex: 1, padding: 10, border: paymentType === 'cash' ? '2px solid #000' : '1px solid #ccc',
              borderRadius: 4, backgroundColor: paymentType === 'cash' ? '#f0f0f0' : '#fff', cursor: 'pointer',
              fontWeight: paymentType === 'cash' ? 'bold' : 'normal',
            }}
          >
            Cash
          </button>
          <button
            onClick={() => setPaymentType('points')}
            style={{
              flex: 1, padding: 10, border: paymentType === 'points' ? '2px solid #000' : '1px solid #ccc',
              borderRadius: 4, backgroundColor: paymentType === 'points' ? '#f0f0f0' : '#fff', cursor: 'pointer',
              fontWeight: paymentType === 'points' ? 'bold' : 'normal',
            }}
          >
            Points
          </button>
        </div>

        {paymentType === 'cash' && (
          <input
            type="number"
            placeholder="Cash price ($)"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4 }}
          />
        )}

        {paymentType === 'points' && (
          <>
            <input
              type="number"
              placeholder="Points"
              value={pointsAmount}
              onChange={(e) => setPointsAmount(e.target.value)}
              style={{ display: 'block', width: '100%', padding: 10, marginBottom: 8, border: '1px solid #ccc', borderRadius: 4 }}
            />
            <input
              type="number"
              placeholder="Fees ($)"
              value={feesAmount}
              onChange={(e) => setFeesAmount(e.target.value)}
              style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4 }}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            style={{ flex: 1, padding: 10, backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            {editingFlight ? 'Update Flight' : 'Save Flight'}
          </button>
          <button
            onClick={() => setStep('flight')}
            style={{ padding: '10px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff' }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  // Flight entry step
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: 16, marginTop: 8 }}>

      {segments.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ padding: 10, backgroundColor: '#f9f9f9', borderRadius: 6, marginBottom: 6, border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>Segment {i + 1}</span>
                <button onClick={() => removeSegment(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: 16 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={seg.flightCode} onChange={(e) => updateSegment(i, 'flightCode', e.target.value)} style={{ ...inputSmall, flex: 1 }} placeholder="Code" />
                <input value={seg.airlineName} onChange={(e) => updateSegment(i, 'airlineName', e.target.value)} style={{ ...inputSmall, flex: 2 }} placeholder="Airline" />
                <input type="date" value={seg.date} onChange={(e) => updateSegment(i, 'date', e.target.value)} style={{ ...inputSmall, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: '22%' }}>
                  <AirportInput
                    value={seg.departureAirport}
                    onChange={(val) => updateSegment(i, 'departureAirport', val)}
                    placeholder="From"
                  />
                </div>
                <div style={{ width: '22%' }}>
                  <AirportInput
                    value={seg.arrivalAirport}
                    onChange={(val) => updateSegment(i, 'arrivalAirport', val)}
                    placeholder="To"
                  />
                </div>
                <input value={seg.departureTime} onChange={(e) => updateSegment(i, 'departureTime', e.target.value)} style={{ ...inputSmall, width: '28%' }} placeholder="Depart" />
                <input value={seg.arrivalTime} onChange={(e) => updateSegment(i, 'arrivalTime', e.target.value)} style={{ ...inputSmall, width: '28%' }} placeholder="Arrive" />
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'lookup' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Flight code (e.g. UA123)"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              style={{ flex: 2, padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
            />
            <input
              type="date"
              value={lookupDate}
              onChange={(e) => setLookupDate(e.target.value)}
              style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
            />
            <button
              onClick={handleLookup}
              disabled={lookupLoading || !lookupCode}
              style={{ padding: '10px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {lookupLoading ? '...' : 'Find'}
            </button>
          </div>
          {lookupError && <p style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{lookupError}</p>}
          <span
            onClick={() => setMode('manual')}
            style={{ fontSize: 13, color: '#999', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Enter manually instead
          </span>
        </>
      )}

      {mode === 'manual' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="text" placeholder="Flight code (optional)" value={manualCode} onChange={(e) => setManualCode(e.target.value)} style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 4 }} />
            <input type="text" placeholder="Airline" value={manualAirline} onChange={(e) => setManualAirline(e.target.value)} style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 4 }} />
          </div>
          <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} style={{ display: 'block', width: '100%', padding: 10, marginBottom: 8, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <AirportInput
              value={manualFrom}
              onChange={setManualFrom}
              placeholder="From (e.g. EWR)"
              style={{ flex: 1 }}
            />
            <AirportInput
              value={manualTo}
              onChange={setManualTo}
              placeholder="To (e.g. TLV)"
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="time" value={manualDepart} onChange={(e) => setManualDepart(e.target.value)} style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 4 }} />
            <input type="time" value={manualArrive} onChange={(e) => setManualArrive(e.target.value)} style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 4 }} />
          </div>
          <button
            onClick={handleManualAdd}
            disabled={!manualFrom || !manualTo || !manualDate}
            style={{ width: '100%', padding: 10, backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 8 }}
          >
            Add
          </button>
          <span
            onClick={() => setMode('lookup')}
            style={{ fontSize: 13, color: '#999', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Look up by flight code instead
          </span>
        </>
      )}

      {segments.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button
            onClick={() => setStep('booking')}
            style={{ flex: 1, padding: 10, backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Next: Booking Details →
          </button>
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <button onClick={onCancel} style={{ padding: '6px 12px', border: 'none', background: 'none', color: '#999', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}
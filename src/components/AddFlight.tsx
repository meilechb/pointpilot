'use client'

import { useState, useRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import AirportInput from '@/components/AirportInput'
import CustomSelect from '@/components/CustomSelect'
import ProgramSelect from '@/components/ProgramSelect'
import { airlines, bookingSites } from '@/data/programOptions'

type Segment = {
  flightCode: string
  airlineName: string
  date: string
  arrivalDate: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  departureTimeUtc: string
  arrivalTimeUtc: string
  duration: number | null
}

type Props = {
  legs: { from: string; to: string }[]
  onSave: (flight: any) => void
  onCancel: () => void
  editingFlight?: any
}

function toDateStr(d: Date | null): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromDateStr(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toTimeStr(d: Date | null): string {
  if (!d) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fromTimeStr(s: string): Date | null {
  if (!s) return null
  const [h, m] = s.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

const fieldLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-muted)',
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

export default function AddFlight({ legs, onSave, onCancel, editingFlight }: Props) {
  const [mode, setMode] = useState<'lookup' | 'manual'>('lookup')
  const [step, setStep] = useState<'flight' | 'booking'>('flight')
  const [segments, setSegments] = useState<Segment[]>(editingFlight?.segments || [])

  const [lookupCode, setLookupCode] = useState('')
  const [lookupDate, setLookupDate] = useState<Date | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')

  const [manualCode, setManualCode] = useState('')
  const [manualAirline, setManualAirline] = useState('')
  const [manualDate, setManualDate] = useState<Date | null>(null)
  const [manualArrivalDate, setManualArrivalDate] = useState<Date | null>(null)
  const [manualFrom, setManualFrom] = useState('')
  const [manualTo, setManualTo] = useState('')
  const [manualDepart, setManualDepart] = useState<Date | null>(null)
  const [manualArrive, setManualArrive] = useState<Date | null>(null)

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
      const dateStr = toDateStr(lookupDate)
      const res = await fetch(`/api/flights?flight=${lookupCode}&date=${dateStr}`)
      const data = await res.json()
      if (data.error) {
        setLookupError(data.error)
        setLookupLoading(false)
        return
      }
      const depDate = data.departureTime?.split(' ')[0] || ''
      const arrDate = data.arrivalTime?.split(' ')[0] || ''
      const depTime = data.departureTime?.split(' ')[1] || ''
      const arrTime = data.arrivalTime?.split(' ')[1] || ''

      const newSegment: Segment = {
        flightCode: data.flightCode || lookupCode.toUpperCase(),
        airlineName: data.airlineName || '',
        date: depDate,
        arrivalDate: arrDate,
        departureAirport: data.departureAirport || '',
        arrivalAirport: data.arrivalAirport || '',
        departureTime: depTime,
        arrivalTime: arrTime,
        departureTimeUtc: data.departureTimeUtc || '',
        arrivalTimeUtc: data.arrivalTimeUtc || '',
        duration: data.duration || null,
      }
      setSegments([...segments, newSegment])
      setLookupCode('')
      setLookupDate(null)
      setLookupLoading(false)
    } catch {
      setLookupError('Something went wrong')
      setLookupLoading(false)
    }
  }

  const handleManualAdd = () => {
    const dateStr = toDateStr(manualDate)
    const arrDateStr = toDateStr(manualArrivalDate) || dateStr
    const newSegment: Segment = {
      flightCode: manualCode.toUpperCase(),
      airlineName: manualAirline,
      date: dateStr,
      arrivalDate: arrDateStr,
      departureAirport: manualFrom.toUpperCase(),
      arrivalAirport: manualTo.toUpperCase(),
      departureTime: toTimeStr(manualDepart),
      arrivalTime: toTimeStr(manualArrive),
      departureTimeUtc: '',
      arrivalTimeUtc: '',
      duration: null,
    }
    setSegments([...segments, newSegment])
    setManualCode('')
    setManualAirline('')
    setManualDate(null)
    setManualArrivalDate(null)
    setManualFrom('')
    setManualTo('')
    setManualDepart(null)
    setManualArrive(null)
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

  const editingBanner = editingFlight && (
    <div style={{
      padding: '8px 14px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
      borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: 13, fontWeight: 600,
    }}>
      ✎ Editing — {editingFlight.segments?.map((s: any) => s.flightCode).filter(Boolean).join(', ') || 'flight'}
    </div>
  )

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: editingFlight ? '2px solid var(--primary)' : '1px solid var(--border-light)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: 20,
  }

  if (step === 'booking') {
    return (
      <div style={cardStyle}>
        {editingBanner}
        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Booking details</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
          {segments.map(s => `${s.flightCode} ${s.departureAirport}→${s.arrivalAirport}`).join(' · ')}
        </p>

        <label style={fieldLabel}>Which leg?</label>
        <div style={{ marginBottom: 14 }}>
          <CustomSelect
            value={selectedLeg}
            onChange={(v) => setSelectedLeg(Number(v))}
            options={legs.map((leg, i) => ({
              value: i,
              label: `Leg ${i + 1}: ${leg.from} → ${leg.to}`,
            }))}
          />
        </div>

        <label style={fieldLabel}>Booking site</label>
        <ProgramSelect
          value={bookingSite}
          onChange={setBookingSite}
          options={bookingSites}
          placeholder="e.g. United.com, Chase Travel Portal"
          style={{ marginBottom: 14 }}
        />

        <label style={fieldLabel}>Payment type</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['cash', 'points'].map(type => (
            <button
              key={type}
              onClick={() => setPaymentType(type)}
              style={{
                flex: 1, padding: 10, height: 42,
                border: paymentType === type ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: paymentType === type ? 'var(--primary-light)' : 'var(--bg-card)',
                cursor: 'pointer',
                fontWeight: paymentType === type ? 600 : 400,
                fontSize: 14,
                color: paymentType === type ? 'var(--primary)' : 'var(--text)',
                transition: 'all 0.15s',
              }}
            >
              {type === 'cash' ? '💵 Cash' : '⭐ Points'}
            </button>
          ))}
        </div>

        {paymentType === 'cash' && (
          <>
            <label style={fieldLabel}>Price per person ($)</label>
            <input type="number" placeholder="e.g. 450" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} style={{ marginBottom: 14 }} />
          </>
        )}

        {paymentType === 'points' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Points per person</label>
              <input type="number" placeholder="e.g. 50000" value={pointsAmount} onChange={(e) => setPointsAmount(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Taxes & fees ($)</label>
              <input type="number" placeholder="e.g. 45" value={feesAmount} onChange={(e) => setFeesAmount(e.target.value)} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={handleSave} style={{
            flex: 1, padding: 12, height: 44,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'var(--text-inverse)', border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>
            {editingFlight ? 'Update Flight' : 'Save Flight'}
          </button>
          <button onClick={() => setStep('flight')} style={{
            padding: '12px 20px', height: 44,
            border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', backgroundColor: 'var(--bg-card)', fontSize: 14,
            color: 'var(--text-secondary)',
          }}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      {editingBanner}

      {/* Existing segments */}
      {segments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{
              padding: 14, backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)', marginBottom: 8,
              border: '1px solid var(--border-light)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>
                  ✈ Segment {i + 1}{seg.flightCode ? ` — ${seg.flightCode}` : ''}
                </span>
                <button
                  onClick={() => removeSegment(i)}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: 16, padding: '0 4px',
                  }}
                >✕</button>
              </div>

              <div className="segment-grid-3">
                <div>
                  <label style={fieldLabel}>Code</label>
                  <input type="text" value={seg.flightCode} onChange={(e) => updateSegment(i, 'flightCode', e.target.value)} placeholder="UA123" style={fieldInput} />
                </div>
                <div>
                  <label style={fieldLabel}>Airline</label>
                  <ProgramSelect value={seg.airlineName} onChange={(val) => updateSegment(i, 'airlineName', val)} options={airlines} placeholder="United Airlines" />
                </div>
                <div>
                  <label style={fieldLabel}>Date</label>
                  <DatePicker
                    selected={fromDateStr(seg.date)}
                    onChange={(d: Date | null) => updateSegment(i, 'date', toDateStr(d))}
                    dateFormat="MMM d, yyyy"
                    placeholderText="Select"
                    customInput={<input type="text" style={fieldInput} />}
                  />
                </div>
              </div>

              <div className="segment-grid-4">
                <div>
                  <label style={fieldLabel}>From</label>
                  <AirportInput value={seg.departureAirport} onChange={(val) => updateSegment(i, 'departureAirport', val)} placeholder="EWR" />
                </div>
                <div>
                  <label style={fieldLabel}>To</label>
                  <AirportInput value={seg.arrivalAirport} onChange={(val) => updateSegment(i, 'arrivalAirport', val)} placeholder="LHR" />
                </div>
                <div>
                  <label style={fieldLabel}>Departs</label>
                  <DatePicker
                    selected={fromTimeStr(seg.departureTime)}
                    onChange={(d: Date | null) => updateSegment(i, 'departureTime', toTimeStr(d))}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={5}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    placeholderText="Time"
                    customInput={<input type="text" style={fieldInput} />}
                  />
                </div>
                <div>
                  <label style={fieldLabel}>Arrives</label>
                  <DatePicker
                    selected={fromTimeStr(seg.arrivalTime)}
                    onChange={(d: Date | null) => updateSegment(i, 'arrivalTime', toTimeStr(d))}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={5}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    placeholderText="Time"
                    customInput={<input type="text" style={fieldInput} />}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lookup mode */}
      {mode === 'lookup' && (
        <>
          <div className="lookup-grid">
            <div>
              <label style={fieldLabel}>Flight code</label>
              <input
                type="text"
                placeholder="e.g. UA123"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && lookupCode) handleLookup() }}
                style={fieldInput}
              />
            </div>
            <div>
              <label style={fieldLabel}>Date</label>
              <DatePicker
                selected={lookupDate}
                onChange={(d: Date | null) => setLookupDate(d)}
                dateFormat="MMM d, yyyy"
                placeholderText="Select date"
                customInput={<input type="text" style={fieldInput} />}
              />
            </div>
            <div>
              <label style={{ ...fieldLabel, visibility: 'hidden' as const }}>.</label>
              <button
                onClick={handleLookup}
                disabled={lookupLoading || !lookupCode}
                style={{
                  height: 42, padding: '0 20px',
                  background: lookupLoading || !lookupCode ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: lookupLoading || !lookupCode ? 'var(--text-muted)' : 'var(--text-inverse)',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: lookupLoading || !lookupCode ? 'default' : 'pointer',
                  fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' as const,
                }}
              >
                {lookupLoading ? '...' : 'Find'}
              </button>
            </div>
          </div>
          {lookupError && (
            <div style={{
              padding: '8px 12px', backgroundColor: 'var(--danger-bg)',
              borderRadius: 'var(--radius-sm)', border: '1px solid #FECACA',
              fontSize: 13, color: 'var(--danger)', marginBottom: 10,
            }}>
              {lookupError}
            </div>
          )}
          <button
            onClick={() => setMode('manual')}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-muted)', padding: 0,
            }}
          >
            Enter manually instead →
          </button>
        </>
      )}

      {/* Manual mode */}
      {mode === 'manual' && (
        <>
          <div className="manual-grid-2">
            <div>
              <label style={fieldLabel}>Flight code (optional)</label>
              <input type="text" placeholder="e.g. UA123" value={manualCode} onChange={(e) => setManualCode(e.target.value)} style={fieldInput} />
            </div>
            <div>
              <label style={fieldLabel}>Airline</label>
              <ProgramSelect value={manualAirline} onChange={setManualAirline} options={airlines} placeholder="e.g. United Airlines" />
            </div>
          </div>

          <div className="manual-grid-2">
            <div>
              <label style={fieldLabel}>Departure date</label>
              <DatePicker
                selected={manualDate}
                onChange={(d: Date | null) => { setManualDate(d); if (!manualArrivalDate) setManualArrivalDate(d) }}
                dateFormat="MMM d, yyyy"
                placeholderText="Select date"
                customInput={<input type="text" style={fieldInput} />}
              />
            </div>
            <div>
              <label style={fieldLabel}>Arrival date</label>
              <DatePicker
                selected={manualArrivalDate}
                onChange={(d: Date | null) => setManualArrivalDate(d)}
                dateFormat="MMM d, yyyy"
                placeholderText="Select date"
                customInput={<input type="text" style={fieldInput} />}
              />
            </div>
          </div>

          <div className="manual-grid-2">
            <div>
              <label style={fieldLabel}>From</label>
              <AirportInput value={manualFrom} onChange={setManualFrom} placeholder="e.g. EWR" />
            </div>
            <div>
              <label style={fieldLabel}>To</label>
              <AirportInput value={manualTo} onChange={setManualTo} placeholder="e.g. TLV" />
            </div>
          </div>

          <div className="manual-grid-2" style={{ marginBottom: 12 }}>
            <div>
              <label style={fieldLabel}>Departure time</label>
              <DatePicker
                selected={manualDepart}
                onChange={(d: Date | null) => setManualDepart(d)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={5}
                timeCaption="Time"
                dateFormat="h:mm aa"
                placeholderText="Select time"
                customInput={<input type="text" style={fieldInput} />}
              />
            </div>
            <div>
              <label style={fieldLabel}>Arrival time</label>
              <DatePicker
                selected={manualArrive}
                onChange={(d: Date | null) => setManualArrive(d)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={5}
                timeCaption="Time"
                dateFormat="h:mm aa"
                placeholderText="Select time"
                customInput={<input type="text" style={fieldInput} />}
              />
            </div>
          </div>

          <button
            onClick={handleManualAdd}
            disabled={!manualFrom || !manualTo || !manualDate}
            style={{
              width: '100%', padding: 12, height: 44, marginBottom: 10,
              background: !manualFrom || !manualTo || !manualDate ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: !manualFrom || !manualTo || !manualDate ? 'var(--text-muted)' : 'var(--text-inverse)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: !manualFrom || !manualTo || !manualDate ? 'default' : 'pointer',
              fontWeight: 600, fontSize: 14,
            }}
          >
            Add Segment
          </button>
          <button
            onClick={() => setMode('lookup')}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-muted)', padding: 0,
            }}
          >
            Look up by flight code instead →
          </button>
        </>
      )}

      {/* Next button */}
      {segments.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setStep('booking')} style={{
            width: '100%', padding: 12, height: 44,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'var(--text-inverse)', border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>
            Next: Booking Details →
          </button>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <button
          onClick={onCancel}
          style={{
            border: 'none', background: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: 0,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
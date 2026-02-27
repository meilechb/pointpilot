'use client'

import { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import AirportInput from '@/components/AirportInput'
import CustomSelect from '@/components/CustomSelect'
import ProgramSelect from '@/components/ProgramSelect'
import { airlines, bookingSites } from '@/data/programOptions'
import { useAuth } from '@/components/AuthProvider'

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

export type PricingTier = {
  id: string
  label: string
  paymentType: 'cash' | 'points'
  cashAmount: number | null
  pointsAmount: number | null
  feesAmount: number | null
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

export default function AddFlight({ legs, onSave, onCancel, editingFlight }: Props) {
  const { session } = useAuth()
  const [mode, setMode] = useState<'lookup' | 'manual'>('lookup')
  const [step, setStep] = useState<'flight' | 'booking'>('flight')
  const [segments, setSegments] = useState<Segment[]>(editingFlight?.segments || [])

  const [showAddMore, setShowAddMore] = useState(segments.length === 0)

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

  // Pricing tiers
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(editingFlight?.pricingTiers || [])
  const [defaultTierLabel, setDefaultTierLabel] = useState(editingFlight?.defaultTierLabel || '')
  const [showTierForm, setShowTierForm] = useState(false)
  const [tierLabel, setTierLabel] = useState('')
  const [tierPaymentType, setTierPaymentType] = useState<'cash' | 'points'>('cash')
  const [tierCashAmount, setTierCashAmount] = useState('')
  const [tierPointsAmount, setTierPointsAmount] = useState('')
  const [tierFeesAmount, setTierFeesAmount] = useState('')
  const [editingTierId, setEditingTierId] = useState<string | null>(null)

  const handleLookup = async () => {
    setLookupLoading(true)
    setLookupError('')
    try {
      const dateStr = toDateStr(lookupDate)
      const res = await fetch(`/api/flights?flight=${lookupCode}&date=${dateStr}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const data = await res.json()
      if (data.error) {
        setLookupError(data.error)
        setLookupLoading(false)
        return
      }
      const depDate = data.departureTime?.split(' ')[0] || ''
      const arrDate = data.arrivalTime?.split(' ')[0] || depDate
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
      setShowAddMore(false)
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
    setShowAddMore(false)
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

  const resetTierForm = () => {
    setTierLabel('')
    setTierPaymentType('cash')
    setTierCashAmount('')
    setTierPointsAmount('')
    setTierFeesAmount('')
    setEditingTierId(null)
    setShowTierForm(false)
  }

  const handleAddTier = () => {
    if (!tierLabel) return
    const tier: PricingTier = {
      id: editingTierId || crypto.randomUUID(),
      label: tierLabel,
      paymentType: tierPaymentType,
      cashAmount: tierCashAmount ? parseFloat(tierCashAmount) : null,
      pointsAmount: tierPointsAmount ? parseInt(tierPointsAmount) : null,
      feesAmount: tierFeesAmount ? parseFloat(tierFeesAmount) : null,
    }
    if (editingTierId) {
      setPricingTiers(pricingTiers.map(t => t.id === editingTierId ? tier : t))
    } else {
      setPricingTiers([...pricingTiers, tier])
    }
    resetTierForm()
  }

  const startEditTier = (tier: PricingTier) => {
    setEditingTierId(tier.id)
    setTierLabel(tier.label)
    setTierPaymentType(tier.paymentType)
    setTierCashAmount(tier.cashAmount?.toString() || '')
    setTierPointsAmount(tier.pointsAmount?.toString() || '')
    setTierFeesAmount(tier.feesAmount?.toString() || '')
    setShowTierForm(true)
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
      ...(defaultTierLabel ? { defaultTierLabel } : {}),
      ...(pricingTiers.length > 0 ? { pricingTiers } : {}),
    })
  }

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const editingBanner = editingFlight && (
    <div style={{
      padding: '8px 14px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
      borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: 13, fontWeight: 600,
    }}>
      ✎ Editing — {editingFlight.segments?.map((s: any) => s.flightCode).filter(Boolean).join(', ') || 'flight'}
    </div>
  )

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '40px 16px',
    overflowY: 'auto',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: editingFlight ? '2px solid var(--primary)' : '1px solid var(--border-light)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    padding: 24,
    width: '100%',
    maxWidth: 560,
    position: 'relative',
  }

  // Flight summary for booking step
  const flightSummary = segments.length > 0 && (
    <div style={{
      marginBottom: 18,
      padding: 14,
      backgroundColor: 'var(--bg)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-light)',
    }}>
      {segments.map((seg, i) => {
        const h = seg.duration ? Math.floor(seg.duration / 60) : null
        const m = seg.duration ? seg.duration % 60 : null
        const durationStr = h !== null ? (m ? `${h}h ${m}m` : `${h}h`) : null
        return (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: i > 0 ? '8px 0 0' : 0,
            borderTop: i > 0 ? '1px solid var(--border-light)' : 'none',
            marginTop: i > 0 ? 8 : 0,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                {seg.departureAirport} → {seg.arrivalAirport}
                {seg.flightCode && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>{seg.flightCode}</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {seg.date && new Date(seg.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {seg.departureTime && ` at ${seg.departureTime}`}
                {seg.arrivalTime && ` → ${seg.arrivalTime}`}
                {seg.arrivalDate && seg.arrivalDate !== seg.date && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--warning)',
                    backgroundColor: 'var(--warning-bg)', padding: '1px 5px',
                    borderRadius: 4, marginLeft: 4,
                  }}>+1</span>
                )}
              </div>
            </div>
            {durationStr && (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 12 }}>
                {durationStr}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  if (step === 'booking') {
    return (
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div style={cardStyle}>
        {editingBanner}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <p style={{ fontWeight: 600, fontSize: 15 }}>Booking details</p>
          <button onClick={onCancel} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', padding: '0 4px' }}>✕</button>
        </div>
        {flightSummary}

        <label style={fieldLabel}>Booking site</label>
        <ProgramSelect
          value={bookingSite}
          onChange={setBookingSite}
          options={bookingSites}
          placeholder="e.g. United.com, Chase Travel Portal"
          style={{ marginBottom: 14 }}
        />

        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Which leg?</label>
            <CustomSelect
              value={selectedLeg}
              onChange={(v) => setSelectedLeg(Number(v))}
              options={legs.map((leg, i) => ({
                value: i,
                label: `Leg ${i + 1}: ${leg.from} → ${leg.to}`,
              }))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Cabin class (optional)</label>
            <CustomSelect
              value={defaultTierLabel}
              onChange={(v) => setDefaultTierLabel(v as string)}
              options={[
                { value: '', label: 'None' },
                { value: 'Economy', label: 'Economy' },
                { value: 'Premium Economy', label: 'Premium Economy' },
                { value: 'Business', label: 'Business' },
                { value: 'First', label: 'First' },
              ]}
              placeholder="Select cabin class"
            />
          </div>
        </div>

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

        {/* Additional pricing tiers */}
        {pricingTiers.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {pricingTiers.map(tier => (
              <div key={tier.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', marginBottom: 4,
                backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
              }}>
                <div style={{ fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{tier.label}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                    {tier.paymentType === 'cash' && tier.cashAmount ? `$${tier.cashAmount.toLocaleString()}` : ''}
                    {tier.paymentType === 'points' && tier.pointsAmount ? `${tier.pointsAmount.toLocaleString()} pts` : ''}
                    {tier.paymentType === 'points' && tier.feesAmount ? ` + $${tier.feesAmount}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={() => startEditTier(tier)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', padding: '2px 5px' }}>✎</button>
                  <button onClick={() => setPricingTiers(pricingTiers.filter(t => t.id !== tier.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', padding: '2px 5px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showTierForm ? (
          <button
            onClick={() => { setShowTierForm(true); setTierPaymentType(paymentType as 'cash' | 'points') }}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--text-muted)', padding: 0, marginBottom: 14,
              display: 'block',
            }}
          >
            + Compare with another cabin class
          </button>
        ) : (
          <div style={{
            padding: 10, marginBottom: 14,
            backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 12 }}>{editingTierId ? 'Edit option' : 'Add pricing option'}</span>
              <button onClick={resetTierForm} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: '0 4px' }}>✕</button>
            </div>

            <label style={{ ...fieldLabel, fontSize: 12 }}>Payment type</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {(['cash', 'points'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTierPaymentType(type)}
                  style={{
                    flex: 1, padding: 6, height: 32, fontSize: 12,
                    border: tierPaymentType === type ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: tierPaymentType === type ? 'var(--primary-light)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    fontWeight: tierPaymentType === type ? 600 : 400,
                    color: tierPaymentType === type ? 'var(--primary)' : 'var(--text)',
                    transition: 'all 0.15s',
                  }}
                >
                  {type === 'cash' ? 'Cash' : 'Points'}
                </button>
              ))}
            </div>

            {tierPaymentType === 'cash' && (
              <>
                <label style={{ ...fieldLabel, fontSize: 12 }}>Price per person ($)</label>
                <input type="number" placeholder="e.g. 1200" value={tierCashAmount} onChange={(e) => setTierCashAmount(e.target.value)} style={{ marginBottom: 8 }} />
              </>
            )}

            {tierPaymentType === 'points' && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...fieldLabel, fontSize: 12 }}>Points per person</label>
                  <input type="number" placeholder="e.g. 80000" value={tierPointsAmount} onChange={(e) => setTierPointsAmount(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...fieldLabel, fontSize: 12 }}>Taxes & fees ($)</label>
                  <input type="number" placeholder="e.g. 45" value={tierFeesAmount} onChange={(e) => setTierFeesAmount(e.target.value)} />
                </div>
              </div>
            )}

            <label style={{ ...fieldLabel, fontSize: 12 }}>Cabin class</label>
            <div style={{ marginBottom: 8 }}>
              <CustomSelect
                value={tierLabel}
                onChange={(v) => setTierLabel(v as string)}
                options={[
                  { value: 'Economy', label: 'Economy' },
                  { value: 'Premium Economy', label: 'Premium Economy' },
                  { value: 'Business', label: 'Business' },
                  { value: 'First', label: 'First' },
                ]}
                placeholder="Select cabin class"
              />
            </div>

            <button
              onClick={handleAddTier}
              disabled={!tierLabel}
              style={{
                width: '100%', padding: 8, height: 34,
                background: !tierLabel ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: !tierLabel ? 'var(--text-muted)' : 'var(--text-inverse)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: !tierLabel ? 'default' : 'pointer',
                fontWeight: 600, fontSize: 12,
              }}
            >
              {editingTierId ? 'Update' : 'Add'}
            </button>
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
      </div>
    )
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontWeight: 600, fontSize: 15 }}>{editingFlight ? 'Edit Flight' : 'Add Flight'}</p>
        <button onClick={onCancel} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', padding: '0 4px' }}>✕</button>
      </div>
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

      {/* Hint for first segment */}
      {segments.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          Has a layover? You can add connecting flights after.
        </p>
      )}

      {/* Add connecting segment button (shown after first segment is added) */}
      {segments.length > 0 && !showAddMore && (
        <button
          onClick={() => setShowAddMore(true)}
          style={{
            border: '1.5px dashed var(--border)', background: 'none', cursor: 'pointer',
            fontSize: 13, color: 'var(--text-muted)', padding: '8px 0',
            width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 4,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          + Add connecting flight
        </button>
      )}

      {/* Lookup mode */}
      {showAddMore && mode === 'lookup' && (
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
      {showAddMore && mode === 'manual' && (
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

    </div>
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import AddFlight from '@/components/AddFlight'
import TripPlanner from '@/components/TripPlanner'
import FlightCard from '@/components/FlightCard'
import AirportInput from '@/components/AirportInput'
import CustomSelect from '@/components/CustomSelect'
import { getCityName, calculateTotalTime, calculateFlyingTime, getStopsLabel, calculateLayovers, formatTime, formatDate } from '@/utils/airportUtils'
import { analyzeItinerary } from '@/utils/bookingAnalyzer'
import { optimizeTrip, getRelevantSweetSpots, type BookingStrategy } from '@/utils/tripOptimizer'
import SavePrompt from '@/components/SavePrompt'
import { loadTripById, saveTrip as saveTripRemote, loadWallet } from '@/lib/dataService'

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const fieldLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block',
}
const fieldInput: React.CSSProperties = {
  width: '100%', height: 42, padding: '10px 12px', fontSize: 14,
  color: 'var(--text)', backgroundColor: 'var(--bg-input)',
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
}

export default function TripDetail() {
  const params = useParams()
  const { user } = useAuth()
  const [trip, setTrip] = useState<any>(null)
  const [tripLoading, setTripLoading] = useState(true)
  const [showAddFlight, setShowAddFlight] = useState(false)
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'flights' | 'plan' | 'optimize' | 'itineraries'>('flights')
  const [savePromptTrigger, setSavePromptTrigger] = useState<'flight' | 'plan' | 'trip' | 'wallet' | null>(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editTripType, setEditTripType] = useState('roundtrip')
  const [editDepartureCity, setEditDepartureCity] = useState('')
  const [editDestinationCity, setEditDestinationCity] = useState('')
  const [editStops, setEditStops] = useState<string[]>([])
  const [editDepartureDate, setEditDepartureDate] = useState<Date | null>(null)
  const [editReturnDate, setEditReturnDate] = useState<Date | null>(null)
  const [editTravelers, setEditTravelers] = useState(1)
  const [editDateFlexibility, setEditDateFlexibility] = useState('exact')
  const [wallet, setWallet] = useState<any[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [emailTarget, setEmailTarget] = useState<any>(null)
  const [emailAddress, setEmailAddress] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    setTripLoading(true)
    Promise.all([
      loadTripById(params.id as string),
      loadWallet(),
    ]).then(([found, walletData]) => {
      if (found && !found.itineraries) found.itineraries = []
      setTrip(found)
      setWallet(walletData || [])
      // No longer caching wallet in unscoped localStorage — dataService handles scoping
      setTripLoading(false)
    })
  }, [params.id])

  const saveTrip = (updatedTrip: any) => {
    setTrip({ ...updatedTrip })
    saveTripRemote(updatedTrip).catch(err => {
      console.error('Failed to save trip to Supabase:', err)
    })
  }

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null
    const d = new Date(dateStr + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d
  }

  const toDateStr = (d: Date | null): string => {
    if (!d) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const startEditing = () => {
    setEditName(trip.tripName || '')
    setEditTripType(trip.tripType || 'roundtrip')
    setEditDepartureCity(trip.departureCity || trip.legs?.[0]?.from || '')
    setEditDestinationCity(trip.destinationCity || trip.legs?.[trip.legs.length - 1]?.to || '')
    setEditStops(trip.stops || [])
    setEditDepartureDate(parseDate(trip.departureDate))
    setEditReturnDate(parseDate(trip.returnDate))
    setEditTravelers(trip.travelers || 1)
    setEditDateFlexibility(trip.dateFlexibility || 'exact')
    setIsEditing(true)
  }

  const buildEditLegs = () => {
    if (editTripType === 'oneway') return [{ from: editDepartureCity, to: editDestinationCity }]
    if (editTripType === 'roundtrip') return [
      { from: editDepartureCity, to: editDestinationCity },
      { from: editDestinationCity, to: editDepartureCity },
    ]
    const cities = [editDepartureCity, ...editStops, editDestinationCity]
    return cities.slice(0, -1).map((city, i) => ({ from: city, to: cities[i + 1] }))
  }

  const editLegsChanged = trip && JSON.stringify(buildEditLegs()) !== JSON.stringify(trip.legs)

  const handleSaveEdit = () => {
    const newLegs = buildEditLegs()
    const legsChanged = JSON.stringify(newLegs) !== JSON.stringify(trip.legs)

    const updatedTrip = {
      ...trip,
      tripName: editName,
      tripType: editTripType,
      departureCity: editDepartureCity,
      destinationCity: editDestinationCity,
      stops: editStops,
      legs: newLegs,
      departureDate: toDateStr(editDepartureDate),
      returnDate: toDateStr(editReturnDate),
      travelers: editTravelers,
      dateFlexibility: editDateFlexibility,
    }

    if (legsChanged) {
      updatedTrip.flights = updatedTrip.flights.map((f: any) => ({ ...f, legIndex: null }))
      updatedTrip.planAssignments = {}
      updatedTrip.itineraries = []
    }

    saveTrip(updatedTrip)
    setIsEditing(false)
  }

  const canSaveEdit = editDepartureCity && editDestinationCity && editDepartureDate

  const handleSaveFlight = (flight: any) => {
    const updatedTrip = { ...trip }
    if (editingFlightId) {
      const flightIndex = updatedTrip.flights.findIndex((f: any) => f.id === editingFlightId)
      updatedTrip.flights[flightIndex] = flight
    } else {
      updatedTrip.flights.push(flight)
    }
    saveTrip(updatedTrip)
    setShowAddFlight(false)
    if (!editingFlightId && updatedTrip.flights.length === 1) {
      setSavePromptTrigger('flight')
    }
    setEditingFlightId(null)
  }

  const handleDeleteFlight = (flightId: string) => {
    const updatedTrip = { ...trip }
    updatedTrip.flights = updatedTrip.flights.filter((f: any) => f.id !== flightId)
    saveTrip(updatedTrip)
    if (editingFlightId === flightId) setEditingFlightId(null)
  }

  const handleChangeTier = (flightId: string, tier: any | null) => {
    const updatedTrip = { ...trip }
    const flight = updatedTrip.flights.find((f: any) => f.id === flightId)
    if (!flight) return
    if (tier) {
      // Copy tier values to top-level fields
      flight.paymentType = tier.paymentType
      flight.cashAmount = tier.cashAmount
      flight.pointsAmount = tier.pointsAmount
      flight.feesAmount = tier.feesAmount
    }
    // If tier is null, keep current top-level values (already the default)
    saveTrip(updatedTrip)
  }

  const handleSavePlan = (assignments: any, planName: string) => {
    const updatedTrip = { ...trip }
    const flightMap: Record<string, any> = {}
    updatedTrip.flights.forEach((f: any) => { flightMap[f.id] = f })

    let totalCash = 0
    let totalPoints = 0
    let totalFees = 0
    Object.values(assignments).flat().forEach((id: any) => {
      const f = flightMap[id]
      if (!f) return
      if (f.paymentType === 'cash') totalCash += f.cashAmount || 0
      if (f.paymentType === 'points') {
        totalPoints += f.pointsAmount || 0
        totalFees += f.feesAmount || 0
      }
    })

    const itinerary = {
      id: crypto.randomUUID(),
      name: planName,
      createdAt: new Date().toISOString(),
      assignments,
      totals: { cash: totalCash, points: totalPoints, fees: totalFees },
      travelers: updatedTrip.travelers || 1,
    }

    if (!updatedTrip.itineraries) updatedTrip.itineraries = []
    updatedTrip.itineraries.push(itinerary)
    updatedTrip.planAssignments = assignments

    updatedTrip.flights = updatedTrip.flights.map((f: any) => {
      for (const [legIndex, flightIds] of Object.entries(assignments)) {
        if ((flightIds as string[]).includes(f.id)) {
          return { ...f, legIndex: Number(legIndex) }
        }
      }
      return { ...f, legIndex: null }
    })

    saveTrip(updatedTrip)
    if (updatedTrip.itineraries.length === 1) {
      setSavePromptTrigger('plan')
    }
    setActiveTab('itineraries')
  }

  const handleDeleteItinerary = (itineraryId: string) => {
    const updatedTrip = { ...trip }
    updatedTrip.itineraries = updatedTrip.itineraries.filter((it: any) => it.id !== itineraryId)
    saveTrip(updatedTrip)
  }

  const handleRenameItinerary = (itineraryId: string, newName: string) => {
    const updatedTrip = { ...trip }
    const it = updatedTrip.itineraries.find((i: any) => i.id === itineraryId)
    if (it) it.name = newName
    saveTrip(updatedTrip)
  }

  if (tripLoading) return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      {/* Skeleton header */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        padding: 28,
        marginBottom: 20,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        <div style={{ height: 24, width: '40%', backgroundColor: 'var(--border)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 16, width: '60%', backgroundColor: 'var(--border-light)', borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 16, width: '30%', backgroundColor: 'var(--border-light)', borderRadius: 6 }} />
      </div>
      {/* Skeleton tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[80, 60, 80, 100].map((w, i) => (
          <div key={i} style={{ height: 36, width: w, backgroundColor: 'var(--border-light)', borderRadius: 'var(--radius-sm)' }} />
        ))}
      </div>
      {/* Skeleton card */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        padding: 24,
      }}>
        <div style={{ height: 16, width: '50%', backgroundColor: 'var(--border)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 16, width: '70%', backgroundColor: 'var(--border-light)', borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 16, width: '40%', backgroundColor: 'var(--border-light)', borderRadius: 6 }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )

  if (!trip) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
      Trip not found
    </div>
  )

  const tabs = [
    { key: 'flights', label: 'Flights', count: trip.flights.length || null },
    { key: 'plan', label: 'Plan', count: null },
    { key: 'optimize', label: 'Optimize', count: null },
    { key: 'itineraries', label: 'Itineraries', count: trip.itineraries?.length || null },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      {!isEditing ? (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)',
          padding: 0,
          marginBottom: 20,
          overflow: 'hidden',
        }}>
          {/* Top banner with route visualization */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            padding: '18px 24px',
            color: 'var(--text-inverse)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: 'var(--text-inverse)' }}>
                  {trip.tripName || 'Untitled Trip'}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {trip.legs.map((leg: any, i: number) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{getCityName(leg.from) || leg.from}</span>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>→</span>
                      {i === trip.legs.length - 1 && (
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{getCityName(leg.to) || leg.to}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={startEditing}
                style={{
                  padding: '5px 14px', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.15)', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-inverse)', transition: 'background-color 0.15s',
                  flexShrink: 0,
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)' }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)' }}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Details row */}
          <div style={{
            padding: '14px 24px',
            display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>📅</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {formatShortDate(trip.departureDate)}
                {trip.returnDate ? ` – ${formatShortDate(trip.returnDate)}` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>👤</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {trip.legs.map((leg: any, i: number) => (
                <span key={i} style={{
                  padding: '2px 8px',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--primary)',
                }}>
                  {leg.from} → {leg.to}
                </span>
              ))}
            </div>

            {trip.tripType && (
              <span style={{
                fontSize: 12, fontWeight: 500,
                padding: '2px 8px', borderRadius: 12,
                backgroundColor: 'var(--bg)', color: 'var(--text-muted)',
                border: '1px solid var(--border-light)',
              }}>
                {trip.tripType === 'oneway' ? 'One Way' : trip.tripType === 'multicity' ? 'Multi-City' : 'Round Trip'}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-light)',
          padding: '20px 24px',
          marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Edit Trip</h2>

          <label style={fieldLabel}>Trip name</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Family Israel Trip"
            style={{ ...fieldInput, marginBottom: 16 }}
          />

          <label style={{ ...fieldLabel, marginBottom: 6 }}>Trip type</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { value: 'roundtrip', label: 'Round Trip' },
              { value: 'oneway', label: 'One Way' },
              { value: 'multicity', label: 'Multi-City' },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => { setEditTripType(type.value); if (type.value !== 'multicity') setEditStops([]); if (type.value === 'oneway') setEditReturnDate(null) }}
                style={{
                  flex: 1, padding: '10px 8px', height: 42,
                  border: editTripType === type.value ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: editTripType === type.value ? 'var(--primary-light)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontWeight: editTripType === type.value ? 600 : 400,
                  fontSize: 14,
                  color: editTripType === type.value ? 'var(--primary)' : 'var(--text)',
                  transition: 'all 0.15s',
                }}
              >
                {type.label}
              </button>
            ))}
          </div>

          <label style={fieldLabel}>From</label>
          <div style={{ marginBottom: 12 }}>
            <AirportInput value={editDepartureCity} onChange={setEditDepartureCity} placeholder="Departure airport or city" />
          </div>

          {editTripType === 'multicity' && editStops.map((stop, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <AirportInput
                  value={stop}
                  onChange={(val: string) => { const updated = [...editStops]; updated[i] = val; setEditStops(updated) }}
                  placeholder={`Stop ${i + 1}`}
                />
              </div>
              <button
                onClick={() => setEditStops(editStops.filter((_, idx) => idx !== i))}
                style={{
                  padding: '10px 14px', height: 42,
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-muted)', fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
          ))}

          {editTripType === 'multicity' && (
            <button
              onClick={() => setEditStops([...editStops, ''])}
              style={{
                marginBottom: 12, padding: '8px 16px', height: 42,
                border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', backgroundColor: 'transparent',
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, width: '100%',
              }}
            >
              + Add Stop
            </button>
          )}

          <label style={fieldLabel}>To</label>
          <div style={{ marginBottom: 16 }}>
            <AirportInput value={editDestinationCity} onChange={setEditDestinationCity} placeholder={editTripType === 'multicity' ? 'Final destination' : 'Destination airport or city'} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>{editTripType === 'oneway' ? 'Departure' : 'Travel dates'}</label>
            {editTripType === 'oneway' ? (
              <DatePicker
                selected={editDepartureDate}
                onChange={(d: Date | null) => { setEditDepartureDate(d); setEditReturnDate(null) }}
                dateFormat="MMM d, yyyy"
                placeholderText="Select departure date"
                minDate={new Date()}
                customInput={<input type="text" style={fieldInput} />}
              />
            ) : (
              <DatePicker
                selectsRange
                startDate={editDepartureDate}
                endDate={editReturnDate}
                onChange={(dates: [Date | null, Date | null]) => { setEditDepartureDate(dates[0]); setEditReturnDate(dates[1]) }}
                dateFormat="MMM d, yyyy"
                placeholderText="Select date range"
                minDate={new Date()}
                monthsShown={2}
                customInput={<input type="text" style={fieldInput} />}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Travelers</label>
              <input
                type="number"
                min={1}
                value={editTravelers}
                onChange={(e) => setEditTravelers(Number(e.target.value))}
                style={fieldInput}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Date flexibility</label>
              <CustomSelect
                value={editDateFlexibility}
                onChange={(v) => setEditDateFlexibility(v as string)}
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

          {isEditing && editLegsChanged && (
            <div style={{
              padding: '10px 14px', backgroundColor: 'var(--warning-bg)',
              borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A',
              fontSize: 13, color: 'var(--warning)', marginBottom: 12,
            }}>
              Changing routes will reset flight assignments and clear saved itineraries.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSaveEdit}
              disabled={!canSaveEdit}
              style={{
                flex: 1, padding: 12,
                background: canSaveEdit ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'var(--border)',
                color: canSaveEdit ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: canSaveEdit ? 'pointer' : 'default',
                fontSize: 14, fontWeight: 600,
              }}
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: '12px 24px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                backgroundColor: 'var(--bg-card)', fontSize: 14, color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-light)',
        padding: 4,
        marginBottom: 20,
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === tab.key ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-inverse)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 600 : 500,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span style={{
                fontSize: 13, fontWeight: 700,
                padding: '1px 6px', borderRadius: 10,
                backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--border-light)',
                color: activeTab === tab.key ? 'var(--text-inverse)' : 'var(--text-muted)',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Flights Tab */}
      {activeTab === 'flights' && (
        <>
          {trip.flights.length === 0 && !showAddFlight ? (
            <div style={{
              textAlign: 'center', padding: 48,
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✈️</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>No flights added yet</p>
              <button
                onClick={() => setShowAddFlight(true)}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: 'var(--text-inverse)',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >
                + Add Your First Flight
              </button>
            </div>
          ) : (
            <>
              {!editingFlightId && (
                <button
                  onClick={() => setShowAddFlight(true)}
                  style={{
                    width: '100%', padding: 14, marginBottom: 12,
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    color: 'var(--text-inverse)',
                    border: 'none', borderRadius: 'var(--radius)',
                    cursor: 'pointer', fontSize: 15, fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(67, 56, 202, 0.3)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(67, 56, 202, 0.4)' }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(67, 56, 202, 0.3)' }}
                >
                  + Add Flight
                </button>
              )}

              {trip.flights.map((flight: any) => (
                <div key={flight.id} style={{ marginBottom: 10 }}>
                  {editingFlightId === flight.id ? (
                    <AddFlight
                      legs={trip.legs}
                      onSave={handleSaveFlight}
                      onCancel={() => setEditingFlightId(null)}
                      editingFlight={flight}
                    />
                  ) : (
                    <FlightCard
                      flight={flight}
                      onEdit={() => { setEditingFlightId(flight.id); setShowAddFlight(false) }}
                      onDelete={() => handleDeleteFlight(flight.id)}
                    />
                  )}
                </div>
              ))}

              {showAddFlight && (
                <AddFlight
                  legs={trip.legs}
                  onSave={handleSaveFlight}
                  onCancel={() => setShowAddFlight(false)}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <>
          {trip.flights.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 48,
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Add some flights first</p>
              <button
                onClick={() => setActiveTab('flights')}
                style={{
                  padding: '10px 24px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  backgroundColor: 'var(--bg-card)', fontSize: 14, fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
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
              onChangeTier={handleChangeTier}
            />
          )}
        </>
      )}

      {/* Optimize Tab */}
      {activeTab === 'optimize' && (
        <OptimizerPanel trip={trip} wallet={wallet} onSaveStrategy={(strategy: BookingStrategy) => {
          const assignments: Record<string, string[]> = {}
          strategy.bookings.forEach(b => {
            const key = String(b.legIndex)
            if (!assignments[key]) assignments[key] = []
            if (b.flightId && !assignments[key].includes(b.flightId)) {
              assignments[key].push(b.flightId)
            }
          })
          const itinerary = {
            id: crypto.randomUUID(),
            name: strategy.name,
            createdAt: new Date().toISOString(),
            assignments,
            totals: { cash: strategy.totalCash, points: strategy.totalPoints, fees: 0 },
            travelers: trip.travelers || 1,
          }
          const updatedTrip = { ...trip }
          if (!updatedTrip.itineraries) updatedTrip.itineraries = []
          updatedTrip.itineraries.push(itinerary)
          saveTrip(updatedTrip)
          setActiveTab('itineraries')
        }} />
      )}

      {/* Itineraries Tab */}
      {activeTab === 'itineraries' && (
        <>
          {(!trip.itineraries || trip.itineraries.length === 0) ? (
            <div style={{
              textAlign: 'center', padding: 48,
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📑</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>No saved itineraries yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Go to Plan, assign flights to legs, and save.</p>
              <button
                onClick={() => setActiveTab('plan')}
                style={{
                  padding: '10px 24px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  backgroundColor: 'var(--bg-card)', fontSize: 14, fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                Go to Plan →
              </button>
            </div>
          ) : (
            <>
              {/* Toolbar: Compare + bulk actions */}
              {trip.itineraries.length >= 2 && (
                <div style={{
                  display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center',
                }}>
                  {!showCompare ? (
                    <button
                      onClick={() => { setShowCompare(true); setCompareIds([]) }}
                      style={{
                        padding: '8px 16px', border: '1px solid var(--primary)',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        backgroundColor: 'var(--primary-light)', fontSize: 13, fontWeight: 600,
                        color: 'var(--primary)', transition: 'all 0.15s',
                      }}
                    >
                      Compare Itineraries
                    </button>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Select 2–3 itineraries to compare:
                      </span>
                      <button
                        onClick={() => setShowCompare(false)}
                        style={{
                          padding: '6px 14px', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          backgroundColor: 'var(--bg-card)', fontSize: 13, color: 'var(--text-muted)',
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Compare view */}
              {showCompare && compareIds.length >= 2 && (
                <CompareView
                  itineraries={trip.itineraries.filter((it: any) => compareIds.includes(it.id))}
                  trip={trip}
                  wallet={wallet}
                  onClose={() => { setShowCompare(false); setCompareIds([]) }}
                />
              )}

              {/* Itinerary cards */}
              {trip.itineraries.map((itinerary: any) => (
                <ItineraryCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  trip={trip}
                  wallet={wallet}
                  onDelete={() => handleDeleteItinerary(itinerary.id)}
                  onRename={(name: string) => handleRenameItinerary(itinerary.id, name)}
                  onPrint={() => printItinerary(itinerary, trip, wallet)}
                  onEmail={() => { setEmailTarget(itinerary); setEmailAddress(''); setEmailSent(false) }}
                  compareMode={showCompare}
                  compareSelected={compareIds.includes(itinerary.id)}
                  onCompareToggle={() => {
                    setCompareIds(prev =>
                      prev.includes(itinerary.id)
                        ? prev.filter(id => id !== itinerary.id)
                        : prev.length < 3 ? [...prev, itinerary.id] : prev
                    )
                  }}
                />
              ))}
            </>
          )}

          {/* Email modal */}
          {emailTarget && (
            <div style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }} onClick={() => setEmailTarget(null)}>
              <div style={{
                backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                padding: 28, maxWidth: 420, width: '90%', boxShadow: 'var(--shadow-lg)',
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Email Itinerary</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Send &quot;{emailTarget.name}&quot; to someone
                </div>
                {emailSent ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Email Sent!</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      The itinerary has been sent to {emailAddress}
                    </div>
                    <button onClick={() => setEmailTarget(null)} style={{
                      marginTop: 16, padding: '8px 24px',
                      background: 'var(--primary)', color: 'white', border: 'none',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600,
                    }}>Done</button>
                  </div>
                ) : (
                  <>
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', fontSize: 14,
                        border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-input)', color: 'var(--text)',
                        outline: 'none', marginBottom: 12,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEmailTarget(null)} style={{
                        padding: '8px 16px', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        backgroundColor: 'var(--bg-card)', fontSize: 13, color: 'var(--text-muted)',
                      }}>Cancel</button>
                      <button
                        disabled={!emailAddress || emailSending}
                        onClick={async () => {
                          setEmailSending(true)
                          try {
                            const res = await fetch('/api/email-itinerary', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                to: emailAddress,
                                itinerary: emailTarget,
                                trip: { tripName: trip.tripName, legs: trip.legs, travelers: trip.travelers },
                                flights: trip.flights,
                                senderName: user?.user_metadata?.full_name || user?.user_metadata?.name || undefined,
                                senderEmail: user?.email || undefined,
                              }),
                            })
                            if (res.ok) setEmailSent(true)
                            else alert('Failed to send email')
                          } catch { alert('Failed to send email') }
                          setEmailSending(false)
                        }}
                        style={{
                          padding: '8px 20px', border: 'none',
                          borderRadius: 'var(--radius-sm)', cursor: emailAddress && !emailSending ? 'pointer' : 'not-allowed',
                          background: emailAddress && !emailSending ? 'var(--primary)' : 'var(--border)',
                          color: 'white', fontSize: 13, fontWeight: 600,
                        }}
                      >
                        {emailSending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <SavePrompt trigger={savePromptTrigger} />
    </div>
  )
}

function OptimizerPanel({ trip, wallet: walletProp, onSaveStrategy }: { trip: any; wallet: any[]; onSaveStrategy: (s: BookingStrategy) => void }) {
  const [strategies, setStrategies] = useState<BookingStrategy[]>([])
  const [loading, setLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const wallet = walletProp
  const hasWallet = wallet.length > 0
  const hasFlights = trip.flights.length > 0
  const hasAssignedFlights = trip.flights.some((f: any) => f.legIndex !== null && f.legIndex !== undefined)

  const runOptimizer = () => {
    setLoading(true)
    // Small delay for UX feedback
    setTimeout(() => {
      const results = optimizeTrip(trip.legs, trip.flights, wallet, trip.travelers || 1)
      setStrategies(results)
      setHasRun(true)
      setLoading(false)
      if (results.length > 0) setExpandedId(results[0].id)
    }, 400)
  }

  const relevantSpots = hasFlights ? getRelevantSweetSpots(trip.flights) : []

  if (!hasFlights) {
    return (
      <div style={{
        textAlign: 'center', padding: 48,
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px dashed var(--border)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>Add flights first to optimize your booking</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>The optimizer analyzes your flights and wallet to find the best way to book.</p>
      </div>
    )
  }

  if (!hasAssignedFlights) {
    return (
      <div style={{
        textAlign: 'center', padding: 48,
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px dashed var(--border)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>Assign flights to legs first</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Go to the Plan tab, drag flights into legs, then come back to optimize.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Wallet warning */}
      {!hasWallet && (
        <div style={{
          padding: '12px 16px', backgroundColor: 'var(--warning-bg)',
          borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A',
          fontSize: 13, color: 'var(--warning)', marginBottom: 16,
        }}>
          You haven't added point balances yet. Go to <strong>My Points</strong> to add your balances for personalized recommendations.
        </div>
      )}

      {/* Run button */}
      <button
        onClick={runOptimizer}
        disabled={loading}
        style={{
          width: '100%', padding: 16, marginBottom: 20,
          background: loading ? 'var(--border)' : 'linear-gradient(135deg, #059669, #10B981)',
          color: 'white',
          border: 'none', borderRadius: 'var(--radius)',
          cursor: loading ? 'default' : 'pointer',
          fontSize: 16, fontWeight: 700,
          boxShadow: loading ? 'none' : '0 2px 8px rgba(5, 150, 105, 0.3)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <>Analyzing...</>
        ) : hasRun ? (
          <>Re-analyze Booking Options</>
        ) : (
          <>Find Best Booking Strategy</>
        )}
      </button>

      {/* Results */}
      {hasRun && strategies.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 32,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            No strategies could be generated. Make sure flights have prices and are assigned to legs.
          </p>
        </div>
      )}

      {strategies.map((strategy, idx) => (
        <div key={strategy.id} style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)',
          border: idx === 0 ? '2px solid var(--primary)' : '1px solid var(--border-light)',
          marginBottom: 12,
          overflow: 'hidden',
        }}>
          {/* Strategy header */}
          <div
            onClick={() => setExpandedId(expandedId === strategy.id ? null : strategy.id)}
            style={{
              padding: '14px 16px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{strategy.name}</span>
                {idx === 0 && (
                  <span style={{
                    fontSize: 13, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 10, backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    Recommended
                  </span>
                )}
                {strategy.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 13, fontWeight: 600, padding: '2px 8px',
                    borderRadius: 10, backgroundColor: 'var(--bg-accent)',
                    color: 'var(--text-secondary)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {strategy.description}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {strategy.totalCash > 0 && (
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  ${strategy.totalCash.toLocaleString()}
                </div>
              )}
              {strategy.totalPoints > 0 && (
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                  {strategy.totalPoints.toLocaleString()} pts
                </div>
              )}
              {strategy.estimatedCpp > 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {strategy.estimatedCpp} cpp
                </div>
              )}
              <span style={{
                fontSize: 13, color: 'var(--text-muted)',
                display: 'inline-block',
                transition: 'transform 0.2s',
                transform: expandedId === strategy.id ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>▼</span>
            </div>
          </div>

          {/* Expanded: booking steps */}
          {expandedId === strategy.id && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-light)' }}>
              {strategy.warnings.length > 0 && (
                <div style={{
                  padding: '10px 14px', backgroundColor: 'var(--warning-bg)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A',
                  fontSize: 13, color: 'var(--warning)', marginTop: 16, marginBottom: 4,
                }}>
                  {strategy.warnings.map((w, i) => <div key={i}>{w}</div>)}
                </div>
              )}

              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 16, marginBottom: 12 }}>
                Step-by-Step Booking Guide
              </div>

              {strategy.bookings.map((booking, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, marginBottom: 8,
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    backgroundColor: booking.method === 'cash' ? 'var(--success-bg)'
                      : booking.method === 'transfer' ? '#EDE9FE'
                      : booking.method === 'portal' ? '#DBEAFE'
                      : 'var(--primary-light)',
                    color: booking.method === 'cash' ? 'var(--success)'
                      : booking.method === 'transfer' ? '#7C3AED'
                      : booking.method === 'portal' ? '#2563EB'
                      : 'var(--primary)',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 3 }}>
                      Leg {booking.legIndex + 1}: {trip.legs[booking.legIndex]?.from} → {trip.legs[booking.legIndex]?.to}
                      <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>— {booking.flightLabel}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {booking.description}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 13 }}>
                      {booking.cashCost > 0 && (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          💵 ${booking.cashCost.toLocaleString()}
                        </span>
                      )}
                      {booking.pointsCost > 0 && (
                        <span style={{ color: 'var(--primary)' }}>
                          ⭐ {booking.pointsCost.toLocaleString()} pts
                        </span>
                      )}
                      {booking.method === 'transfer' && (
                        <span style={{ color: '#7C3AED' }}>
                          🔄 {booking.transferRatio}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div style={{
                marginTop: 16, padding: '14px 16px',
                backgroundColor: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Trip Total</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
                  {strategy.totalCash > 0 && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Cash: </span>
                      <strong>${strategy.totalCash.toLocaleString()}</strong>
                    </div>
                  )}
                  {strategy.totalPoints > 0 && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Points: </span>
                      <strong style={{ color: 'var(--primary)' }}>{strategy.totalPoints.toLocaleString()}</strong>
                    </div>
                  )}
                  {strategy.estimatedCpp > 0 && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Value: </span>
                      <strong>{strategy.estimatedCpp} cpp</strong>
                    </div>
                  )}
                  {strategy.savingsVsCash > 0 && (
                    <div style={{ color: 'var(--success)' }}>
                      Saving ${strategy.savingsVsCash.toLocaleString()} vs all-cash
                    </div>
                  )}
                </div>
                {(trip.travelers || 1) > 1 && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                    Totals for {trip.travelers} travelers
                  </div>
                )}
              </div>

              {/* Save as itinerary button */}
              <button
                onClick={() => onSaveStrategy(strategy)}
                style={{
                  marginTop: 14, padding: '10px 20px', width: '100%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: 'var(--text-inverse)', border: 'none',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(67, 56, 202, 0.3)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(67, 56, 202, 0.4)' }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(67, 56, 202, 0.3)' }}
              >
                Save as Itinerary
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Sweet spots */}
      {hasRun && relevantSpots.length > 0 && (
        <div style={{
          marginTop: 20,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-light)',
          padding: '16px 20px',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            Sweet Spots for Your Trip
          </div>
          {relevantSpots.map((spot, i) => (
            <div key={i} style={{
              padding: '10px 14px', marginBottom: 8,
              backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{spot.title}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{spot.estimatedValue}</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{spot.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function printItinerary(itinerary: any, trip: any, wallet: any[]) {
  const travelers = itinerary.travelers || 1
  const totals = itinerary.totals || { cash: 0, points: 0, fees: 0 }
  const flightMap: Record<string, any> = {}
  trip.flights.forEach((f: any) => { flightMap[f.id] = f })

  const steps = analyzeItinerary(itinerary.assignments, trip.flights, wallet, travelers)

  const legsHtml = trip.legs.map((leg: any, i: number) => {
    const flightIds = itinerary.assignments?.[i] || []
    const flights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)
    const flightsHtml = flights.length === 0
      ? '<div style="color:#888;padding:8px;border:1px dashed #ddd;border-radius:6px">No flights assigned</div>'
      : flights.map((f: any) => {
        const segs = f.segments || []
        const firstSeg = segs[0] || {}
        const lastSeg = segs[segs.length - 1] || firstSeg
        const airline = firstSeg.airline || ''
        const flightNum = firstSeg.flightNumber || ''
        const route = `${firstSeg.departureAirport || '?'} → ${lastSeg.arrivalAirport || '?'}`
        const price = f.paymentType === 'cash'
          ? `$${(f.cashAmount || 0).toLocaleString()}`
          : `${(f.pointsAmount || 0).toLocaleString()} pts + $${(f.feesAmount || 0).toLocaleString()}`
        return `<div style="padding:8px 12px;background:#f9f9fb;border-radius:6px;margin-bottom:4px;border:1px solid #e5e7eb">
          <div style="font-weight:600;font-size:14px">${airline} ${flightNum}</div>
          <div style="font-size:13px;color:#555">${route} — ${price}</div>
        </div>`
      }).join('')

    return `<div style="margin-bottom:16px">
      <div style="font-weight:700;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">
        Leg ${i + 1}: ${getCityName(leg.from)} → ${getCityName(leg.to)}
      </div>
      ${flightsHtml}
    </div>`
  }).join('')

  const stepsHtml = steps.map((step, i) => {
    return `<div style="display:flex;gap:10px;margin-bottom:6px;padding:8px 12px;background:#f9f9fb;border-radius:6px;border:1px solid #e5e7eb">
      <div style="width:24px;height:24px;border-radius:50%;background:#e0e7ff;color:#4338ca;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">${i + 1}</div>
      <div>
        <div style="font-size:12px;color:#888">${step.flightLabel}</div>
        <div style="font-size:13px">${step.message}</div>
      </div>
    </div>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><title>${itinerary.name} — ${trip.tripName}</title>
    <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:32px;color:#1a1a2e}
    @media print{body{padding:16px}}</style></head><body>
    <h1 style="font-size:22px;margin-bottom:4px">${itinerary.name}</h1>
    <div style="font-size:14px;color:#666;margin-bottom:20px">${trip.tripName} — ${travelers} traveler${travelers > 1 ? 's' : ''}</div>
    <div style="display:flex;gap:20px;margin-bottom:24px;padding:14px 16px;background:#f0f0f8;border-radius:8px">
      ${totals.cash > 0 ? `<div><div style="font-size:12px;color:#888">Cash</div><div style="font-weight:700">$${(totals.cash * travelers).toLocaleString()}</div></div>` : ''}
      ${totals.points > 0 ? `<div><div style="font-size:12px;color:#888">Points</div><div style="font-weight:700;color:#4338ca">${(totals.points * travelers).toLocaleString()}</div></div>` : ''}
      ${totals.fees > 0 ? `<div><div style="font-size:12px;color:#888">Fees</div><div style="font-weight:700">$${(totals.fees * travelers).toLocaleString()}</div></div>` : ''}
    </div>
    <h2 style="font-size:16px;margin-bottom:12px">Flight Details</h2>
    ${legsHtml}
    ${steps.length > 0 ? `<h2 style="font-size:16px;margin-bottom:12px;margin-top:24px">How to Book</h2>${stepsHtml}` : ''}
    <div style="margin-top:24px;font-size:12px;color:#aaa;border-top:1px solid #e5e7eb;padding-top:12px">
      Generated by Point Tripper — pointtripper.com
    </div>
  </body></html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }
}

function CompareView({ itineraries, trip, wallet, onClose }: {
  itineraries: any[]
  trip: any
  wallet: any[]
  onClose: () => void
}) {
  const flightMap: Record<string, any> = {}
  trip.flights.forEach((f: any) => { flightMap[f.id] = f })

  // Helper to get all flights for an itinerary
  const getItinFlights = (it: any) => {
    const allFlights: any[] = []
    trip.legs.forEach((_: any, i: number) => {
      const ids = it.assignments?.[i] || []
      ids.forEach((id: string) => { if (flightMap[id]) allFlights.push(flightMap[id]) })
    })
    return allFlights
  }

  // Helper to compute total duration/flying time across all legs
  const getTotalDuration = (it: any) => {
    const flights = getItinFlights(it)
    let totalMin = 0
    flights.forEach((f: any) => {
      const segs = f.segments || []
      const timeStr = calculateTotalTime(segs)
      const match = timeStr.match(/(\d+)h\s*(\d+)?m?/)
      if (match) totalMin += parseInt(match[1]) * 60 + (parseInt(match[2]) || 0)
      else {
        const mMatch = timeStr.match(/(\d+)m/)
        if (mMatch) totalMin += parseInt(mMatch[1])
      }
    })
    if (totalMin === 0) return '—'
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`
  }

  const getTotalFlyingTime = (it: any) => {
    const flights = getItinFlights(it)
    let totalMin = 0
    flights.forEach((f: any) => {
      const segs = f.segments || []
      const timeStr = calculateFlyingTime(segs)
      const match = timeStr.match(/(\d+)h\s*(\d+)?m?/)
      if (match) totalMin += parseInt(match[1]) * 60 + (parseInt(match[2]) || 0)
      else {
        const mMatch = timeStr.match(/(\d+)m/)
        if (mMatch) totalMin += parseInt(mMatch[1])
      }
    })
    if (totalMin === 0) return '—'
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`
  }

  const getTotalStops = (it: any) => {
    const flights = getItinFlights(it)
    return flights.reduce((sum: number, f: any) => sum + Math.max(0, (f.segments?.length || 1) - 1), 0)
  }

  const rowLabel: React.CSSProperties = {
    padding: '10px 12px', fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap',
  }
  const rowValue: React.CSSProperties = {
    padding: '10px 12px', textAlign: 'center', fontSize: 13,
    borderBottom: '1px solid var(--border-light)',
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '2px solid var(--primary)',
      padding: 20,
      marginBottom: 20,
      overflow: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Compare Itineraries</div>
        <button onClick={onClose} style={{
          padding: '6px 14px', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          backgroundColor: 'var(--bg-card)', fontSize: 13, color: 'var(--text-muted)',
        }}>Close</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `130px repeat(${itineraries.length}, 1fr)`, gap: 0, fontSize: 13 }}>
        {/* Header */}
        <div style={{ padding: '12px', borderBottom: '2px solid var(--border)' }} />
        {itineraries.map(it => (
          <div key={it.id} style={{
            padding: '12px', fontWeight: 700, fontSize: 14,
            borderBottom: '2px solid var(--border)',
            backgroundColor: 'var(--primary-light)',
            textAlign: 'center', color: 'var(--primary)',
          }}>
            {it.name}
          </div>
        ))}

        {/* Cost section */}
        <div style={{ ...rowLabel, backgroundColor: 'var(--bg)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Cost</div>
        {itineraries.map(it => (
          <div key={it.id} style={{ ...rowValue, backgroundColor: 'var(--bg)' }} />
        ))}

        <div style={rowLabel}>Cash</div>
        {itineraries.map(it => {
          const t = it.totals || { cash: 0, points: 0, fees: 0 }
          const tv = it.travelers || 1
          return <div key={it.id} style={{ ...rowValue, fontWeight: 700, fontSize: 15 }}>{t.cash > 0 ? `$${(t.cash * tv).toLocaleString()}` : '—'}</div>
        })}

        <div style={rowLabel}>Points</div>
        {itineraries.map(it => {
          const t = it.totals || { cash: 0, points: 0, fees: 0 }
          const tv = it.travelers || 1
          return <div key={it.id} style={{ ...rowValue, fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>{t.points > 0 ? `${(t.points * tv).toLocaleString()}` : '—'}</div>
        })}

        <div style={rowLabel}>Taxes & Fees</div>
        {itineraries.map(it => {
          const t = it.totals || { cash: 0, points: 0, fees: 0 }
          const tv = it.travelers || 1
          return <div key={it.id} style={{ ...rowValue, color: 'var(--text-muted)' }}>{t.fees > 0 ? `$${(t.fees * tv).toLocaleString()}` : '—'}</div>
        })}

        {/* Travel section */}
        <div style={{ ...rowLabel, backgroundColor: 'var(--bg)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Travel</div>
        {itineraries.map(it => (
          <div key={it.id} style={{ ...rowValue, backgroundColor: 'var(--bg)' }} />
        ))}

        <div style={rowLabel}>Total Duration</div>
        {itineraries.map(it => (
          <div key={it.id} style={rowValue}>{getTotalDuration(it)}</div>
        ))}

        <div style={rowLabel}>Flying Time</div>
        {itineraries.map(it => (
          <div key={it.id} style={rowValue}>{getTotalFlyingTime(it)}</div>
        ))}

        <div style={rowLabel}>Total Stops</div>
        {itineraries.map(it => {
          const stops = getTotalStops(it)
          return <div key={it.id} style={{ ...rowValue, fontWeight: 600, color: stops === 0 ? 'var(--success)' : 'var(--text)' }}>
            {stops === 0 ? 'Nonstop' : stops}
          </div>
        })}

        <div style={rowLabel}>Booking Steps</div>
        {itineraries.map(it => {
          const steps = analyzeItinerary(it.assignments, trip.flights, wallet, it.travelers || 1)
          return <div key={it.id} style={rowValue}>{steps.length}</div>
        })}

        {/* Legs section */}
        {trip.legs.map((leg: any, i: number) => (
          <React.Fragment key={`leg-${i}`}>
            <div style={{ ...rowLabel, backgroundColor: 'var(--bg)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
              Leg {i + 1}: {leg.from} → {leg.to}
            </div>
            {itineraries.map(it => (
              <div key={`${it.id}-legheader-${i}`} style={{ ...rowValue, backgroundColor: 'var(--bg)' }} />
            ))}

            {itineraries[0] && (() => {
              // Render a row per itinerary flight for this leg
              return (
                <>
                  <div style={rowLabel}>Flight</div>
                  {itineraries.map(it => {
                    const flightIds = it.assignments?.[i] || []
                    const flights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)
                    return (
                      <div key={`${it.id}-flight-${i}`} style={rowValue}>
                        {flights.length === 0 ? <span style={{ color: 'var(--text-muted)' }}>—</span> : flights.map((f: any) => {
                          const seg = f.segments?.[0] || {}
                          return <div key={f.id} style={{ fontWeight: 600 }}>{seg.airlineName || seg.airline || ''} {seg.flightNumber || seg.flightCode || ''}</div>
                        })}
                      </div>
                    )
                  })}

                  <div style={rowLabel}>Times</div>
                  {itineraries.map(it => {
                    const flightIds = it.assignments?.[i] || []
                    const flights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)
                    return (
                      <div key={`${it.id}-times-${i}`} style={rowValue}>
                        {flights.length === 0 ? '—' : flights.map((f: any) => {
                          const segs = f.segments || []
                          const dep = formatTime(segs[0]?.departureTime)
                          const arr = formatTime(segs[segs.length - 1]?.arrivalTime)
                          return <div key={f.id}>{dep && arr ? `${dep} – ${arr}` : '—'}</div>
                        })}
                      </div>
                    )
                  })}

                  <div style={rowLabel}>Duration</div>
                  {itineraries.map(it => {
                    const flightIds = it.assignments?.[i] || []
                    const flights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)
                    return (
                      <div key={`${it.id}-dur-${i}`} style={rowValue}>
                        {flights.length === 0 ? '—' : flights.map((f: any) => (
                          <div key={f.id}>{calculateTotalTime(f.segments || []) || '—'}</div>
                        ))}
                      </div>
                    )
                  })}

                  <div style={rowLabel}>Stops</div>
                  {itineraries.map(it => {
                    const flightIds = it.assignments?.[i] || []
                    const flights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)
                    return (
                      <div key={`${it.id}-stops-${i}`} style={rowValue}>
                        {flights.length === 0 ? '—' : flights.map((f: any) => {
                          const label = getStopsLabel(f.segments || [])
                          return <div key={f.id} style={{ color: label === 'Nonstop' ? 'var(--success)' : 'var(--text)', fontWeight: 500 }}>{label}</div>
                        })}
                      </div>
                    )
                  })}

                  <div style={rowLabel}>Price</div>
                  {itineraries.map(it => {
                    const flightIds = it.assignments?.[i] || []
                    const flights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)
                    return (
                      <div key={`${it.id}-price-${i}`} style={rowValue}>
                        {flights.length === 0 ? '—' : flights.map((f: any) => (
                          <div key={f.id} style={{ fontWeight: 600, color: f.paymentType === 'points' ? 'var(--primary)' : 'var(--text)' }}>
                            {f.paymentType === 'cash'
                              ? `$${(f.cashAmount || 0).toLocaleString()}`
                              : `${(f.pointsAmount || 0).toLocaleString()} pts`}
                            {f.paymentType === 'points' && f.feesAmount ? <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>+ ${f.feesAmount} fees</div> : null}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </>
              )
            })()}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function ItineraryCard({ itinerary, trip, wallet, onDelete, onRename, onPrint, onEmail, compareMode, compareSelected, onCompareToggle }: {
  itinerary: any
  trip: any
  wallet: any[]
  onDelete: () => void
  onRename: (name: string) => void
  onPrint: () => void
  onEmail: () => void
  compareMode?: boolean
  compareSelected?: boolean
  onCompareToggle?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(itinerary.name)

  const flightMap: Record<string, any> = {}
  trip.flights.forEach((f: any) => { flightMap[f.id] = f })

  const travelers = itinerary.travelers || 1
  const totals = itinerary.totals || { cash: 0, points: 0, fees: 0 }

  const savedDate = new Date(itinerary.createdAt)
  const dateStr = savedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  const steps = expanded ? analyzeItinerary(itinerary.assignments, trip.flights, wallet, travelers) : []
  const hasShortfall = steps.some(s => s.type === 'shortfall')
  const hasWallet = wallet.length > 0
  const hasPointsFlights = steps.some(s => s.type !== 'cash')

  // Compute summary stats for the header
  const allFlights: any[] = []
  trip.legs.forEach((_: any, i: number) => {
    const ids = itinerary.assignments?.[i] || []
    ids.forEach((id: string) => { if (flightMap[id]) allFlights.push(flightMap[id]) })
  })
  const totalStops = allFlights.reduce((sum: number, f: any) => sum + Math.max(0, (f.segments?.length || 1) - 1), 0)
  const legCount = trip.legs?.length || 0

  const actionBtn: React.CSSProperties = {
    padding: '7px 14px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    backgroundColor: 'var(--bg-card)', fontSize: 13, color: 'var(--text-secondary)',
    fontWeight: 500, transition: 'border-color 0.15s, background 0.15s',
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      border: compareMode && compareSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
      marginBottom: 14,
      overflow: 'hidden',
      transition: 'box-shadow 0.15s, border-color 0.15s',
    }}>
      {/* Header */}
      <div
        onClick={() => compareMode ? onCompareToggle?.() : setExpanded(!expanded)}
        style={{
          padding: '16px 20px', cursor: 'pointer',
          ...(compareMode && compareSelected ? { backgroundColor: 'var(--primary-light)' } : {}),
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {compareMode && (
              <input
                type="checkbox"
                checked={compareSelected}
                onChange={() => onCompareToggle?.()}
                onClick={(e) => e.stopPropagation()}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
              />
            )}
            <div>
              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => { onRename(name); setEditing(false) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { onRename(name); setEditing(false) } }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  style={{ fontWeight: 700, fontSize: 16, padding: '2px 8px', width: 200 }}
                />
              ) : (
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{itinerary.name}</div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saved {dateStr}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'right' }}>
              {totals.cash > 0 && <div style={{ fontSize: 16, fontWeight: 700 }}>${(totals.cash * travelers).toLocaleString()}</div>}
              {totals.points > 0 && <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>{(totals.points * travelers).toLocaleString()} pts</div>}
              {totals.fees > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>+ ${(totals.fees * travelers).toLocaleString()} fees</div>}
            </div>
            <span style={{
              fontSize: 12, color: 'var(--text-muted)',
              transition: 'transform 0.2s',
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>&#9660;</span>
          </div>
        </div>

        {/* Summary chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 12, padding: '3px 10px', borderRadius: 12,
            backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', fontWeight: 500,
          }}>
            {legCount} leg{legCount !== 1 ? 's' : ''}
          </span>
          <span style={{
            fontSize: 12, padding: '3px 10px', borderRadius: 12,
            backgroundColor: totalStops === 0 ? 'var(--success-bg)' : 'var(--bg)',
            color: totalStops === 0 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 500,
          }}>
            {totalStops === 0 ? 'All nonstop' : `${totalStops} stop${totalStops !== 1 ? 's' : ''} total`}
          </span>
          {travelers > 1 && (
            <span style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 12,
              backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', fontWeight: 500,
            }}>
              {travelers} travelers
            </span>
          )}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-light)' }}>
          {/* Flights by leg */}
          {trip.legs.map((leg: any, i: number) => {
            const flightIds = itinerary.assignments?.[i] || []
            const flights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)

            return (
              <div key={i} style={{ marginTop: 18 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                    fontSize: 11, fontWeight: 700,
                  }}>{i + 1}</span>
                  {getCityName(leg.from)} ({leg.from}) → {getCityName(leg.to)} ({leg.to})
                </div>
                {flights.length === 0 ? (
                  <div style={{
                    fontSize: 13, color: 'var(--text-muted)', padding: '12px 14px',
                    backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--border)',
                  }}>
                    No flights assigned
                  </div>
                ) : (
                  flights.map((f: any) => {
                    const segs = f.segments || []
                    const firstSeg = segs[0] || {}
                    const lastSeg = segs[segs.length - 1] || firstSeg
                    const airline = firstSeg.airlineName || firstSeg.airline || ''
                    const flightNum = firstSeg.flightNumber || firstSeg.flightCode || ''
                    const depTime = formatTime(firstSeg.departureTime)
                    const arrTime = formatTime(lastSeg.arrivalTime)
                    const depDate = formatDate(firstSeg.date)
                    const totalTime = calculateTotalTime(segs)
                    const flyingTime = calculateFlyingTime(segs)
                    const stopsLabel = getStopsLabel(segs)
                    const layovers = calculateLayovers(segs)
                    const cabin = firstSeg.cabinClass || firstSeg.cabin || ''

                    let priceDisplay = ''
                    let priceColor = 'var(--text)'
                    if (f.paymentType === 'cash' && f.cashAmount) {
                      priceDisplay = `$${f.cashAmount.toLocaleString()}`
                    } else if (f.paymentType === 'points' && f.pointsAmount) {
                      priceDisplay = `${f.pointsAmount.toLocaleString()} pts`
                      priceColor = 'var(--primary)'
                    }

                    return (
                      <div key={f.id} style={{
                        backgroundColor: 'var(--bg)', borderRadius: 'var(--radius)',
                        border: '1px solid var(--border-light)', padding: '14px 16px',
                        marginBottom: 8,
                      }}>
                        {/* Top row: airline + price */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                              {airline} {flightNum}
                            </div>
                            {depDate && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{depDate}</div>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: priceColor }}>{priceDisplay}</div>
                            {f.paymentType === 'points' && f.feesAmount ? (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>+ ${f.feesAmount} fees</div>
                            ) : null}
                          </div>
                        </div>

                        {/* Time row */}
                        {(depTime || arrTime) && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
                            padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{depTime || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{firstSeg.departureAirport}</div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{totalTime}</div>
                              <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '0 8px', position: 'relative' }}>
                                <div style={{
                                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                  fontSize: 10, color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', padding: '0 4px',
                                }}>
                                  &#9992;
                                </div>
                              </div>
                              <div style={{
                                fontSize: 11, marginTop: 2, fontWeight: 500,
                                color: stopsLabel === 'Nonstop' ? 'var(--success)' : 'var(--text-muted)',
                              }}>{stopsLabel}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{arrTime || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lastSeg.arrivalAirport}</div>
                            </div>
                          </div>
                        )}

                        {/* Detail chips */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
                          {totalTime && (
                            <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                              Total: {totalTime}
                            </span>
                          )}
                          {flyingTime && flyingTime !== totalTime && (
                            <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                              Flying: {flyingTime}
                            </span>
                          )}
                          {cabin && (
                            <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 500 }}>
                              {cabin}
                            </span>
                          )}
                          {layovers.length > 0 && layovers.map((l, li) => (
                            <span key={li} style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
                              {l.duration} in {l.airport}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}

          {/* Booking Steps */}
          <div style={{
            marginTop: 20, padding: 16,
            backgroundColor: 'var(--bg)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
              How to Book
            </div>

            {!hasWallet && hasPointsFlights && (
              <div style={{
                padding: '10px 14px', backgroundColor: 'var(--warning-bg)',
                borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A',
                fontSize: 13, color: 'var(--warning)', marginBottom: 12,
              }}>
                You haven&apos;t added any points balances yet. Go to <strong>Wallet</strong> to add your balances so we can tell you exactly how to book.
              </div>
            )}

            {hasWallet && hasShortfall && (
              <div style={{
                padding: '10px 14px', backgroundColor: 'var(--danger-bg)',
                borderRadius: 'var(--radius-sm)', border: '1px solid #FECACA',
                fontSize: 13, color: 'var(--danger)', marginBottom: 12,
              }}>
                You don&apos;t have enough points to cover all flights. Consider switching some bookings to cash or adding more points balances.
              </div>
            )}

            {steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 8,
                padding: '10px 12px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: step.type === 'shortfall' ? '1px solid #FECACA' : '1px solid var(--border-light)',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, marginTop: 1,
                  backgroundColor: step.type === 'shortfall' ? 'var(--danger-bg)'
                    : step.type === 'cash' ? 'var(--success-bg)'
                    : 'var(--primary-light)',
                  color: step.type === 'shortfall' ? 'var(--danger)'
                    : step.type === 'cash' ? 'var(--success)'
                    : 'var(--primary)',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{step.flightLabel}</div>
                  <div style={{ fontSize: 13, color: step.type === 'shortfall' ? 'var(--danger)' : 'var(--text)' }}>
                    {step.message}
                  </div>
                  {step.type === 'transfer' && step.walletBalance !== undefined && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                      Remaining: {(step.walletBalance - (step.bankPointsNeeded || 0)).toLocaleString()} {step.walletProgram}
                    </div>
                  )}
                  {step.type === 'direct_miles' && step.walletBalance !== undefined && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                      Remaining: {(step.walletBalance - step.pointsNeeded).toLocaleString()} {step.walletProgram}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {steps.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No flights in this plan.</div>
            )}
          </div>

          {/* Per-person breakdown */}
          {travelers > 1 && (
            <div style={{
              marginTop: 12, padding: '14px 16px',
              backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              display: 'flex', gap: 20, flexWrap: 'wrap',
            }}>
              <div style={{ fontWeight: 600 }}>Total for {travelers} travelers:</div>
              {totals.cash > 0 && <div>${(totals.cash * travelers).toLocaleString()} <span style={{ color: 'var(--text-muted)' }}>(${totals.cash.toLocaleString()} pp)</span></div>}
              {totals.points > 0 && <div style={{ color: 'var(--primary)' }}>{(totals.points * travelers).toLocaleString()} pts <span style={{ color: 'var(--text-muted)' }}>({totals.points.toLocaleString()} pp)</span></div>}
              {totals.fees > 0 && <div style={{ color: 'var(--text-muted)' }}>+ ${(totals.fees * travelers).toLocaleString()} fees</div>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onPrint() }}
              style={actionBtn}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              Print
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEmail() }}
              style={actionBtn}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              Email
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true) }}
              style={actionBtn}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              Rename
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              style={{ ...actionBtn, color: 'var(--text-muted)' }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)' }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
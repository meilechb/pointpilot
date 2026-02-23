'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AddFlight from '@/components/AddFlight'
import TripPlanner from '@/components/TripPlanner'
import FlightCard from '@/components/FlightCard'
import { getCityName } from '@/utils/airportUtils'
import { analyzeItinerary } from '@/utils/bookingAnalyzer'
import SavePrompt from '@/components/SavePrompt'

export default function TripDetail() {
  const params = useParams()
  const [trip, setTrip] = useState<any>(null)
  const [showAddFlight, setShowAddFlight] = useState(false)
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'flights' | 'plan' | 'itineraries'>('flights')
  const [savePromptTrigger, setSavePromptTrigger] = useState<'flight' | 'plan' | null>(null)

  useEffect(() => {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]')
    const found = trips.find((t: any) => t.id === params.id)
    if (found && !found.itineraries) found.itineraries = []
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

  if (!trip) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
      Trip not found
    </div>
  )

  const tabs = [
    { key: 'flights', label: 'Flights', count: trip.flights.length || null },
    { key: 'plan', label: 'Plan', count: null },
    { key: 'itineraries', label: 'Itineraries', count: trip.itineraries?.length || null },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-light)',
        padding: '20px 24px',
        marginBottom: 20,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{trip.tripName || 'Untitled Trip'}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span>{trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span>{trip.departureDate}{trip.returnDate ? ` → ${trip.returnDate}` : ''}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span>{trip.dateFlexibility === 'exact' ? 'Exact dates' : trip.dateFlexibility}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {trip.legs.map((leg: any, i: number) => (
            <span key={i} style={{
              padding: '4px 10px',
              backgroundColor: 'var(--bg-accent)',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--primary)',
            }}>
              {leg.from} → {leg.to}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-light)',
        padding: 4,
        marginBottom: 20,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === tab.key ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-inverse)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 600 : 500,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
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

              {showAddFlight ? (
                <AddFlight
                  legs={trip.legs}
                  onSave={handleSaveFlight}
                  onCancel={() => setShowAddFlight(false)}
                />
              ) : (
                !editingFlightId && (
                  <button
                    onClick={() => setShowAddFlight(true)}
                    style={{
                      width: '100%', padding: 14, marginTop: 4,
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
                )
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
            />
          )}
        </>
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
            trip.itineraries.map((itinerary: any) => (
              <ItineraryCard
                key={itinerary.id}
                itinerary={itinerary}
                trip={trip}
                onDelete={() => handleDeleteItinerary(itinerary.id)}
                onRename={(name: string) => handleRenameItinerary(itinerary.id, name)}
              />
            ))
          )}
        </>
      )}

      <SavePrompt trigger={savePromptTrigger} />
    </div>
  )
}

function ItineraryCard({ itinerary, trip, onDelete, onRename }: {
  itinerary: any
  trip: any
  onDelete: () => void
  onRename: (name: string) => void
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

  const wallet = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('wallet') || '[]' : '[]')
  const steps = expanded ? analyzeItinerary(itinerary.assignments, trip.flights, wallet, travelers) : []
  const hasShortfall = steps.some(s => s.type === 'shortfall')
  const hasWallet = wallet.length > 0
  const hasPointsFlights = steps.some(s => s.type !== 'cash')

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border-light)',
      marginBottom: 12,
      overflow: 'hidden',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 18px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
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
            <div style={{ fontWeight: 700, fontSize: 16 }}>{itinerary.name}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Saved {dateStr}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            {totals.cash > 0 && <div style={{ fontSize: 14, fontWeight: 700 }}>${(totals.cash * travelers).toLocaleString()}</div>}
            {totals.points > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{(totals.points * travelers).toLocaleString()} pts</div>}
            {totals.fees > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+ ${(totals.fees * travelers).toLocaleString()} fees</div>}
          </div>
          <span style={{
            fontSize: 12, color: 'var(--text-muted)',
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>▼</span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border-light)' }}>
          {/* Flights by leg */}
          {trip.legs.map((leg: any, i: number) => {
            const flightIds = itinerary.assignments?.[i] || []
            const flights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)

            return (
              <div key={i} style={{ marginTop: 16 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
                }}>
                  Leg {i + 1}: {getCityName(leg.from)} → {getCityName(leg.to)}
                </div>
                {flights.length === 0 ? (
                  <div style={{
                    fontSize: 13, color: 'var(--text-muted)', padding: '10px 12px',
                    backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--border)',
                  }}>
                    No flights assigned
                  </div>
                ) : (
                  flights.map((f: any) => (
                    <div key={f.id} style={{ marginBottom: 6 }}>
                      <FlightCard flight={f} compact />
                    </div>
                  ))
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
                ⚠ You haven't added any points balances yet. Go to <strong>My Points</strong> to add your balances so we can tell you exactly how to book.
              </div>
            )}

            {hasWallet && hasShortfall && (
              <div style={{
                padding: '10px 14px', backgroundColor: 'var(--danger-bg)',
                borderRadius: 'var(--radius-sm)', border: '1px solid #FECACA',
                fontSize: 13, color: 'var(--danger)', marginBottom: 12,
              }}>
                ⚠ You don't have enough points to cover all flights in this plan. Consider switching some bookings to cash or adding more points balances.
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
                  fontSize: 12, fontWeight: 700, marginTop: 1,
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
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{step.flightLabel}</div>
                  <div style={{ fontSize: 13, color: step.type === 'shortfall' ? 'var(--danger)' : 'var(--text)' }}>
                    {step.message}
                  </div>
                  {step.type === 'transfer' && step.walletBalance !== undefined && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      Remaining: {(step.walletBalance - (step.bankPointsNeeded || 0)).toLocaleString()} {step.walletProgram}
                    </div>
                  )}
                  {step.type === 'direct_miles' && step.walletBalance !== undefined && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
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
              marginTop: 12, padding: '12px 14px',
              backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Total for {travelers} travelers</div>
              {totals.cash > 0 && <div>💵 ${(totals.cash * travelers).toLocaleString()} (${totals.cash.toLocaleString()} pp)</div>}
              {totals.points > 0 && <div>⭐ {(totals.points * travelers).toLocaleString()} pts ({totals.points.toLocaleString()} pp)</div>}
              {totals.fees > 0 && <div style={{ color: 'var(--text-muted)' }}>+ ${(totals.fees * travelers).toLocaleString()} fees</div>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true) }}
              style={{
                padding: '6px 14px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                backgroundColor: 'var(--bg-card)', fontSize: 13, color: 'var(--text-secondary)',
                fontWeight: 500, transition: 'border-color 0.15s',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              style={{
                padding: '6px 14px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                backgroundColor: 'var(--bg-card)', fontSize: 13, color: 'var(--text-muted)',
                fontWeight: 500, transition: 'color 0.15s, border-color 0.15s',
              }}
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
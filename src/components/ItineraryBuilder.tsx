'use client'

import { useState } from 'react'
import { getCityName, formatTime, formatDuration } from '@/utils/airportUtils'

type Question = {
  id: string
  question: string
  type: 'text' | 'date' | 'select'
  options?: string[]
}

type LegAssignment = {
  legIndex: number
  flightIds: string[]
  totalDurationMinutes: number
  summary: string
}

type Suggestion = {
  name: string
  description: string
  tags: string[]
  legAssignments: LegAssignment[]
  totalCashCost: number
  totalPointsCost: number
  totalFeesCost: number
}

type Props = {
  trip: any
  session: any
  onSaveItinerary: (itinerary: any) => void
}

export default function ItineraryBuilder({ trip, session, onSaveItinerary }: Props) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)

  const hasFlights = trip.flights && trip.flights.length > 0

  const flightMap: Record<string, any> = {}
  if (trip.flights) {
    trip.flights.forEach((f: any) => { flightMap[f.id] = f })
  }

  const buildItineraries = async (extraAnswers?: Record<string, string>) => {
    setLoading(true)
    setError(null)
    setSuggestions([])
    setQuestions([])

    try {
      const res = await fetch('/api/build-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          trip: {
            tripType: trip.tripType,
            legs: trip.legs,
            departureDate: trip.departureDate,
            returnDate: trip.returnDate,
            travelers: trip.travelers || 1,
            dateFlexibility: trip.dateFlexibility || 'exact',
          },
          flights: trip.flights,
          answers: extraAnswers || (Object.keys(answers).length > 0 ? answers : undefined),
        }),
      })

      const data = await res.json()

      if (data.error === 'scan_limit') {
        setError(data.message || 'Free plan limit reached. Upgrade to Pro for unlimited AI features.')
        setHasRun(true)
        setLoading(false)
        return
      }

      if (data.error && !data.itineraries?.length) {
        setError(data.error)
        setHasRun(true)
        setLoading(false)
        return
      }

      if (data.questions && data.questions.length > 0 && (!data.itineraries || data.itineraries.length === 0)) {
        setQuestions(data.questions)
        setLoading(false)
        return
      }

      setSuggestions(data.itineraries || [])
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
      }
      setHasRun(true)
    } catch (err: any) {
      setError('Failed to connect to AI service')
      setHasRun(true)
    }
    setLoading(false)
  }

  const handleAnswerSubmit = () => {
    buildItineraries(answers)
  }

  const handleSave = (suggestion: Suggestion) => {
    const assignments: Record<string, string[]> = {}
    let totalCash = 0
    let totalPoints = 0
    let totalFees = 0

    suggestion.legAssignments.forEach(la => {
      assignments[String(la.legIndex)] = la.flightIds

      // Calculate actual totals from flight data
      la.flightIds.forEach(fid => {
        const f = flightMap[fid]
        if (!f) return
        if (f.paymentType === 'cash' && f.cashAmount) totalCash += f.cashAmount
        if (f.paymentType === 'points' && f.pointsAmount) totalPoints += f.pointsAmount
        if (f.feesAmount) totalFees += f.feesAmount
      })
    })

    // Also update flight legIndex values
    const updatedFlights = trip.flights.map((f: any) => {
      for (const la of suggestion.legAssignments) {
        if (la.flightIds.includes(f.id)) {
          return { ...f, legIndex: la.legIndex }
        }
      }
      return f
    })

    onSaveItinerary({
      itinerary: {
        id: crypto.randomUUID(),
        name: suggestion.name,
        createdAt: new Date().toISOString(),
        assignments,
        totals: { cash: totalCash, points: totalPoints, fees: totalFees },
        travelers: trip.travelers || 1,
      },
      updatedFlights,
    })
  }

  if (!hasFlights) {
    return (
      <div style={{
        textAlign: 'center', padding: 48,
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px dashed var(--border)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>&#9992;&#65039;</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>Add flights first</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Capture flights from booking sites or add them manually, then come back to build smart itineraries.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Build button */}
      <button
        onClick={() => buildItineraries()}
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
          <>Analyzing {trip.flights.length} flights...</>
        ) : hasRun ? (
          <>Rebuild Itineraries</>
        ) : (
          <>Build Smart Itineraries</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px', backgroundColor: '#FEF2F2',
          borderRadius: 'var(--radius-sm)', border: '1px solid #FECACA',
          fontSize: 13, color: '#991B1B', marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Clarifying questions */}
      {questions.length > 0 && suggestions.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          padding: 20, marginBottom: 16,
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            Need a bit more info
          </div>
          {questions.map(q => (
            <div key={q.id} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                {q.question}
              </label>
              {q.type === 'select' && q.options ? (
                <select
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 14,
                    border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)', color: 'var(--text)',
                  }}
                >
                  <option value="">Select...</option>
                  {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={q.type === 'date' ? 'date' : 'text'}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 14,
                    border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)', color: 'var(--text)',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          ))}
          <button
            onClick={handleAnswerSubmit}
            disabled={questions.some(q => !answers[q.id])}
            style={{
              width: '100%', padding: 12,
              background: questions.every(q => answers[q.id]) ? 'var(--primary)' : 'var(--border)',
              color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: questions.every(q => answers[q.id]) ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Itinerary suggestion cards */}
      {suggestions.map((suggestion, idx) => (
        <SuggestionCard
          key={idx}
          suggestion={suggestion}
          trip={trip}
          flightMap={flightMap}
          isFirst={idx === 0}
          onSave={() => handleSave(suggestion)}
        />
      ))}

      {hasRun && suggestions.length === 0 && !error && questions.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 32,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            No itineraries could be built. Make sure your flights match the trip legs.
          </p>
        </div>
      )}
    </div>
  )
}

function SuggestionCard({ suggestion, trip, flightMap, isFirst, onSave }: {
  suggestion: Suggestion
  trip: any
  flightMap: Record<string, any>
  isFirst: boolean
  onSave: () => void
}) {
  const [expanded, setExpanded] = useState(isFirst)
  const travelers = trip.travelers || 1

  // Compute total duration across all legs
  const totalTravelMin = suggestion.legAssignments.reduce((s, la) => s + (la.totalDurationMinutes || 0), 0)

  // Compute actual prices from flight data
  let actualCash = 0
  let actualPoints = 0
  let actualFees = 0
  suggestion.legAssignments.forEach(la => {
    la.flightIds.forEach(fid => {
      const f = flightMap[fid]
      if (!f) return
      if (f.paymentType === 'cash' && f.cashAmount) actualCash += f.cashAmount
      if (f.paymentType === 'points' && f.pointsAmount) actualPoints += f.pointsAmount
      if (f.feesAmount) actualFees += f.feesAmount
    })
  })

  // Fall back to AI-computed if no actual data
  const cashCost = actualCash || suggestion.totalCashCost || 0
  const pointsCost = actualPoints || suggestion.totalPointsCost || 0
  const feesCost = actualFees || suggestion.totalFeesCost || 0

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      border: isFirst ? '2px solid var(--primary)' : '1px solid var(--border-light)',
      marginBottom: 14,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '16px 20px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{suggestion.name}</span>
              {suggestion.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 12, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 10,
                  backgroundColor: tag === 'Recommended' ? 'var(--primary-light)' : 'var(--bg-accent)',
                  color: tag === 'Recommended' ? 'var(--primary)' : 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {suggestion.description}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {cashCost > 0 && (
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                ${(cashCost * travelers).toLocaleString()}
              </div>
            )}
            {pointsCost > 0 && (
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                {(pointsCost * travelers).toLocaleString()} pts
              </div>
            )}
            {totalTravelMin > 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {formatDuration(totalTravelMin)} total
              </div>
            )}
            <span style={{
              fontSize: 12, color: 'var(--text-muted)',
              display: 'inline-block',
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>&#9660;</span>
          </div>
        </div>
      </div>

      {/* Expanded: leg-by-leg flight details */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-light)' }}>
          {suggestion.legAssignments.map((la) => {
            const leg = trip.legs[la.legIndex]
            if (!leg) return null
            const flights = la.flightIds.map(id => flightMap[id]).filter(Boolean)

            return (
              <div key={la.legIndex} style={{ marginTop: 18 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                      fontSize: 11, fontWeight: 700,
                    }}>{la.legIndex + 1}</span>
                    {getCityName(leg.from)} ({leg.from}) &rarr; {getCityName(leg.to)} ({leg.to})
                  </div>
                  {la.totalDurationMinutes > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {formatDuration(la.totalDurationMinutes)}
                    </span>
                  )}
                </div>

                {flights.length === 0 ? (
                  <div style={{
                    fontSize: 13, color: '#991B1B', padding: '12px 14px',
                    backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-sm)',
                    border: '1px solid #FECACA',
                  }}>
                    No matching flight found for this leg
                  </div>
                ) : (
                  flights.map((f: any) => (
                    <FlightRow key={f.id} flight={f} />
                  ))
                )}
              </div>
            )
          })}

          {/* Trip total */}
          <div style={{
            marginTop: 18, padding: '14px 16px',
            backgroundColor: 'var(--bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
              Trip Total{travelers > 1 ? ` (${travelers} travelers)` : ''}
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14 }}>
              {cashCost > 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Cash: </span>
                  <strong>${(cashCost * travelers).toLocaleString()}</strong>
                  {travelers > 1 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> (${cashCost.toLocaleString()} pp)</span>}
                </div>
              )}
              {pointsCost > 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Points: </span>
                  <strong style={{ color: 'var(--primary)' }}>{(pointsCost * travelers).toLocaleString()}</strong>
                  {travelers > 1 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> ({pointsCost.toLocaleString()} pp)</span>}
                </div>
              )}
              {feesCost > 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Fees: </span>
                  <strong>${(feesCost * travelers).toLocaleString()}</strong>
                </div>
              )}
              {totalTravelMin > 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Travel time: </span>
                  <strong>{formatDuration(totalTravelMin)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={onSave}
            style={{
              marginTop: 14, padding: '12px 20px', width: '100%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'var(--text-inverse)', border: 'none',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(67, 56, 202, 0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Save as Itinerary
          </button>
        </div>
      )}
    </div>
  )
}

function FlightRow({ flight }: { flight: any }) {
  const segs = flight.segments || []
  if (segs.length === 0) return null

  const firstSeg = segs[0]
  const lastSeg = segs[segs.length - 1]
  const airline = firstSeg.airlineName || ''
  const flightCode = segs.map((s: any) => s.flightCode).filter(Boolean).join(' + ')
  const depTime = formatTime(firstSeg.departureTime)
  const arrTime = formatTime(lastSeg.arrivalTime)
  const depAirport = firstSeg.departureAirport || ''
  const arrAirport = lastSeg.arrivalAirport || ''
  const depDate = firstSeg.date || ''
  const arrDate = lastSeg.arrivalDate || lastSeg.date || ''
  const isNextDay = arrDate && depDate && arrDate !== depDate

  // Duration
  let totalMin = 0
  segs.forEach((s: any) => { if (s.duration) totalMin += s.duration })
  // Add layover time for multi-segment
  for (let i = 0; i < segs.length - 1; i++) {
    const s1 = segs[i]
    const s2 = segs[i + 1]
    const ad = s1.arrivalDate || s1.date
    const dd = s2.date
    if (s1.arrivalTime && s2.departureTime && ad && dd) {
      const a = new Date(`${ad}T${s1.arrivalTime}`)
      const d = new Date(`${dd}T${s2.departureTime}`)
      let diff = (d.getTime() - a.getTime()) / 60000
      if (diff < 0) diff += 24 * 60
      totalMin += diff
    }
  }

  const stops = segs.length - 1
  const stopsLabel = stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`

  let priceStr = ''
  let priceColor = 'var(--text)'
  if (flight.paymentType === 'cash' && flight.cashAmount) {
    priceStr = `$${flight.cashAmount.toLocaleString()}`
  } else if (flight.paymentType === 'points' && flight.pointsAmount) {
    priceStr = `${flight.pointsAmount.toLocaleString()} pts`
    priceColor = 'var(--primary)'
  }
  if (flight.feesAmount && flight.paymentType === 'points') {
    priceStr += ` + $${flight.feesAmount.toLocaleString()} fees`
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border-light)', padding: '12px 14px',
      marginBottom: 6,
    }}>
      {/* Top: airline + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
          {airline}{flightCode ? ` ${flightCode}` : ''}
        </div>
        {priceStr && (
          <div style={{ fontWeight: 700, fontSize: 14, color: priceColor }}>
            {priceStr}
          </div>
        )}
      </div>

      {/* Middle: timeline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'center', minWidth: 50 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{depTime}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{depAirport}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
            {totalMin > 0 ? formatDuration(Math.round(totalMin)) : ''}
          </div>
          <div style={{
            width: '100%', height: 2, backgroundColor: 'var(--border)',
            position: 'relative',
          }}>
            {stops > 0 && Array.from({ length: stops }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${((i + 1) / (stops + 1)) * 100}%`,
                top: -3, width: 8, height: 8,
                borderRadius: '50%', backgroundColor: 'var(--text-muted)',
                transform: 'translateX(-50%)',
              }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {stopsLabel}
            {stops > 0 && segs.length > 1 && (
              <span> via {segs.slice(0, -1).map((s: any) => s.arrivalAirport).join(', ')}</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: 50 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {arrTime}{isNextDay ? <sup style={{ fontSize: 10, color: 'var(--text-muted)' }}>+1</sup> : ''}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{arrAirport}</div>
        </div>
      </div>

      {/* Bottom: booking site */}
      {flight.bookingSite && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          via {flight.bookingSite}
        </div>
      )}
    </div>
  )
}

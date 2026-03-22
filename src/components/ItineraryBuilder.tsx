'use client'

import { useState, useEffect } from 'react'
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
  cachedSuggestions?: Suggestion[]
  onSuggestionsChange?: (suggestions: Suggestion[]) => void
}

function getCardAccent(suggestion: Suggestion, idx: number): string {
  const nameLower = suggestion.name.toLowerCase()
  const tagsLower = suggestion.tags.map(t => t.toLowerCase())
  if (nameLower.includes('cheapest') || nameLower.includes('budget') || tagsLower.includes('cheapest'))
    return '#059669'
  if (nameLower.includes('fastest') || nameLower.includes('quickest') || tagsLower.includes('fastest'))
    return '#2563EB'
  if (nameLower.includes('best') || nameLower.includes('optimal') || tagsLower.includes('recommended'))
    return '#7C3AED'
  const colors = ['#7C3AED', '#059669', '#2563EB']
  return colors[idx % colors.length]
}

const LOADING_MESSAGES = [
  'Finding the best deals...',
  'Comparing flight combinations...',
  'Crunching the numbers...',
  'Optimizing your itinerary...',
  'Almost there...',
]

export default function ItineraryBuilder({ trip, session, onSaveItinerary, cachedSuggestions, onSuggestionsChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>(cachedSuggestions || [])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState((cachedSuggestions || []).length > 0)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])

  const hasFlights = trip.flights && trip.flights.length > 0

  // Sync from parent cache
  useEffect(() => {
    if (cachedSuggestions && cachedSuggestions.length > 0 && suggestions.length === 0) {
      setSuggestions(cachedSuggestions)
      setHasRun(true)
    }
  }, [cachedSuggestions])

  // Cycle loading messages
  useEffect(() => {
    if (!loading) return
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[i])
    }, 2500)
    return () => clearInterval(interval)
  }, [loading])

  const flightMap: Record<string, any> = {}
  if (trip.flights) {
    trip.flights.forEach((f: any) => { flightMap[f.id] = f })
  }

  const updateSuggestions = (newSuggestions: Suggestion[]) => {
    setSuggestions(newSuggestions)
    onSuggestionsChange?.(newSuggestions)
  }

  const buildItineraries = async (extraAnswers?: Record<string, string>) => {
    setLoading(true)
    setError(null)
    updateSuggestions([])
    setQuestions([])
    setExpandedIndex(null)
    setLoadingMsg(LOADING_MESSAGES[0])

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

      updateSuggestions(data.itineraries || [])
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

      la.flightIds.forEach(fid => {
        const f = flightMap[fid]
        if (!f) return
        if (f.paymentType === 'cash' && f.cashAmount) totalCash += f.cashAmount
        if (f.paymentType === 'points' && f.pointsAmount) totalPoints += f.pointsAmount
        if (f.feesAmount) totalFees += f.feesAmount
      })
    })

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
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>&#9992;&#65039;</div>
        <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Add flights first</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Capture flights from booking sites or add them manually, then come back to build smart itineraries.
        </p>
      </div>
    )
  }

  const gridClass = `builder-suggestions-grid${suggestions.length === 2 ? ' count-2' : suggestions.length === 1 ? ' count-1' : ''}`

  return (
    <div>
      {/* Compact build button */}
      <button
        onClick={() => buildItineraries()}
        disabled={loading}
        style={{
          width: '100%', padding: '12px 16px',
          background: loading ? 'var(--border)' : 'linear-gradient(135deg, #7C3AED, #4338CA)',
          color: 'white',
          border: 'none', borderRadius: 'var(--radius)',
          cursor: loading ? 'default' : 'pointer',
          fontSize: 15, fontWeight: 700,
          boxShadow: loading ? 'none' : '0 3px 10px rgba(67, 56, 202, 0.3)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseOver={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 16px rgba(67, 56, 202, 0.4)' } }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 3px 10px rgba(67, 56, 202, 0.3)' }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }}>&#9733;</span>
            {loadingMsg}
          </span>
        ) : hasRun ? (
          <>&#10227; Rebuild Itineraries</>
        ) : (
          <>&#10024; Build Smart Itineraries</>
        )}
      </button>

      {/* Loading animation */}
      {loading && (
        <div style={{
          marginTop: 14, padding: '24px 20px', textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{loadingMsg}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Analyzing {trip.flights.length} flights for {trip.legs.length} leg{trip.legs.length !== 1 ? 's' : ''}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px', backgroundColor: '#FEF2F2',
          borderRadius: 'var(--radius-sm)', border: '1px solid #FECACA',
          fontSize: 13, color: '#991B1B', marginTop: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>&#9888;</span>
          <span>{error}</span>
        </div>
      )}

      {/* Clarifying questions */}
      {questions.length > 0 && suggestions.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          padding: 20, marginTop: 14,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>&#128172;</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Quick question</span>
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
              background: questions.every(q => answers[q.id]) ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'var(--border)',
              color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: questions.every(q => answers[q.id]) ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Continue &#8594;
          </button>
        </div>
      )}

      {/* Suggestion cards — grid or expanded */}
      {suggestions.length > 0 && (
        expandedIndex !== null ? (
          <div style={{ marginTop: 14 }}>
            {/* Pill nav ON TOP so it's always visible */}
            {suggestions.length > 1 && (
              <div style={{
                display: 'flex', gap: 6, marginBottom: 14, justifyContent: 'center', flexWrap: 'wrap',
                position: 'sticky', top: 72, zIndex: 10,
                backgroundColor: 'var(--bg)', padding: '8px 0', borderRadius: 'var(--radius)',
              }}>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setExpandedIndex(idx)}
                    style={{
                      padding: '7px 16px',
                      fontSize: 13, fontWeight: idx === expandedIndex ? 700 : 500,
                      border: idx === expandedIndex ? '2px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: 20,
                      backgroundColor: idx === expandedIndex ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: idx === expandedIndex ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.name}
                  </button>
                ))}
                <button
                  onClick={() => setExpandedIndex(null)}
                  style={{
                    padding: '7px 16px',
                    fontSize: 13, fontWeight: 500,
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  &#9776; All
                </button>
              </div>
            )}
            <ExpandedSuggestionCard
              suggestion={suggestions[expandedIndex]}
              idx={expandedIndex}
              trip={trip}
              flightMap={flightMap}
              onSave={() => handleSave(suggestions[expandedIndex])}
              onCollapse={() => setExpandedIndex(null)}
            />
          </div>
        ) : (
          <div className={gridClass}>
            {suggestions.map((suggestion, idx) => (
              <CompactSuggestionCard
                key={idx}
                suggestion={suggestion}
                idx={idx}
                trip={trip}
                flightMap={flightMap}
                onClick={() => setExpandedIndex(idx)}
              />
            ))}
          </div>
        )
      )}

      {hasRun && suggestions.length === 0 && !error && questions.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 24, marginTop: 14,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
        }}>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            No itineraries could be built
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Make sure your flights match the trip legs.
          </p>
        </div>
      )}
    </div>
  )
}

/** Compact card for the grid view */
function CompactSuggestionCard({ suggestion, idx, trip, flightMap, onClick }: {
  suggestion: Suggestion
  idx: number
  trip: any
  flightMap: Record<string, any>
  onClick: () => void
}) {
  const travelers = trip.travelers || 1
  const accent = getCardAccent(suggestion, idx)

  let actualCash = 0, actualPoints = 0
  suggestion.legAssignments.forEach(la => {
    la.flightIds.forEach(fid => {
      const f = flightMap[fid]
      if (!f) return
      if (f.paymentType === 'cash' && f.cashAmount) actualCash += f.cashAmount
      if (f.paymentType === 'points' && f.pointsAmount) actualPoints += f.pointsAmount
    })
  })
  const cashCost = actualCash || suggestion.totalCashCost || 0
  const pointsCost = actualPoints || suggestion.totalPointsCost || 0

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-light)',
        borderLeft: `4px solid ${accent}`,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      {/* Name + tags */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{suggestion.name}</span>
          {suggestion.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 10,
              backgroundColor: tag === 'Recommended' ? 'var(--primary-light)' : 'var(--bg-accent)',
              color: tag === 'Recommended' ? 'var(--primary)' : 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {suggestion.description}
        </div>
      </div>

      {/* Price */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
        {cashCost > 0 && (
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
            ${(cashCost * travelers).toLocaleString()}
          </div>
        )}
        {pointsCost > 0 && (
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: -0.5 }}>
            {(pointsCost * travelers).toLocaleString()} pts
          </div>
        )}
        {travelers > 1 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            for {travelers} travelers
          </div>
        )}
      </div>

      {/* Per-leg routes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {suggestion.legAssignments.map(la => {
          const leg = trip.legs[la.legIndex]
          if (!leg) return null
          return (
            <div key={la.legIndex} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 10px',
              backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)',
              fontSize: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: accent + '18', color: accent,
                  fontSize: 9, fontWeight: 700,
                }}>{la.legIndex + 1}</span>
                <span style={{ fontWeight: 600 }}>{leg.from}</span>
                <span style={{ color: 'var(--text-muted)' }}>&#8594;</span>
                <span style={{ fontWeight: 600 }}>{leg.to}</span>
              </div>
              {la.totalDurationMinutes > 0 && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                  {formatDuration(la.totalDurationMinutes)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div style={{
        fontSize: 12, fontWeight: 600, color: accent,
        marginTop: 'auto',
      }}>
        View Details &#8594;
      </div>
    </div>
  )
}

/** Full-width expanded card with leg-by-leg detail */
function ExpandedSuggestionCard({ suggestion, idx, trip, flightMap, onSave, onCollapse }: {
  suggestion: Suggestion
  idx: number
  trip: any
  flightMap: Record<string, any>
  onSave: () => void
  onCollapse: () => void
}) {
  const travelers = trip.travelers || 1
  const accent = getCardAccent(suggestion, idx)

  let actualCash = 0, actualPoints = 0, actualFees = 0
  suggestion.legAssignments.forEach(la => {
    la.flightIds.forEach(fid => {
      const f = flightMap[fid]
      if (!f) return
      if (f.paymentType === 'cash' && f.cashAmount) actualCash += f.cashAmount
      if (f.paymentType === 'points' && f.pointsAmount) actualPoints += f.pointsAmount
      if (f.feesAmount) actualFees += f.feesAmount
    })
  })
  const cashCost = actualCash || suggestion.totalCashCost || 0
  const pointsCost = actualPoints || suggestion.totalPointsCost || 0
  const feesCost = actualFees || suggestion.totalFeesCost || 0

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border-light)',
      borderTop: `4px solid ${accent}`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 18 }}>{suggestion.name}</span>
            {suggestion.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                borderRadius: 10,
                backgroundColor: tag === 'Recommended' ? 'var(--primary-light)' : 'var(--bg-accent)',
                color: tag === 'Recommended' ? 'var(--primary)' : 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {tag}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {suggestion.description}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
          {cashCost > 0 && (
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
              ${(cashCost * travelers).toLocaleString()}
            </div>
          )}
          {pointsCost > 0 && (
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', letterSpacing: -0.5 }}>
              {(pointsCost * travelers).toLocaleString()} pts
            </div>
          )}
          {travelers > 1 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              for {travelers} travelers
            </div>
          )}
        </div>
      </div>

      {/* Leg-by-leg details */}
      <div style={{ padding: '4px 24px 24px' }}>
        {suggestion.legAssignments.map((la, laIdx) => {
          const leg = trip.legs[la.legIndex]
          if (!leg) return null
          const flights = la.flightIds.map(id => flightMap[id]).filter(Boolean)

          return (
            <div key={la.legIndex} style={{ marginTop: 18 }}>
              {/* Leg header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: '1px solid var(--border-light)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 26, height: 26, borderRadius: '50%',
                    backgroundColor: accent + '18', color: accent,
                    fontSize: 12, fontWeight: 800,
                  }}>{la.legIndex + 1}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {getCityName(leg.from)} &#8594; {getCityName(leg.to)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {leg.from} &#8594; {leg.to}
                    </div>
                  </div>
                </div>
                {la.totalDurationMinutes > 0 && (
                  <div style={{
                    padding: '4px 10px',
                    backgroundColor: 'var(--bg)',
                    borderRadius: 16,
                    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                  }}>
                    {formatDuration(la.totalDurationMinutes)}
                  </div>
                )}
              </div>

              {flights.length === 0 ? (
                <div style={{
                  fontSize: 13, color: '#991B1B', padding: '12px 14px',
                  backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-sm)',
                  border: '1px solid #FECACA',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>&#9888;</span> No matching flight found for this leg
                </div>
              ) : (
                flights.map((f: any) => (
                  <FlightRow key={f.id} flight={f} />
                ))
              )}

              {laIdx < suggestion.legAssignments.length - 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 16,
                }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-light)' }} />
                  <span style={{ padding: '0 10px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                    NEXT LEG
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-light)' }} />
                </div>
              )}
            </div>
          )
        })}

        {/* Trip total */}
        <div style={{
          marginTop: 20, padding: '14px 18px',
          backgroundColor: 'var(--bg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            Trip Total{travelers > 1 ? ` (${travelers} travelers)` : ''}
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
            {cashCost > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 1 }}>Cash</span>
                <strong style={{ fontSize: 16 }}>${(cashCost * travelers).toLocaleString()}</strong>
                {travelers > 1 && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> (${cashCost.toLocaleString()} pp)</span>}
              </div>
            )}
            {pointsCost > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 1 }}>Points</span>
                <strong style={{ color: 'var(--primary)', fontSize: 16 }}>{(pointsCost * travelers).toLocaleString()}</strong>
                {travelers > 1 && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> ({pointsCost.toLocaleString()} pp)</span>}
              </div>
            )}
            {feesCost > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 1 }}>Fees</span>
                <strong style={{ fontSize: 16 }}>${(feesCost * travelers).toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={onSave}
          style={{
            marginTop: 14, padding: '13px 18px', width: '100%',
            background: 'linear-gradient(135deg, #059669, #10B981)',
            color: 'white', border: 'none',
            borderRadius: 'var(--radius)', cursor: 'pointer',
            fontSize: 15, fontWeight: 700,
            boxShadow: '0 3px 10px rgba(5, 150, 105, 0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 16px rgba(5, 150, 105, 0.4)' }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(5, 150, 105, 0.3)' }}
        >
          &#10003; Save as Itinerary
        </button>
      </div>
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

  let totalMin = 0
  segs.forEach((s: any) => { if (s.duration) totalMin += s.duration })
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
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
            {airline}{flightCode ? ` ${flightCode}` : ''}
          </div>
          {depDate && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {new Date(depDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
        {priceStr && (
          <div style={{ fontWeight: 700, fontSize: 15, color: priceColor }}>
            {priceStr}
          </div>
        )}
      </div>

      {/* Middle: timeline */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 12px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <div style={{ textAlign: 'center', minWidth: 48 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{depTime}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{depAirport}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, fontWeight: 500 }}>
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
          <div style={{ fontSize: 10, color: stops === 0 ? 'var(--success)' : 'var(--text-muted)', marginTop: 2, fontWeight: stops === 0 ? 600 : 400 }}>
            {stopsLabel}
            {stops > 0 && segs.length > 1 && (
              <span> via {segs.slice(0, -1).map((s: any) => s.arrivalAirport).join(', ')}</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: 48 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {arrTime}{isNextDay ? <sup style={{ fontSize: 10, color: 'var(--text-muted)' }}>+1</sup> : ''}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{arrAirport}</div>
        </div>
      </div>

      {/* Bottom: booking site */}
      {flight.bookingSite && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          Book via {flight.bookingSite}
        </div>
      )}
    </div>
  )
}

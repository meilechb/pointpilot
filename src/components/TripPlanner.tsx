'use client'

import { useState, useEffect } from 'react'

const CITY_AIRPORTS: Record<string, string[]> = {
  NYC: ['JFK', 'EWR', 'LGA', 'SWF', 'ISP', 'HPN'],
  LON: ['LHR', 'LGW', 'STN', 'LTN', 'LCY'],
  PAR: ['CDG', 'ORY'],
  TYO: ['NRT', 'HND'],
  CHI: ['ORD', 'MDW'],
  LAX: ['LAX', 'BUR', 'SNA', 'LGB', 'ONT'],
  SFO: ['SFO', 'OAK', 'SJC'],
  WAS: ['DCA', 'IAD', 'BWI'],
  MIA: ['MIA', 'FLL', 'PBI'],
  DFW: ['DFW', 'DAL'],
  HOU: ['IAH', 'HOU'],
  ROM: ['FCO', 'CIA'],
  MIL: ['MXP', 'LIN'],
  BER: ['BER', 'TXL', 'SXF'],
  BJS: ['PEK', 'PKX'],
  SHA: ['PVG', 'SHA'],
  SEL: ['ICN', 'GMP'],
  RIO: ['GIG', 'SDU'],
  SAO: ['GRU', 'CGH', 'VCP'],
  MOW: ['SVO', 'DME', 'VKO'],
  BKK: ['BKK', 'DMK'],
  IST: ['IST', 'SAW'],
  OSA: ['KIX', 'ITM'],
  YTO: ['YYZ', 'YTZ'],
  YMQ: ['YUL', 'YMX'],
  MEL: ['MEL', 'AVV'],
  TLV: ['TLV'],
}

const AIRPORT_TO_CITY: Record<string, string> = {}
Object.entries(CITY_AIRPORTS).forEach(([city, airports]) => {
  airports.forEach(a => { AIRPORT_TO_CITY[a] = city })
})

function airportsMatch(code1: string, code2: string): boolean {
  if (code1 === code2) return true
  const city1 = AIRPORT_TO_CITY[code1] || code1
  const city2 = AIRPORT_TO_CITY[code2] || code2
  if (city1 === city2) return true
  if (CITY_AIRPORTS[code1]?.includes(code2)) return true
  if (CITY_AIRPORTS[code2]?.includes(code1)) return true
  return false
}

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

type Flight = {
  id: string
  legIndex: number
  segments: Segment[]
  bookingSite: string
  paymentType: string
  cashAmount: number | null
  pointsAmount: number | null
  feesAmount: number | null
}

type Leg = { from: string; to: string }
type LegAssignment = { [legIndex: number]: string[] }
type Warning = {
  type: 'route_gap' | 'short_layover' | 'incomplete' | 'wrong_origin' | 'wrong_destination'
  message: string
}

type Props = {
  legs: Leg[]
  flights: Flight[]
  travelers: number
  onSave: (assignments: LegAssignment) => void
}

function getFlightSummary(flight: Flight): string {
  return flight.segments.map(s => s.flightCode || s.airlineName).filter(Boolean).join(' + ') || 'Unknown'
}

function getFlightRoute(flight: Flight): { from: string; to: string } {
  return {
    from: flight.segments[0]?.departureAirport || '???',
    to: flight.segments[flight.segments.length - 1]?.arrivalAirport || '???',
  }
}

function getFlightPrice(flight: Flight): { cash: number; points: number; fees: number } {
  return {
    cash: flight.paymentType === 'cash' ? (flight.cashAmount || 0) : 0,
    points: flight.paymentType === 'points' ? (flight.pointsAmount || 0) : 0,
    fees: flight.paymentType === 'points' ? (flight.feesAmount || 0) : 0,
  }
}

function getFlightPriceLabel(flight: Flight): string {
  if (flight.paymentType === 'cash' && flight.cashAmount) return `$${flight.cashAmount}`
  if (flight.paymentType === 'points' && flight.pointsAmount) {
    return `${flight.pointsAmount.toLocaleString()} pts${flight.feesAmount ? ` + $${flight.feesAmount}` : ''}`
  }
  return ''
}

function canFlightGoInLeg(flight: Flight, leg: Leg): boolean {
  const route = getFlightRoute(flight)
  return airportsMatch(route.from, leg.from) || airportsMatch(route.to, leg.to)
}

function validateLeg(leg: Leg, flights: Flight[]): { complete: boolean; warnings: Warning[] } {
  const warnings: Warning[] = []
  if (flights.length === 0) {
    return { complete: false, warnings: [{ type: 'incomplete', message: 'No flights assigned' }] }
  }

  const firstRoute = getFlightRoute(flights[0])
  if (!airportsMatch(firstRoute.from, leg.from)) {
    warnings.push({ type: 'wrong_origin', message: `First flight departs from ${firstRoute.from}, but this leg starts at ${leg.from}` })
  }

  const lastRoute = getFlightRoute(flights[flights.length - 1])
  if (!airportsMatch(lastRoute.to, leg.to)) {
    warnings.push({ type: 'wrong_destination', message: `Last flight arrives at ${lastRoute.to}, but this leg ends at ${leg.to}` })
  }

  for (let i = 0; i < flights.length - 1; i++) {
    const currentTo = getFlightRoute(flights[i]).to
    const nextFrom = getFlightRoute(flights[i + 1]).from
   if (!airportsMatch(currentTo, nextFrom)) {
      warnings.push({ type: 'route_gap', message: `Flight ${i + 1} arrives at ${currentTo} but flight ${i + 2} departs from ${nextFrom}` })
      
    }

    const seg1 = flights[i].segments[flights[i].segments.length - 1]
    const seg2 = flights[i + 1].segments[0]
    if (seg1.arrivalTime && seg2.departureTime && seg1.date && seg2.date) {
      const arrive = new Date(`${seg1.date}T${seg1.arrivalTime}`)
      const depart = new Date(`${seg2.date}T${seg2.departureTime}`)
      const mins = (depart.getTime() - arrive.getTime()) / 60000
      if (mins > 0 && mins < 90) {
        warnings.push({ type: 'short_layover', message: `Only ${Math.round(mins)} min layover between flights ${i + 1} and ${i + 2}` })
      }
    }
  }

  const complete = warnings.filter(w => w.type !== 'short_layover').length === 0
  return { complete, warnings }
}

export default function TripPlanner({ legs, flights, travelers, onSave }: Props) {
  const [assignments, setAssignments] = useState<LegAssignment>(() => {
    const a: LegAssignment = {}
    legs.forEach((_, i) => { a[i] = [] })
    return a
  })
  const [draggedFlight, setDraggedFlight] = useState<string | null>(null)
  const [dragOverLeg, setDragOverLeg] = useState<number | null>(null)
  const [dropPosition, setDropPosition] = useState<{ leg: number; index: number } | null>(null)
  const [bounceMessage, setBounceMessage] = useState<string | null>(null)

  const flightMap: Record<string, Flight> = {}
  flights.forEach(f => { flightMap[f.id] = f })

  const assignedIds = new Set(Object.values(assignments).flat())
  const unassigned = flights.filter(f => !assignedIds.has(f.id))

  useEffect(() => {
    if (bounceMessage) {
      const t = setTimeout(() => setBounceMessage(null), 2500)
      return () => clearTimeout(t)
    }
  }, [bounceMessage])

  const handleDragStart = (flightId: string) => { setDraggedFlight(flightId) }

  const handleDragOverLeg = (e: React.DragEvent, legIndex: number) => {
    e.preventDefault()
    setDragOverLeg(legIndex)
  }

  const handleDragOverCard = (e: React.DragEvent, legIndex: number, cardIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const insertIndex = e.clientY < rect.top + rect.height / 2 ? cardIndex : cardIndex + 1
    setDropPosition({ leg: legIndex, index: insertIndex })
    setDragOverLeg(legIndex)
  }

  const handleDragOverUnassigned = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverLeg(-1)
  }

  const handleDropOnLeg = (legIndex: number) => {
    if (!draggedFlight) return
    const flight = flightMap[draggedFlight]
    if (!flight) return

    if (!canFlightGoInLeg(flight, legs[legIndex])) {
      const route = getFlightRoute(flight)
      setBounceMessage(`${route.from} → ${route.to} doesn't fit in Leg ${legIndex + 1}: ${legs[legIndex].from} → ${legs[legIndex].to}`)
      setDraggedFlight(null)
      setDragOverLeg(null)
      setDropPosition(null)
      return
    }

    const updated = { ...assignments }
    Object.keys(updated).forEach(key => {
      updated[Number(key)] = updated[Number(key)].filter(id => id !== draggedFlight)
    })
    const list = [...(updated[legIndex] || [])]
    if (dropPosition && dropPosition.leg === legIndex) {
      list.splice(dropPosition.index, 0, draggedFlight)
    } else {
      list.push(draggedFlight)
    }
    updated[legIndex] = list
    setAssignments(updated)
    setDraggedFlight(null)
    setDragOverLeg(null)
    setDropPosition(null)
  }

  const handleDropOnUnassigned = () => {
    if (!draggedFlight) return
    const updated = { ...assignments }
    Object.keys(updated).forEach(key => {
      updated[Number(key)] = updated[Number(key)].filter(id => id !== draggedFlight)
    })
    setAssignments(updated)
    setDraggedFlight(null)
    setDragOverLeg(null)
    setDropPosition(null)
  }

  const handleDragEnd = () => {
    setDraggedFlight(null)
    setDragOverLeg(null)
    setDropPosition(null)
  }

  const totalCash = flights.filter(f => assignedIds.has(f.id)).reduce((s, f) => s + getFlightPrice(f).cash, 0)
  const totalPoints = flights.filter(f => assignedIds.has(f.id)).reduce((s, f) => s + getFlightPrice(f).points, 0)
  const totalFees = flights.filter(f => assignedIds.has(f.id)).reduce((s, f) => s + getFlightPrice(f).fees, 0)

  const allLegsComplete = legs.every((leg, i) => {
    const lf = (assignments[i] || []).map(id => flightMap[id]).filter(Boolean)
    return validateLeg(leg, lf).complete
  })

  const flightCard = (flight: Flight) => {
    const route = getFlightRoute(flight)
    const price = getFlightPriceLabel(flight)
    const isDragging = draggedFlight === flight.id
    return (
      <div
        draggable
        onDragStart={() => handleDragStart(flight.id)}
        onDragEnd={handleDragEnd}
        style={{
          padding: '10px 12px',
          backgroundColor: isDragging ? '#f0f0f0' : '#fff',
          border: isDragging ? '2px dashed #999' : '1px solid #e0e0e0',
          borderRadius: 8,
          cursor: 'grab',
          opacity: isDragging ? 0.4 : 1,
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          userSelect: 'none' as const,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14 }}>{getFlightSummary(flight)}</div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
          {route.from} → {route.to}
          {flight.segments[0]?.date && <span style={{ color: '#aaa', marginLeft: 8 }}>{flight.segments[0].date}</span>}
        </div>
        {flight.segments[0]?.departureTime && (
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {flight.segments[0].departureTime} – {flight.segments[flight.segments.length - 1]?.arrivalTime}
            {flight.segments.length > 1 && ` · ${flight.segments.length} segments`}
          </div>
        )}
        {price && (
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            {price}{flight.bookingSite ? ` · ${flight.bookingSite}` : ''}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {bounceMessage && (
        <div style={{ padding: '10px 16px', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
          ✕ {bounceMessage}
        </div>
      )}

      <div
        onDragOver={handleDragOverUnassigned}
        onDrop={handleDropOnUnassigned}
        style={{
          padding: 16, backgroundColor: dragOverLeg === -1 ? '#f0f0f0' : '#fafafa',
          borderRadius: 10, marginBottom: 20, border: '2px dashed #ddd', minHeight: 60,
          transition: 'background-color 0.15s ease',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: '#888', marginBottom: unassigned.length > 0 ? 10 : 0 }}>
          {unassigned.length > 0 ? `${unassigned.length} flight${unassigned.length > 1 ? 's' : ''} to assign` : 'All flights assigned ✓'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {unassigned.map(f => (
            <div key={f.id} style={{ flex: '1 1 calc(50% - 4px)', minWidth: 200 }}>{flightCard(f)}</div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {legs.map((leg, i) => {
          const legFlightIds = assignments[i] || []
          const legFlights = legFlightIds.map(id => flightMap[id]).filter(Boolean)
          const validation = validateLeg(leg, legFlights)
          const isOver = dragOverLeg === i
          const legCash = legFlights.reduce((s, f) => s + getFlightPrice(f).cash, 0)
          const legPoints = legFlights.reduce((s, f) => s + getFlightPrice(f).points, 0)
          const legFees = legFlights.reduce((s, f) => s + getFlightPrice(f).fees, 0)

          return (
            <div key={i}
              onDragOver={(e) => handleDragOverLeg(e, i)}
              onDrop={() => handleDropOnLeg(i)}
              onDragLeave={() => { setDragOverLeg(null); setDropPosition(null) }}
              style={{
                flex: 1, minWidth: 240, backgroundColor: isOver ? '#e8f4e8' : '#f7f7f7',
                borderRadius: 10, padding: 14,
                border: validation.complete ? '2px solid #4CAF50'
                  : legFlights.length > 0 && validation.warnings.length > 0 ? '2px solid #FF9800'
                  : '2px dashed #ddd',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>Leg {i + 1}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{leg.from} → {leg.to}</div>
                </div>
                {validation.complete && <div style={{ fontSize: 20 }}>✅</div>}
                {!validation.complete && legFlights.length > 0 && <div style={{ fontSize: 20 }}>⚠️</div>}
              </div>

              {legFlights.length === 0 ? (
                <div style={{
                  padding: 30, textAlign: 'center', color: '#bbb', fontSize: 13,
                  border: '2px dashed #ddd', borderRadius: 8,
                  backgroundColor: isOver ? '#d4edda' : 'transparent',
                  transition: 'all 0.15s ease',
                }}>
                  Drop flights here
                </div>
              ) : (
                <div>
                  {legFlights.map((f, pos) => (
                    <div key={f.id}>
                      {dropPosition && dropPosition.leg === i && dropPosition.index === pos && (
                        <div style={{ height: 3, backgroundColor: '#2196F3', borderRadius: 2, marginBottom: 4 }} />
                      )}
                      <div onDragOver={(e) => handleDragOverCard(e, i, pos)} style={{ marginBottom: 6 }}>
                        {flightCard(f)}
                      </div>
                      {pos < legFlights.length - 1 && (
                        <div style={{ textAlign: 'center', padding: '2px 0 6px', fontSize: 12 }}>
                          {(() => {
                            const cTo = getFlightRoute(legFlights[pos]).to
                            const nFrom = getFlightRoute(legFlights[pos + 1]).from
                            if (cTo === nFrom) {
                              return <span style={{ color: '#4CAF50' }}>↓ via {cTo}</span>
                            }
                           if (airportsMatch(cTo, nFrom)) {
                              return <div style={{ padding: '6px 10px', backgroundColor: '#FFF3E0', borderRadius: 6, fontSize: 12, color: '#E65100', margin: '4px 0' }}>⚠ Airport change: {cTo} → {nFrom} — allow extra transfer time</div>
                            }
                            return <span style={{ color: '#f44336', fontWeight: 500 }}>⚠ {cTo} ✕ {nFrom}</span>
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                  {dropPosition && dropPosition.leg === i && dropPosition.index === legFlights.length && (
                    <div style={{ height: 3, backgroundColor: '#2196F3', borderRadius: 2, marginTop: 2 }} />
                  )}
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {validation.warnings.map((w, wi) => (
                    <div key={wi} style={{
                      padding: '6px 10px', borderRadius: 6, fontSize: 12, marginBottom: 4,
                      backgroundColor: w.type === 'short_layover' ? '#FFF3E0' : '#FFEBEE',
                      color: w.type === 'short_layover' ? '#E65100' : '#C62828',
                    }}>
                      {w.type === 'short_layover' ? '⏱' : '⚠'} {w.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {assignedIds.size > 0 && (
        <div style={{ marginTop: 16, padding: 14, backgroundColor: '#f7f7f7', borderRadius: 8, border: '1px solid #e0e0e0' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Trip Total{travelers > 1 ? ` (${travelers} travelers)` : ''}</div>
          {totalCash > 0 && <div style={{ fontSize: 14, marginBottom: 4 }}>💵 Cash: <strong>${(totalCash * travelers).toLocaleString()}</strong>{travelers > 1 && <span style={{ color: '#888' }}> (${totalCash.toLocaleString()} pp)</span>}</div>}
          {totalPoints > 0 && <div style={{ fontSize: 14, marginBottom: 4 }}>⭐ Points: <strong>{(totalPoints * travelers).toLocaleString()}</strong>{travelers > 1 && <span style={{ color: '#888' }}> ({totalPoints.toLocaleString()} pp)</span>}</div>}
          {totalFees > 0 && <div style={{ fontSize: 14, color: '#666' }}>+ Fees: ${(totalFees * travelers).toLocaleString()}</div>}
        </div>
      )}

     <div style={{ marginTop: 16 }}>
        <button onClick={() => onSave(assignments)} style={{
          width: '100%', padding: 12, backgroundColor: allLegsComplete ? '#4CAF50' : '#000',
          color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600,
        }}>
          {allLegsComplete ? '✓ Save Plan' : 'Save Plan (incomplete)'}
        </button>
      </div>
    </div>
  )
}
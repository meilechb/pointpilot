'use client'

import {
  getCityName,
  formatTime,
  formatDate,
  calculateTotalTime,
  calculateLayovers,
} from '@/utils/airportUtils'

type Flight = {
  id: string
  legIndex: number
  segments: any[]
  bookingSite: string
  paymentType: string
  cashAmount: number | null
  pointsAmount: number | null
  feesAmount: number | null
}

type Props = {
  flight: Flight
  compact?: boolean
  draggable?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  onEdit?: () => void
  onDelete?: () => void
  style?: React.CSSProperties
}

export default function FlightCard({ flight, compact = false, draggable = false, onDragStart, onDragEnd, onEdit, onDelete, style }: Props) {
  const segs = flight.segments
  if (segs.length === 0) return null

  const firstSeg = segs[0]
  const lastSeg = segs[segs.length - 1]

  const originCity = getCityName(firstSeg.departureAirport)
  const destCity = getCityName(lastSeg.arrivalAirport)

  const airportChain = segs.map((s: any) => s.departureAirport).concat([lastSeg.arrivalAirport]).join(' → ')
  const flightCodes = segs.map((s: any) => s.flightCode).filter(Boolean).join(', ')
  const airlines = [...new Set(segs.map((s: any) => s.airlineName).filter(Boolean))]

  const totalTime = calculateTotalTime(segs)
  const layovers = calculateLayovers(segs)

  const departDate = formatDate(firstSeg.date)
  const departTime = formatTime(firstSeg.departureTime)
  const arrivalDateStr = lastSeg.arrivalDate || lastSeg.date
  const arriveDate = formatDate(arrivalDateStr)
  const arriveTime = formatTime(lastSeg.arrivalTime)

  const isNextDay = arrivalDateStr && firstSeg.date && arrivalDateStr !== firstSeg.date

  let priceDisplay = ''
  if (flight.paymentType === 'cash' && flight.cashAmount) {
    priceDisplay = `$${flight.cashAmount.toLocaleString()}`
  } else if (flight.paymentType === 'points' && flight.pointsAmount) {
    priceDisplay = `${flight.pointsAmount.toLocaleString()} pts`
    if (flight.feesAmount) priceDisplay += ` + $${flight.feesAmount}`
  }

  const bookingLabel = [
    ...(airlines.length > 0 ? [airlines.join(', ')] : []),
    ...(flight.bookingSite && !airlines.includes(flight.bookingSite) ? [`via ${flight.bookingSite}`] : []),
  ].join(' • ')

  const actionButtons = (onEdit || onDelete) && (
    <div style={{ display: 'flex', gap: 4 }}>
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          title="Edit"
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 15, color: '#999', padding: '2px 6px', borderRadius: 4,
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#444')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#999')}
        >
          ✎
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="Delete"
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 15, color: '#999', padding: '2px 6px', borderRadius: 4,
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#cc0000')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#999')}
        >
          ✕
        </button>
      )}
    </div>
  )

  if (compact) {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{
          padding: '10px 12px',
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          cursor: draggable ? 'grab' : 'default',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          userSelect: 'none' as const,
          ...style,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{originCity} to {destCity}</div>
            <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
              {airportChain}
              {flightCodes && <span style={{ color: '#999', marginLeft: 6 }}>{flightCodes}</span>}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              {departDate && `${departDate}`}{departTime && `, ${departTime}`}
              {totalTime && ` · ${totalTime}`}
              {isNextDay && <span style={{ color: '#E65100' }}> +1</span>}
            </div>
            {priceDisplay && (
              <div style={{ fontSize: 12, color: '#555', fontWeight: 500, marginTop: 2 }}>
                {bookingLabel && `${bookingLabel} · `}{priceDisplay}
              </div>
            )}
          </div>
          {actionButtons}
        </div>
      </div>
    )
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        padding: 16,
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 10,
        cursor: draggable ? 'grab' : 'default',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        userSelect: 'none' as const,
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{originCity} to {destCity}</div>
          <div style={{ fontSize: 13, color: '#777', marginTop: 2 }}>
            {airportChain}
            {flightCodes && <span style={{ marginLeft: 8, color: '#999' }}>{flightCodes}</span>}
          </div>
        </div>
        {actionButtons}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, color: '#555' }}>
            Depart: {departDate}{departTime && `, ${departTime}`}
          </div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
            Arrive: {arriveDate}{arriveTime && `, ${arriveTime}`}
            {isNextDay && <span style={{ fontSize: 11, color: '#E65100', marginLeft: 4 }}>+1 day</span>}
          </div>
        </div>
        {totalTime && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#999' }}>Total Time</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{totalTime}</div>
          </div>
        )}
      </div>

      {layovers.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {layovers.map((l, i) => (
            <span key={i} style={{ fontSize: 12, color: '#888', marginRight: 12 }}>
              Layover in {getCityName(l.airport)} ({l.airport}): {l.duration}
            </span>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTop: '1px solid #f0f0f0',
      }}>
        <div style={{ fontSize: 13, color: '#888' }}>{bookingLabel}</div>
        {priceDisplay && (
          <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{priceDisplay}</div>
        )}
      </div>
    </div>
  )
}
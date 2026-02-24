'use client'

import {
  getCityName,
  formatTime,
  formatDate,
  calculateTotalTime,
  calculateLayovers,
} from '@/utils/airportUtils'

type PricingTier = {
  id: string
  label: string
  paymentType: 'cash' | 'points'
  cashAmount: number | null
  pointsAmount: number | null
  feesAmount: number | null
}

type Flight = {
  id: string
  legIndex: number
  segments: any[]
  bookingSite: string
  paymentType: string
  cashAmount: number | null
  pointsAmount: number | null
  feesAmount: number | null
  pricingTiers?: PricingTier[]
  defaultTierLabel?: string
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

  const tierCount = (flight.pricingTiers?.length || 0) + 1 // +1 for the main/default price

  const bookingLabel = [
    ...(flight.defaultTierLabel ? [flight.defaultTierLabel] : []),
    ...(airlines.length > 0 ? [airlines.join(', ')] : []),
    ...(flight.bookingSite && !airlines.includes(flight.bookingSite) ? [`via ${flight.bookingSite}`] : []),
  ].join(' · ')

  const actionButtons = (onEdit || onDelete) && (
    <div style={{ display: 'flex', gap: 2 }}>
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          title="Edit"
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, color: 'var(--text-muted)', padding: '4px 6px',
            borderRadius: 'var(--radius-sm)', transition: 'color 0.15s, background-color 0.15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--primary-light)' }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
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
            fontSize: 14, color: 'var(--text-muted)', padding: '4px 6px',
            borderRadius: 'var(--radius-sm)', transition: 'color 0.15s, background-color 0.15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)' }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
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
          padding: '10px 14px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius)',
          cursor: draggable ? 'grab' : 'default',
          boxShadow: 'var(--shadow-sm)',
          userSelect: 'none' as const,
          transition: 'box-shadow 0.15s',
          ...style,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{originCity} to {destCity}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {airportChain}
              {flightCodes && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{flightCodes}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {departDate && `${departDate}`}{departTime && `, ${departTime}`}
              {totalTime && <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}> · {totalTime}</span>}
              {isNextDay && <span style={{
                fontSize: 11, fontWeight: 700, color: 'var(--warning)',
                backgroundColor: 'var(--warning-bg)', padding: '1px 5px',
                borderRadius: 4, marginLeft: 4,
              }}>+1</span>}
            </div>
            {priceDisplay && (
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginTop: 3 }}>
                {priceDisplay}
                {bookingLabel && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>{bookingLabel}</span>}
                {tierCount > 1 && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--primary)',
                    backgroundColor: 'var(--primary-light)', padding: '1px 6px',
                    borderRadius: 4, marginLeft: 6,
                  }}>{tierCount} options</span>
                )}
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
        padding: 18,
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius)',
        cursor: draggable ? 'grab' : 'default',
        boxShadow: 'var(--shadow-sm)',
        userSelect: 'none' as const,
        transition: 'box-shadow 0.15s',
        ...style,
      }}
    >
      {/* Top: route + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{originCity} to {destCity}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {airportChain}
            {flightCodes && <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>{flightCodes}</span>}
          </div>
        </div>
        {actionButtons}
      </div>

      {/* Middle: times + total */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 14px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)',
        marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 500, color: 'var(--text)' }}>{departTime || '—'}</span>
            <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>{departDate}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            <span style={{ fontWeight: 500, color: 'var(--text)' }}>{arriveTime || '—'}</span>
            <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>{arriveDate}</span>
            {isNextDay && <span style={{
              fontSize: 11, fontWeight: 700, color: 'var(--warning)',
              backgroundColor: 'var(--warning-bg)', padding: '1px 6px',
              borderRadius: 4, marginLeft: 2,
            }}>+1 day</span>}
          </div>
        </div>
        {totalTime && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Time</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{totalTime}</div>
          </div>
        )}
      </div>

      {/* Layovers */}
      {layovers.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {layovers.map((l, i) => (
            <span key={i} style={{
              fontSize: 13, color: 'var(--text-secondary)',
              padding: '3px 10px', backgroundColor: 'var(--bg)',
              borderRadius: 20, border: '1px solid var(--border-light)',
            }}>
              {getCityName(l.airport)} ({l.airport}) · {l.duration}
            </span>
          ))}
        </div>
      )}

      {/* Bottom: booking + price */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 12, borderTop: '1px solid var(--border-light)',
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {bookingLabel}
          {tierCount > 1 && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--primary)',
              backgroundColor: 'var(--primary-light)', padding: '1px 6px',
              borderRadius: 4, marginLeft: 6,
            }}>{tierCount} options</span>
          )}
        </div>
        {priceDisplay && (
          <div style={{
            fontSize: 15, fontWeight: 700,
            color: flight.paymentType === 'points' ? 'var(--primary)' : 'var(--text)',
          }}>
            {priceDisplay}
          </div>
        )}
      </div>
    </div>
  )
}
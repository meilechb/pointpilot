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

  const airportChain = segs.map((s: any) => s.departureAirport).concat([lastSeg.arrivalAirport]).join(' → ')
  const flightCodes = segs.map((s: any) => s.flightCode).filter(Boolean).join(', ')
  const airlines = [...new Set(segs.map((s: any) => s.airlineName).filter(Boolean))]

  const totalTime = calculateTotalTime(segs)
  const layovers = calculateLayovers(segs)
  const stops = segs.length - 1
  const stopsLabel = stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`

  const departDate = formatDate(firstSeg.date)
  const departTime = formatTime(firstSeg.departureTime)
  const arrivalDateStr = lastSeg.arrivalDate || lastSeg.date
  const arriveTime = formatTime(lastSeg.arrivalTime)

  const isNextDay = arrivalDateStr && firstSeg.date && arrivalDateStr !== firstSeg.date

  let priceDisplay = ''
  let feesDisplay = ''
  if (flight.paymentType === 'cash' && flight.cashAmount) {
    priceDisplay = `$${flight.cashAmount.toLocaleString()}`
  } else if (flight.paymentType === 'points' && flight.pointsAmount) {
    priceDisplay = `${flight.pointsAmount.toLocaleString()} pts`
    if (flight.feesAmount) feesDisplay = `+ $${flight.feesAmount} fees`
  }

  const tierCount = (flight.pricingTiers?.length || 0) + 1

  const airlineDesc = [
    ...(airlines.length > 0 ? [airlines.join(', ')] : []),
    ...(flightCodes ? [flightCodes] : []),
  ].join(' ')

  const bookingSiteLabel = flight.bookingSite && !airlines.includes(flight.bookingSite)
    ? `via ${flight.bookingSite}` : ''

  const tierLabel = flight.defaultTierLabel || ''

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

  // ── COMPACT MODE ──
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
        {/* Row 1: Times + airports + duration */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{departTime || '—'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{firstSeg.departureAirport}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 2px' }}>→</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{arriveTime || '—'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{lastSeg.arrivalAirport}</span>
            {isNextDay && <span style={{
              fontSize: 10, fontWeight: 700, color: 'var(--warning)',
              backgroundColor: 'var(--warning-bg)', padding: '1px 5px',
              borderRadius: 4,
            }}>+1</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right' }}>
              {totalTime && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{totalTime}</span>}
              <span style={{
                fontSize: 11, color: stops === 0 ? 'var(--success)' : 'var(--text-muted)',
                fontWeight: stops === 0 ? 600 : 400, marginLeft: 6,
              }}>{stopsLabel}</span>
            </div>
            {actionButtons}
          </div>
        </div>

        {/* Row 2: Date + airline + price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {departDate}{airlineDesc ? ` · ${airlineDesc}` : ''}
            {tierCount > 1 && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: 'var(--primary)',
                backgroundColor: 'var(--primary-light)', padding: '1px 5px',
                borderRadius: 4, marginLeft: 5,
              }}>{tierCount} options</span>
            )}
          </div>
          {priceDisplay && (
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: flight.paymentType === 'points' ? 'var(--primary)' : 'var(--text)',
            }}>
              {priceDisplay}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── EXPANDED MODE ──
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
      {/* Row 1: Date + price + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{departDate}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {airlineDesc}
            {bookingSiteLabel && <span> · {bookingSiteLabel}</span>}
            {tierLabel && <span> · {tierLabel}</span>}
            {tierCount > 1 && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: 'var(--primary)',
                backgroundColor: 'var(--primary-light)', padding: '1px 5px',
                borderRadius: 4, marginLeft: 5,
              }}>{tierCount} options</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {priceDisplay && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 16, fontWeight: 700,
                color: flight.paymentType === 'points' ? 'var(--primary)' : 'var(--text)',
              }}>
                {priceDisplay}
              </div>
              {feesDisplay && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{feesDisplay}</div>
              )}
            </div>
          )}
          {actionButtons}
        </div>
      </div>

      {/* Row 2: Timeline hero */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)',
        marginTop: 10,
      }}>
        {/* Departure */}
        <div style={{ textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.3 }}>{departTime || '—'}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{firstSeg.departureAirport}</div>
        </div>

        {/* Duration + stops */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 500 }}>
            {totalTime || ''}
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
          <div style={{
            fontSize: 11, marginTop: 3, fontWeight: stops === 0 ? 600 : 400,
            color: stops === 0 ? 'var(--success)' : 'var(--text-muted)',
          }}>
            {stopsLabel}
            {stops > 0 && segs.length > 1 && (
              <span> via {segs.slice(0, -1).map((s: any) => s.arrivalAirport).join(', ')}</span>
            )}
          </div>
        </div>

        {/* Arrival */}
        <div style={{ textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.3 }}>
            {arriveTime || '—'}
            {isNextDay && <sup style={{ fontSize: 10, fontWeight: 700, color: 'var(--warning)', marginLeft: 1 }}>+1</sup>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{lastSeg.arrivalAirport}</div>
        </div>
      </div>

      {/* Row 3: Layovers */}
      {layovers.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {layovers.map((l, i) => (
            <span key={i} style={{
              fontSize: 12, color: 'var(--text-secondary)',
              padding: '3px 10px', backgroundColor: 'var(--bg)',
              borderRadius: 20, border: '1px solid var(--border-light)',
            }}>
              {getCityName(l.airport)} ({l.airport}) · {l.duration}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

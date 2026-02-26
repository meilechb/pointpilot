import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  const resend = getResend()
  if (!resend) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }

  const { to, itinerary, trip, flights } = await request.json()

  if (!to || !itinerary) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const travelers = itinerary.travelers || 1
  const totals = itinerary.totals || { cash: 0, points: 0, fees: 0 }
  const flightMap: Record<string, any> = {}
  ;(flights || []).forEach((f: any) => { flightMap[f.id] = f })

  const legsHtml = (trip?.legs || []).map((leg: any, i: number) => {
    const flightIds = itinerary.assignments?.[i] || []
    const legFlights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)

    const flightsHtml = legFlights.length === 0
      ? '<div style="color:#888;padding:8px;border:1px dashed #ddd;border-radius:6px">No flights assigned</div>'
      : legFlights.map((f: any) => {
        const segs = f.segments || []
        const firstSeg = segs[0] || {}
        const lastSeg = segs[segs.length - 1] || firstSeg
        const airline = firstSeg.airline || ''
        const flightNum = firstSeg.flightNumber || ''
        const route = `${firstSeg.departureAirport || '?'} → ${lastSeg.arrivalAirport || '?'}`
        const depart = firstSeg.departureTime || ''
        const arrive = lastSeg.arrivalTime || ''
        const price = f.paymentType === 'cash'
          ? `$${(f.cashAmount || 0).toLocaleString()}`
          : `${(f.pointsAmount || 0).toLocaleString()} pts + $${(f.feesAmount || 0).toLocaleString()} fees`
        return `<div style="padding:10px 14px;background:#f9f9fb;border-radius:6px;margin-bottom:6px;border:1px solid #e5e7eb">
          <div style="font-weight:600;font-size:14px">${airline} ${flightNum}</div>
          <div style="font-size:13px;color:#555">${route}</div>
          ${depart ? `<div style="font-size:12px;color:#888">${depart}${arrive ? ` → ${arrive}` : ''}</div>` : ''}
          <div style="font-size:13px;font-weight:600;margin-top:4px">${price}</div>
        </div>`
      }).join('')

    return `<div style="margin-bottom:16px">
      <div style="font-weight:700;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">
        Leg ${i + 1}: ${leg.from} → ${leg.to}
      </div>
      ${flightsHtml}
    </div>`
  }).join('')

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
      <div style="background:linear-gradient(135deg,#4338CA,#6366F1);padding:24px 28px;border-radius:12px 12px 0 0">
        <h1 style="color:white;font-size:22px;margin:0 0 4px">${itinerary.name}</h1>
        <div style="color:rgba(255,255,255,0.8);font-size:14px">${trip?.tripName || 'Trip'} — ${travelers} traveler${travelers > 1 ? 's' : ''}</div>
      </div>

      <div style="padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <div style="display:flex;gap:24px;margin-bottom:24px;padding:14px 16px;background:#f0f0f8;border-radius:8px">
          ${totals.cash > 0 ? `<div><div style="font-size:12px;color:#888">Cash</div><div style="font-weight:700;font-size:16px">$${(totals.cash * travelers).toLocaleString()}</div></div>` : ''}
          ${totals.points > 0 ? `<div><div style="font-size:12px;color:#888">Points</div><div style="font-weight:700;font-size:16px;color:#4338CA">${(totals.points * travelers).toLocaleString()}</div></div>` : ''}
          ${totals.fees > 0 ? `<div><div style="font-size:12px;color:#888">Fees</div><div style="font-weight:700;font-size:16px">$${(totals.fees * travelers).toLocaleString()}</div></div>` : ''}
        </div>

        ${legsHtml}

        <div style="margin-top:24px;font-size:12px;color:#aaa;border-top:1px solid #e5e7eb;padding-top:12px;text-align:center">
          Sent from <a href="https://www.pointtripper.com" style="color:#4338CA">Point Tripper</a> — Maximize Your Points & Miles
        </div>
      </div>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'Point Tripper <noreply@pointtripper.com>',
      to,
      subject: `${itinerary.name} — ${trip?.tripName || 'Trip Itinerary'}`,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[email-itinerary] Failed:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

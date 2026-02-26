import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const FOOTER = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #E5E7EB;padding-top:20px">
    <tr>
      <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#9CA3AF;line-height:1.6;text-align:center">
        <img src="https://www.pointtripper.com/logo.png" alt="Point Tripper" width="24" height="24" style="border-radius:6px;vertical-align:middle;margin-right:6px" />
        <a href="https://www.pointtripper.com" style="color:#4338CA;text-decoration:none;font-weight:600">Point Tripper</a>
        — Maximize Your Points &amp; Miles
        <br />
        <span style="color:#D1D5DB">Plan and compare flights using points, miles, and cash.</span>
        <br />
        <a href="https://www.pointtripper.com" style="color:#6B7280;text-decoration:none">Visit Point Tripper</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.pointtripper.com/pricing" style="color:#6B7280;text-decoration:none">Chrome Extension</a>
      </td>
    </tr>
  </table>
`

export async function POST(request: NextRequest) {
  const resend = getResend()
  if (!resend) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }

  const { to, itinerary, trip, flights, senderName, senderEmail } = await request.json()

  if (!to || !itinerary) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const travelers = itinerary.travelers || 1
  const totals = itinerary.totals || { cash: 0, points: 0, fees: 0 }
  const flightMap: Record<string, any> = {}
  ;(flights || []).forEach((f: any) => { flightMap[f.id] = f })

  const displayName = senderName || senderEmail || 'Someone'
  const tripName = trip?.tripName || 'Trip'

  // Build cost summary cells
  const costCells: string[] = []
  if (totals.cash > 0) {
    costCells.push(`
      <td style="padding:12px 16px;text-align:center">
        <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Cash</div>
        <div style="font-size:20px;font-weight:800;color:#1A1A2E">$${(totals.cash * travelers).toLocaleString()}</div>
      </td>
    `)
  }
  if (totals.points > 0) {
    costCells.push(`
      <td style="padding:12px 16px;text-align:center">
        <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Points</div>
        <div style="font-size:20px;font-weight:800;color:#4338CA">${(totals.points * travelers).toLocaleString()}</div>
      </td>
    `)
  }
  if (totals.fees > 0) {
    costCells.push(`
      <td style="padding:12px 16px;text-align:center">
        <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Taxes &amp; Fees</div>
        <div style="font-size:20px;font-weight:800;color:#1A1A2E">$${(totals.fees * travelers).toLocaleString()}</div>
      </td>
    `)
  }
  if (travelers > 1) {
    costCells.push(`
      <td style="padding:12px 16px;text-align:center">
        <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Travelers</div>
        <div style="font-size:20px;font-weight:800;color:#1A1A2E">${travelers}</div>
      </td>
    `)
  }

  const costSummary = costCells.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F0F8;border-radius:8px;margin-bottom:24px"><tr>${costCells.join('')}</tr></table>`
    : ''

  // Build legs + flight cards
  const legsHtml = (trip?.legs || []).map((leg: any, i: number) => {
    const flightIds = itinerary.assignments?.[i] || []
    const legFlights = flightIds.map((id: string) => flightMap[id]).filter(Boolean)

    const flightCards = legFlights.length === 0
      ? '<div style="color:#9CA3AF;padding:12px;border:1px dashed #D1D5DB;border-radius:8px;text-align:center;font-size:13px">No flights assigned</div>'
      : legFlights.map((f: any) => {
        const segs = f.segments || []
        const firstSeg = segs[0] || {}
        const lastSeg = segs[segs.length - 1] || firstSeg
        const airline = firstSeg.airline || firstSeg.airlineName || ''
        const flightNum = firstSeg.flightNumber || firstSeg.flightCode || ''
        const depAirport = firstSeg.departureAirport || '?'
        const arrAirport = lastSeg.arrivalAirport || '?'
        const depart = firstSeg.departureTime || ''
        const arrive = lastSeg.arrivalTime || ''
        const date = firstSeg.date || ''
        const stops = f.segments?.length > 1 ? `${f.segments.length - 1} stop` : 'Nonstop'
        const cabin = firstSeg.cabinClass || ''

        const priceLabel = f.paymentType === 'cash'
          ? `$${(f.cashAmount || 0).toLocaleString()}`
          : `${(f.pointsAmount || 0).toLocaleString()} pts` + (f.feesAmount ? ` + $${f.feesAmount.toLocaleString()}` : '')

        return `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:8px;overflow:hidden">
            <tr>
              <td style="padding:14px 16px">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="font-weight:700;font-size:15px;color:#1A1A2E;margin-bottom:2px">${airline} ${flightNum}</div>
                      <div style="font-size:14px;color:#374151">${depAirport} &rarr; ${arrAirport}</div>
                    </td>
                    <td align="right" style="vertical-align:top">
                      <div style="font-weight:700;font-size:15px;color:${f.paymentType === 'points' ? '#4338CA' : '#1A1A2E'}">${priceLabel}</div>
                    </td>
                  </tr>
                </table>
                <table cellpadding="0" cellspacing="0" style="margin-top:8px">
                  <tr>
                    ${depart ? `<td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Depart</span><br/><span style="font-size:13px;font-weight:600;color:#374151">${depart}</span></td>` : ''}
                    ${arrive ? `<td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Arrive</span><br/><span style="font-size:13px;font-weight:600;color:#374151">${arrive}</span></td>` : ''}
                    ${date ? `<td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Date</span><br/><span style="font-size:13px;font-weight:600;color:#374151">${date}</span></td>` : ''}
                    <td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Stops</span><br/><span style="font-size:13px;font-weight:600;color:#374151">${stops}</span></td>
                    ${cabin ? `<td><span style="font-size:12px;color:#6B7280">Class</span><br/><span style="font-size:13px;font-weight:600;color:#374151">${cabin}</span></td>` : ''}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      }).join('')

    return `
      <div style="margin-bottom:20px">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
          <tr>
            <td style="font-weight:700;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">
              Leg ${i + 1}: ${leg.from} &rarr; ${leg.to}
            </td>
          </tr>
        </table>
        ${flightCards}
      </div>
    `
  }).join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${itinerary.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${displayName} shared their ${tripName} itinerary with you — ${costCells.length > 0 ? 'view flights and pricing details' : 'view flight details'}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:24px 0">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4338CA,#6366F1);padding:28px 32px;border-radius:12px 12px 0 0">
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:rgba(255,255,255,0.8);font-size:13px;margin-bottom:4px">
                ${displayName} shared an itinerary with you
              </div>
              <h1 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:white;font-size:24px;font-weight:700;margin:0 0 4px">${itinerary.name}</h1>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:rgba(255,255,255,0.7);font-size:14px">
                ${tripName}${travelers > 1 ? ` &middot; ${travelers} travelers` : ''}
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:28px 32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1A1A2E;font-size:15px;line-height:1.6">
              ${costSummary}
              ${legsHtml}
              ${FOOTER}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  // Use reply-to for the sender so recipients can reply directly
  const fromName = senderName || 'Point Tripper'

  try {
    await resend.emails.send({
      from: `${fromName} via Point Tripper <noreply@pointtripper.com>`,
      replyTo: senderEmail || undefined,
      to,
      subject: `${displayName} shared their ${tripName} itinerary with you`,
      html,
      headers: {
        'X-Entity-Ref-ID': `itin-${Date.now()}`,
      },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[email-itinerary] Failed:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

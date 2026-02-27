import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { sendSubscriptionEmail, sendAdminGrantEmail, wrapEmail } from '@/lib/email'

const ADMIN_EMAIL = 'meilechbiller18@gmail.com'

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

// Send all email templates as test to the specified address
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, templates } = await req.json()
  if (!to) return NextResponse.json({ error: 'Missing "to" email address' }, { status: 400 })

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  if (!resend) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })

  const results: { template: string; success: boolean; error?: string }[] = []
  const sendAll = !templates || templates.length === 0

  // 1. Pro Welcome (Stripe checkout)
  if (sendAll || templates.includes('welcome')) {
    try {
      await sendSubscriptionEmail(to, 'welcome', {
        nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      })
      results.push({ template: 'welcome', success: true })
    } catch (e: any) {
      results.push({ template: 'welcome', success: false, error: e.message })
    }
  }

  // 2. Subscription Canceled
  if (sendAll || templates.includes('canceled')) {
    try {
      await sendSubscriptionEmail(to, 'canceled', {
        nextBillingDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      })
      results.push({ template: 'canceled', success: true })
    } catch (e: any) {
      results.push({ template: 'canceled', success: false, error: e.message })
    }
  }

  // 3. Admin Grant Pro
  if (sendAll || templates.includes('admin-granted')) {
    try {
      await sendAdminGrantEmail(to, 'granted', { adminName: 'Meilech' })
      results.push({ template: 'admin-granted', success: true })
    } catch (e: any) {
      results.push({ template: 'admin-granted', success: false, error: e.message })
    }
  }

  // 4. Admin Revoke Pro
  if (sendAll || templates.includes('admin-revoked')) {
    try {
      await sendAdminGrantEmail(to, 'revoked', { adminName: 'Meilech' })
      results.push({ template: 'admin-revoked', success: true })
    } catch (e: any) {
      results.push({ template: 'admin-revoked', success: false, error: e.message })
    }
  }

  // 5. Itinerary Share (sample)
  if (sendAll || templates.includes('itinerary')) {
    try {
      const sampleHtml = buildSampleItineraryEmail()
      await resend.emails.send({
        from: 'Test User via Point Tripper <noreply@pointtripper.com>',
        to,
        subject: '[TEST] Test User shared their NYC Trip itinerary with you',
        html: sampleHtml,
        headers: { 'X-Entity-Ref-ID': `test-itin-${Date.now()}` },
      })
      results.push({ template: 'itinerary', success: true })
    } catch (e: any) {
      results.push({ template: 'itinerary', success: false, error: e.message })
    }
  }

  return NextResponse.json({ results })
}

function buildSampleItineraryEmail(): string {
  const FOOTER = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #E5E7EB;padding-top:20px">
      <tr>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#9CA3AF;line-height:1.6;text-align:center">
          <img src="https://www.pointtripper.com/logo.png" alt="Point Tripper" width="24" height="24" style="border-radius:6px;vertical-align:middle;margin-right:6px" />
          <a href="https://www.pointtripper.com" style="color:#4338CA;text-decoration:none;font-weight:600">Point Tripper</a>
          — Maximize Your Points &amp; Miles
        </td>
      </tr>
    </table>
  `

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Sample Itinerary</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">Test User shared their NYC Trip itinerary with you</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:24px 0">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">
          <tr>
            <td style="background:linear-gradient(135deg,#4338CA,#6366F1);padding:28px 32px;border-radius:12px 12px 0 0">
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:rgba(255,255,255,0.8);font-size:13px;margin-bottom:4px">
                Test User shared an itinerary with you
              </div>
              <h1 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:white;font-size:24px;font-weight:700;margin:0 0 4px">Sample Itinerary</h1>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:rgba(255,255,255,0.7);font-size:14px">
                NYC Trip &middot; 2 travelers
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFFFF;padding:28px 32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1A1A2E;font-size:15px;line-height:1.6">

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F0F8;border-radius:8px;margin-bottom:24px">
                <tr>
                  <td style="padding:12px 16px;text-align:center">
                    <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Points</div>
                    <div style="font-size:20px;font-weight:800;color:#4338CA">120,000</div>
                  </td>
                  <td style="padding:12px 16px;text-align:center">
                    <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Taxes &amp; Fees</div>
                    <div style="font-size:20px;font-weight:800;color:#1A1A2E">$112</div>
                  </td>
                  <td style="padding:12px 16px;text-align:center">
                    <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Travelers</div>
                    <div style="font-size:20px;font-weight:800;color:#1A1A2E">2</div>
                  </td>
                </tr>
              </table>

              <div style="margin-bottom:20px">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
                  <tr>
                    <td style="font-weight:700;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">
                      Leg 1: LAX &rarr; JFK
                    </td>
                  </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:8px;overflow:hidden">
                  <tr>
                    <td style="padding:14px 16px">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <div style="font-weight:700;font-size:15px;color:#1A1A2E;margin-bottom:2px">United Airlines UA 123</div>
                            <div style="font-size:14px;color:#374151">LAX &rarr; JFK</div>
                          </td>
                          <td align="right" style="vertical-align:top">
                            <div style="font-weight:700;font-size:15px;color:#4338CA">60,000 pts + $56</div>
                          </td>
                        </tr>
                      </table>
                      <table cellpadding="0" cellspacing="0" style="margin-top:8px">
                        <tr>
                          <td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Depart</span><br/><span style="font-size:13px;font-weight:600;color:#374151">08:30</span></td>
                          <td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Arrive</span><br/><span style="font-size:13px;font-weight:600;color:#374151">16:45</span></td>
                          <td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Date</span><br/><span style="font-size:13px;font-weight:600;color:#374151">2026-03-15</span></td>
                          <td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Stops</span><br/><span style="font-size:13px;font-weight:600;color:#374151">Nonstop</span></td>
                          <td><span style="font-size:12px;color:#6B7280">Class</span><br/><span style="font-size:13px;font-weight:600;color:#374151">Business</span></td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="margin-bottom:20px">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
                  <tr>
                    <td style="font-weight:700;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">
                      Leg 2: JFK &rarr; LAX
                    </td>
                  </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:8px;overflow:hidden">
                  <tr>
                    <td style="padding:14px 16px">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <div style="font-weight:700;font-size:15px;color:#1A1A2E;margin-bottom:2px">Delta Air Lines DL 456</div>
                            <div style="font-size:14px;color:#374151">JFK &rarr; LAX</div>
                          </td>
                          <td align="right" style="vertical-align:top">
                            <div style="font-weight:700;font-size:15px;color:#4338CA">60,000 pts + $56</div>
                          </td>
                        </tr>
                      </table>
                      <table cellpadding="0" cellspacing="0" style="margin-top:8px">
                        <tr>
                          <td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Depart</span><br/><span style="font-size:13px;font-weight:600;color:#374151">19:00</span></td>
                          <td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Arrive</span><br/><span style="font-size:13px;font-weight:600;color:#374151">22:15</span></td>
                          <td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Date</span><br/><span style="font-size:13px;font-weight:600;color:#374151">2026-03-22</span></td>
                          <td style="padding-right:16px"><span style="font-size:12px;color:#6B7280">Stops</span><br/><span style="font-size:13px;font-weight:600;color:#374151">Nonstop</span></td>
                          <td><span style="font-size:12px;color:#6B7280">Class</span><br/><span style="font-size:13px;font-weight:600;color:#374151">Business</span></td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              ${FOOTER}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

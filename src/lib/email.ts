import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendSubscriptionEmail(to: string, type: 'welcome' | 'canceled') {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping email')
    return
  }

  const subject = type === 'welcome'
    ? 'Welcome to Point Tripper Pro!'
    : 'Your Point Tripper Pro subscription has been canceled'

  const html = type === 'welcome'
    ? `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;color:#1A1A2E">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">Welcome to Point Tripper Pro!</h1>
        <p style="font-size:15px;color:#4B5563;line-height:1.6">
          Thanks for upgrading! Your subscription is now active at <strong>$4.99/month</strong>.
        </p>
        <p style="font-size:15px;color:#4B5563;line-height:1.6">
          You now have <strong>unlimited flight scans</strong> with the Chrome extension. Browse any booking site and detect flights instantly.
        </p>
        <p style="font-size:15px;color:#4B5563;line-height:1.6">
          Manage your subscription anytime from your <a href="https://www.pointtripper.com/account" style="color:#4338CA">account page</a>.
        </p>
        <p style="font-size:13px;color:#9CA3AF;margin-top:24px">
          Point Tripper — Maximize Your Points & Miles
        </p>
      </div>
    `
    : `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;color:#1A1A2E">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">Subscription Canceled</h1>
        <p style="font-size:15px;color:#4B5563;line-height:1.6">
          Your Point Tripper Pro subscription has been canceled. You'll continue to have Pro access until the end of your current billing period.
        </p>
        <p style="font-size:15px;color:#4B5563;line-height:1.6">
          After that, you'll be on the free plan with 1 scan per month. You can resubscribe anytime from the <a href="https://www.pointtripper.com/pricing" style="color:#4338CA">pricing page</a>.
        </p>
        <p style="font-size:13px;color:#9CA3AF;margin-top:24px">
          Point Tripper — Maximize Your Points & Miles
        </p>
      </div>
    `

  try {
    await resend.emails.send({
      from: 'Point Tripper <noreply@pointtripper.com>',
      to,
      subject,
      html,
    })
    console.log(`[email] Sent ${type} email to ${to}`)
  } catch (err) {
    console.error(`[email] Failed to send ${type} email:`, err)
  }
}

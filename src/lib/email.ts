import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FOOTER = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #E5E7EB;padding-top:20px">
    <tr>
      <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#9CA3AF;line-height:1.6;text-align:center">
        <img src="https://www.pointtripper.com/logo.png" alt="Point Tripper" width="24" height="24" style="border-radius:6px;vertical-align:middle;margin-right:6px" />
        <a href="https://www.pointtripper.com" style="color:#4338CA;text-decoration:none;font-weight:600">Point Tripper</a>
        — Maximize Your Points &amp; Miles
        <br />
        <a href="https://www.pointtripper.com/account" style="color:#6B7280;text-decoration:none">Manage Account</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.pointtripper.com/pricing" style="color:#6B7280;text-decoration:none">Pricing</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.pointtripper.com/privacy" style="color:#6B7280;text-decoration:none">Privacy</a>
        <br />
        <span style="color:#D1D5DB">Point Tripper, Inc. &middot; You're receiving this because you have a Point Tripper account.</span>
      </td>
    </tr>
  </table>
`

export function wrapEmail(content: string, preheader?: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Point Tripper</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;-webkit-text-size-adjust:100%">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:24px 0">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background-color:#FFFFFF;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden">
          <tr><td style="padding:28px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1A1A2E;font-size:15px;line-height:1.6">
            ${content}
            ${FOOTER}
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

type SubscriptionEmailOpts = {
  nextBillingDate?: string | null
}

type AdminGrantOpts = {
  adminName?: string
}

export async function sendAdminGrantEmail(to: string, type: 'granted' | 'revoked', opts?: AdminGrantOpts) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping email')
    return
  }

  const adminName = opts?.adminName || 'Meilech'

  let subject: string
  let html: string

  if (type === 'granted') {
    subject = `${adminName} has granted you Point Tripper Pro access`

    html = wrapEmail(`
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:linear-gradient(135deg,#4338CA,#6366F1);color:white;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px">PRO GRANTED</div>
      </div>

      <h1 style="font-size:22px;font-weight:700;margin:0 0 16px;text-align:center">You've been upgraded to Pro!</h1>

      <p style="margin:0 0 16px;color:#4B5563;text-align:center;font-size:16px">
        <strong>${adminName}</strong> has personally granted you access to Point Tripper Pro.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F0F8;border-radius:8px;margin-bottom:24px">
        <tr>
          <td style="padding:16px 20px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#6B7280">Plan</td>
                <td align="right" style="font-size:14px;font-weight:600;color:#1A1A2E">Pro</td>
              </tr>
              <tr><td colspan="2" style="padding:4px 0"></td></tr>
              <tr>
                <td style="font-size:13px;color:#6B7280">Status</td>
                <td align="right" style="font-size:14px;font-weight:600;color:#059669">Active</td>
              </tr>
              <tr><td colspan="2" style="padding:4px 0"></td></tr>
              <tr>
                <td style="font-size:13px;color:#6B7280">Cost</td>
                <td align="right" style="font-size:14px;font-weight:600;color:#059669">Free — complimentary access</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 12px;color:#4B5563">Your Pro access includes:</p>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px">
        <tr><td style="padding:4px 0;color:#4B5563;font-size:14px">&#10003;&nbsp;&nbsp;Unlimited flight scans with the Chrome extension</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;font-size:14px">&#10003;&nbsp;&nbsp;AI-powered flight detection on any booking site</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;font-size:14px">&#10003;&nbsp;&nbsp;Save and compare flights across trips</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;font-size:14px">&#10003;&nbsp;&nbsp;Priority support</td></tr>
      </table>

      <div style="text-align:center;margin-bottom:16px">
        <a href="https://www.pointtripper.com" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4338CA,#6366F1);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">Start Using Point Tripper</a>
      </div>

      <p style="margin:0;color:#9CA3AF;font-size:13px;text-align:center">No payment required. Your access has been activated.</p>
    `, `${adminName} has granted you complimentary Point Tripper Pro access — unlimited flight scans, AI detection, and more.`)

  } else {
    subject = 'Your Point Tripper Pro access has been revoked'

    html = wrapEmail(`
      <h1 style="font-size:22px;font-weight:700;margin:0 0 16px">Pro Access Revoked</h1>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF3C7;border-radius:8px;border:1px solid #F59E0B;margin-bottom:24px">
        <tr>
          <td style="padding:14px 20px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#92400E">Status</td>
                <td align="right" style="font-size:14px;font-weight:600;color:#92400E">Free Plan</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 12px;color:#4B5563">
        Your complimentary Point Tripper Pro access has been revoked. You're now on the free plan with 1 flight scan per month.
      </p>
      <p style="margin:0;color:#4B5563">
        Want to upgrade? You can subscribe to Pro anytime from the <a href="https://www.pointtripper.com/pricing" style="color:#4338CA;text-decoration:none;font-weight:600">pricing page</a>.
      </p>
    `, 'Your complimentary Point Tripper Pro access has been revoked.')
  }

  try {
    await resend.emails.send({
      from: 'Point Tripper <noreply@pointtripper.com>',
      to,
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': `admin-${type}-${Date.now()}`,
        'List-Unsubscribe': '<https://www.pointtripper.com/account>',
      },
    })
    console.log(`[email] Sent admin-${type} email to ${to}`)
  } catch (err) {
    console.error(`[email] Failed to send admin-${type} email:`, err)
  }
}

export async function sendSubscriptionEmail(to: string, type: 'welcome' | 'canceled', opts?: SubscriptionEmailOpts) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping email')
    return
  }

  const nextDate = opts?.nextBillingDate
    ? new Date(opts.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  let subject: string
  let html: string

  if (type === 'welcome') {
    subject = 'Your Point Tripper Pro subscription is active'

    html = wrapEmail(`
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:linear-gradient(135deg,#4338CA,#6366F1);color:white;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px">PRO ACTIVE</div>
      </div>

      <h1 style="font-size:22px;font-weight:700;margin:0 0 16px;text-align:center">Welcome to Point Tripper Pro</h1>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F0F8;border-radius:8px;margin-bottom:24px">
        <tr>
          <td style="padding:16px 20px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#6B7280">Plan</td>
                <td align="right" style="font-size:14px;font-weight:600;color:#1A1A2E">Pro — $4.99/month</td>
              </tr>
              <tr><td colspan="2" style="padding:4px 0"></td></tr>
              <tr>
                <td style="font-size:13px;color:#6B7280">Status</td>
                <td align="right" style="font-size:14px;font-weight:600;color:#059669">Active</td>
              </tr>
              ${nextDate ? `
              <tr><td colspan="2" style="padding:4px 0"></td></tr>
              <tr>
                <td style="font-size:13px;color:#6B7280">Next billing date</td>
                <td align="right" style="font-size:14px;font-weight:600;color:#1A1A2E">${nextDate}</td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 12px;color:#4B5563">Your subscription is now active. Here's what you get:</p>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px">
        <tr><td style="padding:4px 0;color:#4B5563;font-size:14px">&#10003;&nbsp;&nbsp;Unlimited flight scans with the Chrome extension</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;font-size:14px">&#10003;&nbsp;&nbsp;AI-powered flight detection on any booking site</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;font-size:14px">&#10003;&nbsp;&nbsp;Save and compare flights across trips</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;font-size:14px">&#10003;&nbsp;&nbsp;Priority support</td></tr>
      </table>

      <p style="margin:0 0 4px;color:#4B5563">You can manage or cancel your subscription anytime from your <a href="https://www.pointtripper.com/account" style="color:#4338CA;text-decoration:none;font-weight:600">account page</a>.</p>
    `, `Your Point Tripper Pro subscription is now active — $4.99/month, unlimited flight scans.`)

  } else {
    subject = 'Your Point Tripper Pro subscription has been canceled'

    html = wrapEmail(`
      <h1 style="font-size:22px;font-weight:700;margin:0 0 16px">Subscription Canceled</h1>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF3C7;border-radius:8px;border:1px solid #F59E0B;margin-bottom:24px">
        <tr>
          <td style="padding:14px 20px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#92400E">Status</td>
                <td align="right" style="font-size:14px;font-weight:600;color:#92400E">Canceled</td>
              </tr>
              ${nextDate ? `
              <tr><td colspan="2" style="padding:4px 0"></td></tr>
              <tr>
                <td style="font-size:13px;color:#92400E">Pro access until</td>
                <td align="right" style="font-size:14px;font-weight:600;color:#92400E">${nextDate}</td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 12px;color:#4B5563">
        Your Point Tripper Pro subscription has been canceled.
        ${nextDate ? `You'll continue to have Pro access until <strong>${nextDate}</strong>.` : 'You\'ll continue to have Pro access until the end of your current billing period.'}
      </p>
      <p style="margin:0 0 12px;color:#4B5563">
        After that, you'll be on the free plan with 1 flight scan per month.
      </p>
      <p style="margin:0;color:#4B5563">
        Changed your mind? You can resubscribe anytime from the <a href="https://www.pointtripper.com/pricing" style="color:#4338CA;text-decoration:none;font-weight:600">pricing page</a>.
      </p>
    `, `Your Point Tripper Pro subscription has been canceled.${nextDate ? ` Pro access continues until ${nextDate}.` : ''}`)
  }

  try {
    await resend.emails.send({
      from: 'Point Tripper <noreply@pointtripper.com>',
      to,
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': `sub-${type}-${Date.now()}`,
        'List-Unsubscribe': '<https://www.pointtripper.com/account>',
      },
    })
    console.log(`[email] Sent ${type} email to ${to}`)
  } catch (err) {
    console.error(`[email] Failed to send ${type} email:`, err)
  }
}

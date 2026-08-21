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
        <a href="https://www.pointtripper.com/pricing" style="color:#6B7280;text-decoration:none">Chrome Extension</a>
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

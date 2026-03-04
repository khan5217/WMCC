import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.zoho.eu',
    port: 587,
    secure: false,
    requireTLS: true,
    tls: {
      minVersion: 'TLSv1.2',
    },
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })
}

const FROM = `"WMCC Milton Keynes" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`
const CLUB_EMAIL = 'contact@wmccmk.com'

type LoginMeta = {
  time: string
  ip: string
  userAgent: string
}

function loginAlertHtml(firstName: string, meta: LoginMeta): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1a5c38;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">WMCC</p>
            <p style="margin:4px 0 0;color:#86efac;font-size:13px;">Milton Keynes Cricket Club</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111827;">New sign-in detected</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${firstName}, your WMCC account was just signed into.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:0;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Time</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${meta.time}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">IP Address</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${meta.ip}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Device / Browser</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${meta.userAgent}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#92400e;">
                    <strong>Wasn't you?</strong> If you did not sign in, please contact us immediately at
                    <a href="mailto:${CLUB_EMAIL}" style="color:#92400e;">${CLUB_EMAIL}</a>
                    and we will secure your account.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
              This is an automated security alert from WMCC Milton Keynes Cricket Club.<br>
              Please do not reply to this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              WMCC · Crownhill Cricket Ground · 6 Marley Grove · Milton Keynes · MK8 0AT
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendLoginAlert(
  to: string,
  firstName: string,
  meta: LoginMeta
): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return
  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: FROM,
      to,
      subject: 'New sign-in to your WMCC account',
      html: loginAlertHtml(firstName, meta),
    })
  } catch (err) {
    console.error('Login alert email failed:', err)
  }
}

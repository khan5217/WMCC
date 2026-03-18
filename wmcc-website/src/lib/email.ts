import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'WMCC Milton Keynes <noreply@wmccmk.co.uk>'
const CLUB_EMAIL = 'contact@wmccmk.com'
const ADMIN_EMAIL = 'khan.h6@googlemail.com'

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

function welcomeHtml(firstName: string, tier: string): string {
  const tierLabel: Record<string, string> = {
    PLAYING_SENIOR: 'Playing (Senior)',
    PLAYING_JUNIOR: 'Playing (Junior)',
    SOCIAL: 'Social',
    FAMILY: 'Family',
    LIFE: 'Life Member',
  }
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a5c38;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">WMCC</p>
            <p style="margin:4px 0 0;color:#86efac;font-size:13px;">Milton Keynes Cricket Club</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111827;">Welcome to WMCC, ${firstName}!</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
              Your account has been created. We're thrilled to have you as part of the club.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Membership Type</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${tierLabel[tier] ?? tier}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#065f46;">
                    Your membership is currently <strong>pending approval</strong>. Once approved by the committee
                    you'll have full access to the members area.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:14px;color:#374151;">In the meantime, you can:</p>
            <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
              <li>Browse our latest news and match results</li>
              <li>View the squad and fixtures</li>
              <li>Contact the club at <a href="mailto:${CLUB_EMAIL}" style="color:#1a5c38;">${CLUB_EMAIL}</a></li>
            </ul>

            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
              This is an automated message from WMCC Milton Keynes Cricket Club.
            </p>
          </td>
        </tr>
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

function passwordResetHtml(firstName: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a5c38;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">WMCC</p>
            <p style="margin:4px 0 0;color:#86efac;font-size:13px;">Milton Keynes Cricket Club</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111827;">Reset your password</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
              Hi ${firstName}, we received a request to reset your WMCC account password.
              Click the button below — the link expires in <strong>1 hour</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${resetUrl}"
                     style="display:inline-block;background:#1a5c38;color:#ffffff;font-size:15px;font-weight:bold;
                            text-decoration:none;padding:14px 32px;border-radius:8px;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:13px;color:#6b7280;text-align:center;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;font-size:12px;color:#9ca3af;text-align:center;word-break:break-all;">
              ${resetUrl}
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#92400e;">
                    If you didn't request a password reset, you can safely ignore this email.
                    Your password will not change.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
              This is an automated security email from WMCC Milton Keynes Cricket Club.
            </p>
          </td>
        </tr>
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

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  membershipTier: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Welcome to WMCC Milton Keynes Cricket Club',
      html: welcomeHtml(firstName, membershipTier),
    })
    if (error) console.error('Welcome email failed:', error)
  } catch (err) {
    console.error('Welcome email failed:', err)
  }
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Reset your WMCC password',
      html: passwordResetHtml(firstName, resetUrl),
    })
    if (error) console.error('Password reset email failed:', error)
  } catch (err) {
    console.error('Password reset email failed:', err)
  }
}

function passwordChangedHtml(firstName: string, time: string, ip: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a5c38;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">WMCC</p>
            <p style="margin:4px 0 0;color:#86efac;font-size:13px;">Milton Keynes Cricket Club</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111827;">Your password was changed</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${firstName}, the password for your WMCC account was just updated.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Time</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${time}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">IP Address</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${ip}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#92400e;">
                    <strong>Wasn't you?</strong> Contact us immediately at
                    <a href="mailto:${CLUB_EMAIL}" style="color:#92400e;">${CLUB_EMAIL}</a>
                    and we will secure your account.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
              This is an automated security alert from WMCC Milton Keynes Cricket Club.
            </p>
          </td>
        </tr>
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

export async function sendPasswordChangedAlert(
  to: string,
  firstName: string,
  meta: { time: string; ip: string }
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your WMCC password was changed',
      html: passwordChangedHtml(firstName, meta.time, meta.ip),
    })
    if (error) console.error('Password changed alert failed:', error)
  } catch (err) {
    console.error('Password changed alert failed:', err)
  }
}

export async function sendLoginAlert(
  to: string,
  firstName: string,
  meta: LoginMeta
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'New sign-in to your WMCC account',
      html: loginAlertHtml(firstName, meta),
    })
    if (error) console.error('Login alert email failed:', error)
  } catch (err) {
    console.error('Login alert email failed:', err)
  }
}

function newMemberAlertHtml(firstName: string, lastName: string, email: string, phone: string, tier: string): string {
  const tierLabel: Record<string, string> = {
    PLAYING_SENIOR: 'Playing (Senior)',
    PLAYING_JUNIOR: 'Playing (Junior)',
    SOCIAL: 'Social',
    FAMILY: 'Family',
    LIFE: 'Life Member',
  }
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a5c38;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">WMCC</p>
            <p style="margin:4px 0 0;color:#86efac;font-size:13px;">Milton Keynes Cricket Club</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111827;">New member registered</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">A new member has signed up and is awaiting approval.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Name</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${firstName} ${lastName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${email}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Phone</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${phone}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Membership Tier</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${tierLabel[tier] ?? tier}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="https://wmccmk.com/admin/members"
                     style="display:inline-block;background:#1a5c38;color:#ffffff;font-size:15px;font-weight:bold;
                            text-decoration:none;padding:14px 32px;border-radius:8px;">
                    Review in Admin Panel →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
              This is an automated alert from WMCC Milton Keynes Cricket Club.
            </p>
          </td>
        </tr>
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

export async function sendNewMemberAlert(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  tier: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New member registration: ${firstName} ${lastName}`,
      html: newMemberAlertHtml(firstName, lastName, email, phone, tier),
    })
    if (error) console.error('New member alert email failed:', error)
  } catch (err) {
    console.error('New member alert email failed:', err)
  }
}

function newContactAlertHtml(name: string, email: string, phone: string | undefined, subject: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a5c38;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">WMCC</p>
            <p style="margin:4px 0 0;color:#86efac;font-size:13px;">Milton Keynes Cricket Club</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111827;">New contact message</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Someone has submitted a message via the contact form.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">From</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${name}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">
                    <a href="mailto:${email}" style="color:#1a5c38;">${email}</a>
                  </p>
                </td>
              </tr>
              ${phone ? `<tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Phone</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${phone}</p>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Subject</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${subject}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;">${message}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="https://wmccmk.com/admin/contacts"
                     style="display:inline-block;background:#1a5c38;color:#ffffff;font-size:15px;font-weight:bold;
                            text-decoration:none;padding:14px 32px;border-radius:8px;">
                    View in Admin Panel →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
              This is an automated alert from WMCC Milton Keynes Cricket Club.
            </p>
          </td>
        </tr>
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

function membershipReminderHtml(firstName: string, season: number, amount: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a5c38;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">WMCC</p>
            <p style="margin:4px 0 0;color:#86efac;font-size:13px;">Milton Keynes Cricket Club</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111827;">Membership fee reminder — ${season} season</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
              Hi ${firstName}, this is a friendly reminder that your ${season} WMCC membership fee is outstanding.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Season</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${season}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Amount Due</p>
                  <p style="margin:4px 0 0;font-size:18px;color:#111827;font-weight:700;">${amount}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#065f46;">
                    You can pay online via the membership page, or speak to a committee member to arrange payment by cash, bank transfer, or cheque.
                  </p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${siteUrl}/membership"
                     style="display:inline-block;background:#1a5c38;color:#ffffff;font-size:15px;font-weight:bold;
                            text-decoration:none;padding:14px 32px;border-radius:8px;">
                    Pay Membership Fee →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:14px;color:#374151;">
              If you have already paid by bank transfer or cash, please ignore this reminder — the committee will update your record shortly.
            </p>
            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
              Questions? Contact us at <a href="mailto:${CLUB_EMAIL}" style="color:#1a5c38;">${CLUB_EMAIL}</a>
            </p>
          </td>
        </tr>
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

export async function sendMembershipReminderEmail(
  to: string,
  firstName: string,
  season: number,
  amount: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wmccmk.com'
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `WMCC ${season} membership fee reminder`,
      html: membershipReminderHtml(firstName, season, amount, siteUrl),
    })
    if (error) console.error('Membership reminder email failed:', error)
  } catch (err) {
    console.error('Membership reminder email failed:', err)
  }
}

export async function sendNewContactAlert(
  name: string,
  email: string,
  phone: string | undefined,
  subject: string,
  message: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New contact message: ${subject}`,
      html: newContactAlertHtml(name, email, phone, subject, message),
    })
    if (error) console.error('New contact alert email failed:', error)
  } catch (err) {
    console.error('New contact alert email failed:', err)
  }
}

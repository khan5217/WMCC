import twilio from 'twilio'
import { prisma } from './prisma'
import crypto from 'crypto'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const TWILIO_FROM = process.env.TWILIO_SENDER_ID!
const OTP_EXPIRY_MINUTES = 10

function generateOTP(): string {
  // crypto.randomInt is cryptographically secure, unlike Math.random()
  return crypto.randomInt(100000, 1000000).toString()
}

function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function sendOTP(userId: string, phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Invalidate any existing OTPs for this user
    await prisma.otpCode.updateMany({
      where: { userId, used: false },
      data: { used: true },
    })

    const code = generateOTP()
    const codeHash = hashOTP(code)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Store the hash — raw code never persisted to DB
    await prisma.otpCode.create({
      data: {
        userId,
        phone,
        code: codeHash,
        expiresAt,
      },
    })

    // Send the raw code via SMS
    await client.messages.create({
      body: `Your WMCC login code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
      from: TWILIO_FROM,
      to: phone,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Twilio SMS error:', error.message)
    return { success: false, error: 'Failed to send verification code' }
  }
}

export async function sendAvailabilitySMS(params: {
  phone: string
  firstName: string
  matchDate: string
  opposition: string
  token: string
  isReminder?: boolean
}): Promise<{ success: boolean; error?: string }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://wmccmk.com'
  const availableUrl   = `${base}/availability/respond?token=${params.token}&status=AVAILABLE`
  const unavailableUrl = `${base}/availability/respond?token=${params.token}&status=UNAVAILABLE`
  const prefix = params.isReminder ? 'REMINDER: ' : ''

  try {
    await client.messages.create({
      body: `${prefix}WMCC Availability: ${params.opposition} on ${params.matchDate}.\nAvailable? ${availableUrl}\nNot available? ${unavailableUrl}`,
      from: TWILIO_FROM,
      to: params.phone,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Twilio availability SMS error:', error.message)
    return { success: false, error: error.message }
  }
}

export async function verifyOTP(userId: string, code: string): Promise<boolean> {
  const codeHash = hashOTP(code)

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId,
      code: codeHash,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return false

  // Mark as used
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  })

  return true
}

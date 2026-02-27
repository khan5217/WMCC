import twilio from 'twilio'
import { prisma } from './prisma'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER!
const OTP_EXPIRY_MINUTES = 10

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(userId: string, phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Invalidate any existing OTPs for this user
    await prisma.otpCode.updateMany({
      where: { userId, used: false },
      data: { used: true },
    })

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Store OTP in database
    await prisma.otpCode.create({
      data: {
        userId,
        phone,
        code,
        expiresAt,
      },
    })

    // Send SMS via Twilio
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

export async function verifyOTP(userId: string, code: string): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      userId,
      code,
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

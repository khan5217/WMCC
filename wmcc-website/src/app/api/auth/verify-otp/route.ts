import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP } from '@/lib/twilio'
import { createSession } from '@/lib/auth'
import { sendLoginAlert } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  userId: z.string(),
  code: z.string().length(6).regex(/^\d{6}$/),
})

// Rate limiter: max 5 attempts per 10 minutes per IP
const otpRateLimitMap = new Map<string, { count: number; resetAt: number }>()
function isOtpRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = otpRateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    otpRateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (isOtpRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait 10 minutes.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { userId, code } = schema.parse(body)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const valid = await verifyOTP(userId, code)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid or expired code. Please try again.' }, { status: 401 })
    }

    // Mark user as verified if first time
    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      })
    }

    const token = await createSession(userId)

    // Fire login alert email — non-blocking, never delays login
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'Unknown'
    const ua = req.headers.get('user-agent') ?? 'Unknown'
    const time = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'full', timeStyle: 'short' })
    void sendLoginAlert(user.email, user.firstName, { time, ip, userAgent: ua })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        membershipStatus: user.membershipStatus,
        avatarUrl: user.avatarUrl,
      },
    })

    // Set secure HttpOnly cookie
    response.cookies.set('wmcc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    console.error('OTP verify error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

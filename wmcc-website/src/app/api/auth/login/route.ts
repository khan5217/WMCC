import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, createSession } from '@/lib/auth'
import { sendOTP } from '@/lib/twilio'
import { sendLoginAlert } from '@/lib/email'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Dummy hash used to ensure constant-time comparison even for unknown emails,
// preventing timing-based email enumeration attacks.
const DUMMY_HASH = '$2a$12$dummy.hash.to.prevent.timing.attack.enumeration.xx'

// Rate limiter: max 5 attempts per 15 minutes per IP
const loginRateLimitMap = new Map<string, { count: number; resetAt: number }>()
function isLoginRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = loginRateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    loginRateLimitMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (isLoginRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait 15 minutes.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })

    // Always run bcrypt to prevent timing-based email enumeration
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH
    const valid = await comparePassword(password, hashToCompare)

    if (!user || !user.passwordHash || !valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.membershipStatus === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your account has been suspended. Contact the club.' }, { status: 403 })
    }

    // Skip OTP and create session directly if 2FA is disabled
    if (!user.twoFactorEnabled) {
      const token = await createSession(user.id)
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
      response.cookies.set('wmcc_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      })

      const ua = req.headers.get('user-agent') ?? 'Unknown'
      const time = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'full', timeStyle: 'short' })
      void sendLoginAlert(user.email, user.firstName, { time, ip, userAgent: ua })

      return response
    }

    // Send OTP to member's registered mobile
    const result = await sendOTP(user.id, user.phone)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Return userId for OTP verification step (masked phone for UX)
    const maskedPhone = user.phone.replace(/(\+\d{2})\d+(\d{3})$/, '$1****$2')

    return NextResponse.json({
      userId: user.id,
      maskedPhone,
      message: `Verification code sent to ${maskedPhone}`,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    console.error('Login error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

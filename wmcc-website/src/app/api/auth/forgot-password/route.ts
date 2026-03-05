import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

// Simple in-memory rate limiter: max 3 requests per 15 min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW = 15 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  if (entry.count >= RATE_LIMIT_MAX) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait 15 minutes before trying again.' },
        { status: 429 }
      )
    }

    const { email } = schema.parse(await req.json())

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    })

    const rawToken = crypto.randomBytes(32).toString('hex')
    // Store a SHA-256 hash of the token — raw token only ever lives in the email URL
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: tokenHash, expiresAt },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wmccmk.co.uk'
    const resetUrl = `${baseUrl}/members/reset-password?token=${rawToken}`

    void sendPasswordResetEmail(user.email, user.firstName, resetUrl)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

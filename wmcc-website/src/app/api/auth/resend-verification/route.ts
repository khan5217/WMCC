import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { sendEmailVerification } from '@/lib/email'
import crypto from 'crypto'

// Rate limit: 1 resend per 2 minutes per user
const resendMap = new Map<string, number>()

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    const lastSent = resendMap.get(ctx.userId)
    if (lastSent && Date.now() - lastSent < 2 * 60 * 1000) {
      return NextResponse.json({ error: 'Please wait before requesting another verification email' }, { status: 429 })
    }

    // Invalidate any existing unused tokens
    await prisma.emailVerificationToken.updateMany({
      where: { userId: ctx.userId, used: false },
      data: { used: true },
    })

    const token = crypto.randomBytes(32).toString('hex')
    await prisma.emailVerificationToken.create({
      data: {
        userId: ctx.userId,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wmccmk.co.uk'
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`

    void sendEmailVerification(ctx.user.email, ctx.user.firstName, verifyUrl)
    resendMap.set(ctx.userId, Date.now())

    return NextResponse.json({ ok: true, message: 'Verification email sent' })
  })
}

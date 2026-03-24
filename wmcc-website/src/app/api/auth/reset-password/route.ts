import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, comparePassword } from '@/lib/auth'
import { sendPasswordChangedAlert } from '@/lib/email'
import crypto from 'crypto'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/,
      'Password must contain uppercase, lowercase, a number, and a special character'
    ),
})

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json())

    // Hash the incoming token the same way we stored it
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    })

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    if (resetToken.user.passwordHash && await comparePassword(password, resetToken.user.passwordHash)) {
      return NextResponse.json({ error: 'New password must be different from your current password' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Invalidate all sessions so the old password can't be used
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ])

    // Alert the user their password was changed — non-blocking
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'Unknown'
    const time = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'full', timeStyle: 'short' })
    void sendPasswordChangedAlert(resetToken.user.email, resetToken.user.firstName, { time, ip })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: err.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
    }
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

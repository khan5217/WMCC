import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP } from '@/lib/twilio'
import { createSession } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  userId: z.string(),
  code: z.string().length(6),
})

export async function POST(req: NextRequest) {
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

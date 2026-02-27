import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'
import { sendOTP } from '@/lib/twilio'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.membershipStatus === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your account has been suspended. Contact the club.' }, { status: 403 })
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

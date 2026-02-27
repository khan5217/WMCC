import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { sendOTP } from '@/lib/twilio'
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in international format e.g. +447911123456'),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and a number'),
  membershipTier: z.enum(['PLAYING_SENIOR', 'PLAYING_JUNIOR', 'SOCIAL', 'FAMILY']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    // Check for existing email / phone
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    })

    if (existing) {
      const field = existing.email === data.email ? 'email' : 'phone number'
      return NextResponse.json({ error: `An account with this ${field} already exists` }, { status: 409 })
    }

    const passwordHash = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        passwordHash,
        membershipTier: data.membershipTier,
        membershipStatus: 'PENDING',
        role: 'MEMBER',
        isVerified: false,
      },
    })

    // Send OTP to verify phone
    const otpResult = await sendOTP(user.id, user.phone)
    if (!otpResult.success) {
      // Don't fail registration; user can verify later
      console.error('Failed to send OTP during registration:', otpResult.error)
    }

    const maskedPhone = user.phone.replace(/(\+\d{2})\d+(\d{3})$/, '$1****$2')

    return NextResponse.json({
      userId: user.id,
      maskedPhone,
      message: `Account created! Verify your mobile number to continue.`,
    }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 })
  }
}

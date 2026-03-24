import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewContactAlert } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
})

// Rate limiter: max 5 messages per 10 minutes per IP
const contactRateLimitMap = new Map<string, { count: number; resetAt: number }>()
function isContactRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = contactRateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    contactRateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (isContactRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)

    await prisma.contactMessage.create({ data })

    void sendNewContactAlert(data.name, data.email, data.phone, data.subject, data.message)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    console.error('Contact error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

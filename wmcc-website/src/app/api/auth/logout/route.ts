import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value

  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {})
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('wmcc_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}

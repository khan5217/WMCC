import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/members/verify-email?error=missing', req.url))
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!record || record.used || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/members/verify-email?error=invalid', req.url))
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { used: true } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
  ])

  return NextResponse.redirect(new URL('/members/verify-email?success=1', req.url))
}

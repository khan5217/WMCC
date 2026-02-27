import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  if (!token) return NextResponse.json({ user: null })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ user: null })

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          player: true,
        },
      },
    },
  })

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ user: null })
  }

  const { passwordHash, ...safeUser } = session.user as any

  return NextResponse.json({ user: safeUser })
}

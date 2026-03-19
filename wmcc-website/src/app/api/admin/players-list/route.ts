import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
}

// Returns all active players (for match fee assignment)
export async function GET(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const players = await prisma.player.findMany({
    where: { isActive: true },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: [
      { user: { firstName: 'asc' } },
      { user: { lastName: 'asc' } },
    ],
  })

  return NextResponse.json(
    players.map((p) => ({
      id: p.id,
      jerseyNumber: p.jerseyNumber,
      contactEmail: p.contactEmail,
      contactPhone: p.contactPhone,
      user: p.user,
    }))
  )
}

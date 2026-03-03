import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const liveMatches = await prisma.match.findMany({
    where: { isLive: true },
    include: { team: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(liveMatches)
}

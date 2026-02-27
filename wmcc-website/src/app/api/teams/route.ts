import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['FIRST_XI', 'SECOND_XI']),
  season: z.number().int(),
  description: z.string().nullable().optional(),
})

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
}

export async function GET(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teams = await prisma.team.findMany({
    orderBy: [{ season: 'desc' }, { type: 'asc' }],
  })

  return NextResponse.json(teams)
}

export async function POST(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'COMMITTEE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const team = await prisma.team.create({
      data: {
        name: data.name,
        type: data.type,
        season: data.season,
        description: data.description ?? null,
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A team of that type already exists for this season' }, { status: 409 })
    }
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}

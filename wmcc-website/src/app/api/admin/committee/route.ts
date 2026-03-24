import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  displayOrder: z.number().int().optional(),
})

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const members = await prisma.committeeMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    })
    return NextResponse.json(members)
  })
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    try {
      const data = schema.parse(await req.json())
      const member = await prisma.committeeMember.create({
        data,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
      })
      return NextResponse.json(member, { status: 201 })
    } catch (err: any) {
      if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
      if (err.code === 'P2002') return NextResponse.json({ error: 'This member already has a committee role' }, { status: 409 })
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }
  })
}

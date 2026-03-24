import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  email: z.string().email().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().optional(),
})

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const members = await prisma.committeeMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
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
      const member = await prisma.committeeMember.create({ data })
      return NextResponse.json(member, { status: 201 })
    } catch (err: any) {
      if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
      return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
    }
  })
}

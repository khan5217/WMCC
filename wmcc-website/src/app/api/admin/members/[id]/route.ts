import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { memberships: { orderBy: { createdAt: 'desc' } } },
  })
  if (!user) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  return NextResponse.json(user)
}

const schema = z.object({
  role: z.enum(['MEMBER', 'PLAYER', 'COMMITTEE', 'ADMIN']).optional(),
  membershipStatus: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED']).optional(),
  membershipTier: z.enum(['PLAYING_SENIOR', 'PLAYING_JUNIOR', 'SOCIAL', 'FAMILY', 'LIFE']).optional(),
})

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    console.error('Delete member error:', err)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = schema.parse(await req.json())

    const user = await prisma.user.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json({ ok: true, user })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: err.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    console.error('Update member error:', err)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

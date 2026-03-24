import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).optional(),
  displayOrder: z.number().int().optional(),
})

function isAdmin(ctx: { role: string }) {
  return ctx.role === 'ADMIN' || ctx.role === 'COMMITTEE'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    if (!isAdmin(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    try {
      const data = schema.parse(await req.json())
      const member = await prisma.committeeMember.update({
        where: { id: params.id },
        data,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
      })
      return NextResponse.json(member)
    } catch (err: any) {
      if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
      if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    if (!isAdmin(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    try {
      await prisma.committeeMember.delete({ where: { id: params.id } })
      return NextResponse.json({ ok: true })
    } catch (err: any) {
      if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { deleteFromS3, extractKeyFromUrl } from '@/lib/s3'

const schema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().optional(),
})

function requireAdmin(ctx: { role: string }) {
  return ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    if (requireAdmin(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    try {
      const data = schema.parse(await req.json())
      const member = await prisma.committeeMember.update({ where: { id: params.id }, data })
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
    if (requireAdmin(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    try {
      const member = await prisma.committeeMember.findUnique({ where: { id: params.id } })
      if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (member.avatarUrl) {
        try { await deleteFromS3(extractKeyFromUrl(member.avatarUrl)) } catch {}
      }
      await prisma.committeeMember.delete({ where: { id: params.id } })
      return NextResponse.json({ ok: true })
    } catch {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
  })
}

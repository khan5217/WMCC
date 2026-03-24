import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL!

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { memberships: { orderBy: { createdAt: 'desc' } } },
    })
    if (!user) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    return NextResponse.json(user)
  })
}

const schema = z.object({
  role: z.enum(['MEMBER', 'PLAYER', 'COMMITTEE', 'ADMIN']).optional(),
  membershipStatus: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED']).optional(),
  membershipTier: z.enum(['PLAYING_SENIOR', 'PLAYING_JUNIOR', 'SOCIAL', 'FAMILY', 'LIFE']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { email: true } })
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Super admin account cannot be modified by anyone
    if (target.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'This account cannot be modified' }, { status: 403 })
    }

    try {
      const body = schema.parse(await req.json())

      // Only ADMIN can assign the ADMIN role
      if (body.role === 'ADMIN' && ctx.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only an admin can assign the ADMIN role' }, { status: 403 })
      }

      const before = await prisma.user.findUnique({
        where: { id: params.id },
        select: { role: true, membershipStatus: true, membershipTier: true },
      })
      const user = await prisma.user.update({ where: { id: params.id }, data: body })
      void logAudit({
        actorId: ctx.userId,
        action: 'MEMBER_UPDATED',
        entity: 'User',
        entityId: params.id,
        details: { before, after: body },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
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
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete members' }, { status: 403 })
    }

    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { email: true } })
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Super admin account cannot be deleted by anyone
    if (target.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'This account cannot be deleted' }, { status: 403 })
    }

    try {
      await prisma.user.delete({ where: { id: params.id } })
      void logAudit({
        actorId: ctx.userId,
        action: 'MEMBER_DELETED',
        entity: 'User',
        entityId: params.id,
        details: { email: target.email },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      })
      return NextResponse.json({ ok: true })
    } catch (err: any) {
      if (err.code === 'P2025') {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }
      console.error('Delete member error:', err)
      return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
    }
  })
}

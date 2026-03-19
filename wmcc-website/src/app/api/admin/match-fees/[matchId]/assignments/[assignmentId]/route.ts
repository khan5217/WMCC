import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
}

async function requireAdmin(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COMMITTEE')) return null
  return user
}

const schema = z.object({
  playerType: z.enum(['STARTER', 'SUB']).optional(),
  amount: z.number().int().min(0).optional(),
  status: z.enum(['PENDING', 'PAID', 'OUTSTANDING', 'WAIVED']).optional(),
  paymentChannel: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { matchId: string; assignmentId: string } }
) {
  const adminUser = await requireAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const updateData: Record<string, unknown> = { ...data }

    if (data.status === 'PAID' && !data.paidAt) {
      updateData.paidAt = new Date()
    } else if (data.status && data.status !== 'PAID') {
      updateData.paidAt = null
      updateData.paymentChannel = null
    }

    if (data.paidAt) {
      updateData.paidAt = new Date(data.paidAt)
    }

    const assignment = await prisma.matchFeeAssignment.update({
      where: { id: params.assignmentId },
      data: updateData,
    })
    return NextResponse.json(assignment)
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { matchId: string; assignmentId: string } }
) {
  const adminUser = await requireAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    await prisma.matchFeeAssignment.delete({ where: { id: params.assignmentId } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

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
  billingPeriod: z.enum(['PER_MATCH', 'PER_DAY']).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  starterAmount: z.number().int().min(0).optional(),
  subAmount: z.number().int().min(0).optional(),
  season: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = schema.parse(body)
    const product = await prisma.matchFeeProduct.update({ where: { id: params.id }, data })
    return NextResponse.json(product)
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    await prisma.matchFeeProduct.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

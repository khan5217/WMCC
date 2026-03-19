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
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  starterAmount: z.number().int().min(0),
  subAmount: z.number().int().min(0),
  season: z.number().int(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : undefined

  const products = await prisma.matchFeeProduct.findMany({
    where: season ? { season } : undefined,
    orderBy: [{ season: 'desc' }, { name: 'asc' }],
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = schema.parse(body)
    const product = await prisma.matchFeeProduct.create({ data })
    return NextResponse.json(product, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

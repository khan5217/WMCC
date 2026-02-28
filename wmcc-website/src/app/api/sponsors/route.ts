import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { z } from 'zod'

export async function GET() {
  const sponsors = await prisma.sponsor.findMany({
    orderBy: [{ tier: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(sponsors)
}

const createSchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  tier: z.enum(['gold', 'silver', 'standard']).default('standard'),
  isActive: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    const body = await req.json()
    const data = createSchema.parse(body)

    const sponsor = await prisma.sponsor.create({ data })
    return NextResponse.json(sponsor, { status: 201 })
  }, 'ADMIN')
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, async () => {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const sponsor = await prisma.sponsor.update({ where: { id }, data: rest })
    return NextResponse.json(sponsor)
  }, 'ADMIN')
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async () => {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await prisma.sponsor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  }, 'ADMIN')
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(_req, async () => {
    const msg = await prisma.contactMessage.findUnique({ where: { id: params.id } })
    if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Mark as read when opened
    if (!msg.isRead) {
      await prisma.contactMessage.update({ where: { id: params.id }, data: { isRead: true } })
    }
    return NextResponse.json({ ...msg, isRead: true })
  }, 'COMMITTEE')
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async () => {
    const { isRead } = await req.json()
    const msg = await prisma.contactMessage.update({
      where: { id: params.id },
      data: { isRead },
    })
    return NextResponse.json(msg)
  }, 'COMMITTEE')
}

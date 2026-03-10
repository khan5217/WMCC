import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { deleteFromS3, extractKeyFromUrl } from '@/lib/s3'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const item = await prisma.galleryItem.findUnique({ where: { id: params.id } })
      if (!item) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      await prisma.galleryItem.delete({ where: { id: params.id } })

      try {
        const key = extractKeyFromUrl(item.url)
        await deleteFromS3(key)
      } catch {
        // S3 deletion is best-effort; DB record is already removed
      }

      return new NextResponse(null, { status: 204 })
    } catch (error: any) {
      console.error('Gallery delete error:', error)
      return NextResponse.json({ error: 'Failed to delete gallery item' }, { status: 500 })
    }
  })
}

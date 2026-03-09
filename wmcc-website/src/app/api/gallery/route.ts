import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const body = await req.json()
      const { title, description, mediaType, albumName, matchId, isFeatured, url } = body

      if (!url || !title) {
        return NextResponse.json({ error: 'url and title are required' }, { status: 400 })
      }

      const item = await prisma.galleryItem.create({
        data: {
          title,
          description: description || null,
          mediaType: (mediaType || 'PHOTO') as any,
          url,
          albumName: albumName || null,
          matchId: matchId || null,
          isFeatured: !!isFeatured,
          uploadedById: ctx.userId,
        },
      })

      return NextResponse.json(item, { status: 201 })
    } catch (error: any) {
      console.error('Gallery create error:', error)
      return NextResponse.json({ error: 'Failed to save gallery item' }, { status: 500 })
    }
  })
}

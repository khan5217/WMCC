import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { uploadToS3 } from '@/lib/s3'

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      const title = formData.get('title') as string
      const description = (formData.get('description') as string) || null
      const mediaType = (formData.get('mediaType') as string) || 'PHOTO'
      const albumName = (formData.get('albumName') as string) || null
      const matchId = (formData.get('matchId') as string) || null
      const isFeatured = formData.get('isFeatured') === 'true'

      if (!file || !title) {
        return NextResponse.json({ error: 'File and title are required' }, { status: 400 })
      }

      const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
      const folder = mediaType === 'VIDEO' ? 'gallery/videos' : 'gallery/photos'
      const key = `${folder}/${Date.now()}-${safeName}`
      const url = await uploadToS3(key, Buffer.from(await file.arrayBuffer()), file.type)

      const item = await prisma.galleryItem.create({
        data: {
          title,
          description,
          mediaType: mediaType as any,
          url,
          albumName,
          matchId: matchId || null,
          isFeatured,
          uploadedById: ctx.userId,
        },
      })

      return NextResponse.json(item, { status: 201 })
    } catch (error: any) {
      console.error('Upload gallery error:', error)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { getPresignedUploadUrl, getPublicUrl } from '@/lib/s3'

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { filename, contentType, mediaType, thumbnail } = await req.json()
    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 })
    }

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
    const allowed = mediaType === 'VIDEO' ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
    if (!allowed.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const safeName = filename.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
    const folder = mediaType === 'VIDEO'
      ? 'gallery/videos'
      : thumbnail
        ? 'gallery/thumbnails'
        : 'gallery/photos'
    const key = `${folder}/${Date.now()}-${safeName}`

    const uploadUrl = await getPresignedUploadUrl(key, contentType)
    const publicUrl = getPublicUrl(key)

    return NextResponse.json({ uploadUrl, publicUrl })
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { getPresignedUploadUrl, getPublicUrl } from '@/lib/s3'
import { prisma } from '@/lib/prisma'

// POST — get a presigned URL, then client uploads directly to S3
export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const { filename, contentType } = await req.json()
    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 })
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 400 })
    }
    const safe = filename.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
    const key = `avatars/${ctx.userId}-${Date.now()}-${safe}`
    const uploadUrl = await getPresignedUploadUrl(key, contentType)
    const publicUrl = getPublicUrl(key)
    return NextResponse.json({ uploadUrl, publicUrl })
  })
}

// PATCH — save the avatarUrl to the user record after upload
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const { avatarUrl } = await req.json()
    if (!avatarUrl) return NextResponse.json({ error: 'avatarUrl required' }, { status: 400 })
    await prisma.user.update({ where: { id: ctx.userId }, data: { avatarUrl } })
    return NextResponse.json({ ok: true })
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { getPresignedUploadUrl, getPublicUrl } from '@/lib/s3'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { filename, contentType } = await req.json()
    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 })
    }
    const safeName = filename.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
    const key = `committee/${params.id}-${Date.now()}-${safeName}`
    const uploadUrl = await getPresignedUploadUrl(key, contentType)
    const publicUrl = getPublicUrl(key)
    return NextResponse.json({ uploadUrl, publicUrl })
  })
}

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
      const category = formData.get('category') as string
      const access = (formData.get('access') as string) || 'ALL_MEMBERS'

      if (!file || !title || !category) {
        return NextResponse.json({ error: 'File, title, and category are required' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
      const key = `documents/${Date.now()}-${safeName}`
      const fileUrl = await uploadToS3(key, buffer, file.type)

      const doc = await prisma.document.create({
        data: {
          title,
          description,
          fileUrl,
          fileType: file.type,
          fileSize: file.size,
          category,
          access: access as any,
          uploadedById: ctx.userId,
        },
      })

      return NextResponse.json(doc, { status: 201 })
    } catch (error: any) {
      console.error('Upload document error:', error)
      return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
    }
  })
}

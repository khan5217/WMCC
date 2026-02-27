import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { getPresignedUrl } from '@/lib/s3'

const accessRank: Record<string, number> = {
  ALL_MEMBERS: 0, PLAYING_MEMBERS: 1, COMMITTEE: 2, ADMIN: 3,
}
const roleRank: Record<string, number> = {
  MEMBER: 0, PLAYER: 1, COMMITTEE: 2, ADMIN: 3,
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (ctx) => {
    const doc = await prisma.document.findUnique({ where: { id: params.id } })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const userRank = roleRank[ctx.role] ?? 0
    const requiredRank = accessRank[doc.access] ?? 0

    if (userRank < requiredRank) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Extract S3 key from URL
    const key = doc.fileUrl.split('.amazonaws.com/')[1] ?? doc.fileUrl

    try {
      const signedUrl = await getPresignedUrl(key, 300) // 5 minutes
      return NextResponse.redirect(signedUrl)
    } catch {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }
  })
}

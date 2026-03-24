import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { z } from 'zod'

interface Ctx { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const article = await prisma.newsArticle.findUnique({
    where: { id: params.id },
    include: { author: { select: { firstName: true, lastName: true } } },
  })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(article)
}

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  content: z.string().min(1),
  coverImage: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  isFeatured: z.boolean(),
  tags: z.array(z.string()).default([]),
})

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.newsArticle.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    try {
      const body = await req.json()
      const data = schema.parse(body)

      // Set publishedAt when first publishing
      const publishedAt =
        data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED'
          ? new Date()
          : existing.publishedAt

      const article = await prisma.newsArticle.update({
        where: { id: params.id },
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt ?? null,
          content: data.content,
          coverImage: data.coverImage ?? null,
          status: data.status,
          isFeatured: data.isFeatured,
          tags: data.tags,
          publishedAt,
        },
      })

      return NextResponse.json(article)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
      }
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'An article with this slug already exists' }, { status: 409 })
      }
      console.error('Update news error:', error)
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    }
  })
}

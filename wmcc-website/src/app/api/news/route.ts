import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  content: z.string().min(1),
  coverImage: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const body = await req.json()
      const data = schema.parse(body)

      const article = await prisma.newsArticle.create({
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt ?? null,
          content: data.content,
          coverImage: data.coverImage ?? null,
          status: data.status,
          isFeatured: data.isFeatured,
          tags: data.tags,
          authorId: ctx.userId,
          publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        },
      })

      return NextResponse.json(article, { status: 201 })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
      }
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'An article with this slug already exists' }, { status: 409 })
      }
      console.error('Create news error:', error)
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
    }
  })
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { formatDatetime } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await prisma.newsArticle.findUnique({ where: { slug: params.slug } })
  if (!article) return { title: 'Not Found' }
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: { images: article.coverImage ? [article.coverImage] : [] },
  }
}

export default async function ArticlePage({ params }: Props) {
  const article = await prisma.newsArticle.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: { author: { select: { firstName: true, lastName: true, avatarUrl: true } } },
  })

  if (!article) notFound()

  return (
    <>
      {/* Hero */}
      <div className="hero-gradient pt-24 pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/news" className="inline-flex items-center gap-2 text-green-200 hover:text-white mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to News
          </Link>
          {article.tags.length > 0 && (
            <div className="flex gap-2 mb-4">
              {article.tags.map((tag) => (
                <span key={tag} className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-white font-serif leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 mt-5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {article.author.firstName[0]}
            </div>
            <div>
              <div className="text-white text-sm font-medium">
                {article.author.firstName} {article.author.lastName}
              </div>
              <div className="text-green-200 text-xs">
                {article.publishedAt ? formatDatetime(article.publishedAt) : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cover image */}
      {article.coverImage && (
        <div className="relative h-72 md:h-96 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
          <div className="relative h-full rounded-xl overflow-hidden shadow-xl">
            <Image src={article.coverImage} alt={article.title} fill className="object-cover" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="section-padding">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-a:text-cricket-green"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>
    </>
  )
}

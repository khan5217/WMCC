import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { formatDate, truncate } from '@/lib/utils'
import { Newspaper } from 'lucide-react'

export const metadata: Metadata = {
  title: 'News',
  description: 'Latest news, match reports, and announcements from WMCC Milton Keynes Cricket Club.',
}

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const articles = await prisma.newsArticle.findMany({
    where: { status: 'PUBLISHED' },
    include: { author: { select: { firstName: true, lastName: true } } },
    orderBy: { publishedAt: 'desc' },
  })

  return (
    <>
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-3">News &amp; Reports</h1>
          <p className="text-xl text-green-100">Match reports, club announcements &amp; updates</p>
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max">
          {articles.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Newspaper className="h-14 w-14 mx-auto mb-3 opacity-30" />
              <h3 className="text-xl font-medium text-gray-500 mb-1">No articles yet</h3>
              <p>Check back soon for news and match reports!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="card group overflow-hidden">
                  <div className="relative h-52 bg-gradient-to-br from-cricket-green to-cricket-light overflow-hidden">
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/30 text-7xl font-serif">🏏</span>
                      </div>
                    )}
                    {article.isFeatured && (
                      <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        ★ Featured
                      </div>
                    )}
                    {article.tags.length > 0 && (
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-cricket-green text-white text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                          {article.tags[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-gray-400 mb-2">
                      {article.publishedAt ? formatDate(article.publishedAt) : ''} •{' '}
                      {article.author.firstName} {article.author.lastName}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:text-cricket-green transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {truncate(article.excerpt, 130)}
                      </p>
                    )}
                    <div className="mt-4 text-sm text-cricket-green font-medium">Read more →</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

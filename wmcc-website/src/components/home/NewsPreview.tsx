import Link from 'next/link'
import Image from 'next/image'
import { formatDate, truncate } from '@/lib/utils'
import { ArrowRight, Newspaper } from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  publishedAt: Date | null
  tags: string[]
  author: { firstName: string; lastName: string }
}

export function NewsPreview({ articles }: { articles: Article[] }) {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="section-title">Latest News</h2>
            <p className="section-subtitle">Match reports, club updates &amp; announcements</p>
          </div>
          <Link href="/news" className="text-sm text-cricket-green hover:text-cricket-dark font-medium flex items-center gap-1">
            All news <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No news published yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className={`card group overflow-hidden ${index === 0 ? 'md:col-span-1 md:row-span-1' : ''}`}
              >
                {/* Cover image */}
                <div className="relative h-48 bg-gradient-to-br from-cricket-green to-cricket-light overflow-hidden">
                  {article.coverImage ? (
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white/30 text-6xl font-serif font-bold">🏏</span>
                    </div>
                  )}
                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-cricket-green text-white text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                        {article.tags[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="text-xs text-gray-400 mb-2">
                    {article.publishedAt ? formatDate(article.publishedAt) : ''} •{' '}
                    {article.author.firstName} {article.author.lastName}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-cricket-green transition-colors mb-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {truncate(article.excerpt, 120)}
                    </p>
                  )}
                  <div className="mt-4 text-sm text-cricket-green font-medium group-hover:gap-2 flex items-center gap-1 transition-all">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

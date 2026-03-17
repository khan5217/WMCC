import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import { DeleteNewsButton } from './DeleteNewsButton'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-yellow-100 text-yellow-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
}

export default async function AdminNewsPage() {
  const articles = await prisma.newsArticle.findMany({
    include: { author: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">News Articles</h1>
        <Link href="/admin/news/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> New Article
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {articles.length === 0 && (
            <p className="px-4 py-10 text-center text-gray-400 text-sm">No articles yet.</p>
          )}
          {articles.map((article) => (
            <div key={article.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm leading-snug">{article.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {article.author.firstName} {article.author.lastName}
                    {article.publishedAt ? ` · ${formatDate(article.publishedAt)}` : ''}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColors[article.status]}`}>
                  {article.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Link href={`/admin/news/${article.id}/edit`} className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
                  <Edit className="h-3 w-3" /> Edit
                </Link>
                <Link href={`/news/${article.slug}`} className="text-xs text-cricket-green hover:underline" target="_blank">
                  View
                </Link>
                <DeleteNewsButton id={article.id} title={article.title} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Author</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Published</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900">{article.title}</div>
                    <div className="text-xs text-gray-400">/{article.slug}</div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {article.author.firstName} {article.author.lastName}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors[article.status]}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {article.publishedAt ? formatDate(article.publishedAt) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-3">
                      <Link href={`/admin/news/${article.id}/edit`} className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
                        <Edit className="h-3 w-3" /> Edit
                      </Link>
                      <Link href={`/news/${article.slug}`} className="text-cricket-green hover:underline text-xs" target="_blank">
                        View
                      </Link>
                      <DeleteNewsButton id={article.id} title={article.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { FileText, Download, Lock, Folder } from 'lucide-react'

const accessRank: Record<string, number> = {
  ALL_MEMBERS: 0, PLAYING_MEMBERS: 1, COMMITTEE: 2, ADMIN: 3,
}
const roleRank: Record<string, number> = {
  MEMBER: 0, PLAYER: 1, COMMITTEE: 2, ADMIN: 3,
}

export default async function DocumentsPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/members/login')

  const userRank = roleRank[sessionUser.role] ?? 0

  const allDocs = await prisma.document.findMany({
    orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
  })

  // Filter based on role
  const docs = allDocs.filter((d) => {
    const required = accessRank[d.access] ?? 0
    return userRank >= required
  })

  // Group by category
  const categories = docs.reduce<Record<string, typeof docs>>((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {})

  const sizeLabel = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const fileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('image')) return '🖼️'
    return '📁'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hero-gradient pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="h-5 w-5 text-green-300" />
            <span className="text-green-200 text-sm">Members Only</span>
          </div>
          <h1 className="text-4xl font-bold text-white font-serif">Private Documents</h1>
          <p className="text-green-100 mt-2">Club minutes, policies, and member resources</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {docs.length === 0 ? (
          <div className="card p-16 text-center">
            <Folder className="h-14 w-14 mx-auto text-gray-300 mb-3" />
            <h3 className="text-xl font-medium text-gray-500 mb-1">No documents available</h3>
            <p className="text-gray-400 text-sm">Documents will appear here when the committee uploads them.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(categories).map(([category, catDocs]) => (
              <div key={category}>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-cricket-green rounded-full" />
                  {category}
                  <span className="text-sm font-normal text-gray-400">({catDocs.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={`/api/documents/${doc.id}/download`}
                      className="card p-5 flex items-center gap-4 hover:border-l-4 hover:border-cricket-green transition-all group"
                      download
                    >
                      <div className="text-3xl flex-shrink-0">{fileIcon(doc.fileType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 group-hover:text-cricket-green transition-colors truncate">
                          {doc.title}
                        </div>
                        {doc.description && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(doc.createdAt)} • {sizeLabel(doc.fileSize)}
                          {doc.access !== 'ALL_MEMBERS' && (
                            <span className="ml-2 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-xs">
                              {doc.access.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Download className="h-5 w-5 text-gray-300 group-hover:text-cricket-green transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

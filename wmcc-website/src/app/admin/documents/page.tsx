import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Upload, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const accessColors: Record<string, string> = {
  ALL_MEMBERS: 'bg-green-100 text-green-800',
  PLAYING_MEMBERS: 'bg-blue-100 text-blue-800',
  COMMITTEE: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
}

export default async function AdminDocumentsPage() {
  const documents = await prisma.document.findMany({
    include: { uploadedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Documents</h1>
        <Link href="/admin/documents/new" className="btn-primary flex items-center gap-2 text-sm">
          <Upload className="h-4 w-4" /> Upload Document
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {documents.length === 0 && (
            <p className="px-4 py-10 text-center text-gray-400 text-sm">No documents uploaded yet.</p>
          )}
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{doc.title}</div>
                {doc.description && (
                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{doc.description}</div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accessColors[doc.access]}`}>
                    {doc.access.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">{doc.category}</span>
                  <span className="text-xs text-gray-400">{formatBytes(doc.fileSize)}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {doc.uploadedBy.firstName} {doc.uploadedBy.lastName} · {formatDate(doc.createdAt)}
                </div>
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
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Access</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Size</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Uploaded By</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900">{doc.title}</div>
                    {doc.description && <div className="text-xs text-gray-400 mt-0.5">{doc.description}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{doc.category}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${accessColors[doc.access]}`}>
                      {doc.access.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatBytes(doc.fileSize)}</td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(doc.createdAt)}</td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">No documents uploaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">Documents</h1>
        <div className="text-sm text-gray-500">{documents.length} documents</div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
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

'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'

interface AuditEntry {
  id: string
  action: string
  entity: string
  entityId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
  actor: { firstName: string; lastName: string; email: string } | null
}

const ACTION_COLORS: Record<string, string> = {
  MEMBER_UPDATED: 'bg-blue-100 text-blue-700',
  MEMBER_DELETED: 'bg-red-100 text-red-700',
  MEMBERSHIP_FEE_UPDATED: 'bg-purple-100 text-purple-700',
  MATCH_FEE_UPDATED: 'bg-yellow-100 text-yellow-700',
  MATCH_FEE_DELETED: 'bg-red-100 text-red-700',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (entityFilter) params.set('entity', entityFilter)
    fetch(`/api/admin/audit-log?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs ?? [])
        setTotal(data.total ?? 0)
        setPages(data.pages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [page, entityFilter])

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total events</p>
        </div>
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cricket-green"
        >
          <option value="">All entities</option>
          <option value="User">Members</option>
          <option value="Membership">Membership Fees</option>
          <option value="MatchFeeAssignment">Match Fees</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="px-5 py-10 text-center text-gray-400 text-sm">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="px-5 py-10 text-center text-gray-400 text-sm">No audit events found.</p>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(new Date(log.createdAt))}</span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : <span className="text-gray-400">System</span>}
                  </div>
                  <div className="text-xs text-gray-400">{log.entity} {log.entityId ? `· ${log.entityId.slice(0, 8)}…` : ''}</div>
                  {log.details && (
                    <button
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      className="text-xs text-cricket-green mt-1 hover:underline"
                    >
                      {expanded === log.id ? 'Hide details' : 'Show details'}
                    </button>
                  )}
                  {expanded === log.id && log.details && (
                    <pre className="mt-2 text-xs bg-gray-50 rounded p-2 overflow-x-auto text-gray-600">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Action</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Entity</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actor</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">IP</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <>
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          <div>{log.entity}</div>
                          {log.entityId && <div className="text-xs text-gray-400 font-mono">{log.entityId.slice(0, 12)}…</div>}
                        </td>
                        <td className="px-5 py-3.5">
                          {log.actor ? (
                            <>
                              <div className="font-medium text-gray-800">{log.actor.firstName} {log.actor.lastName}</div>
                              <div className="text-xs text-gray-400">{log.actor.email}</div>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">System</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{log.ipAddress ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(new Date(log.createdAt))}</td>
                        <td className="px-5 py-3.5">
                          {log.details && (
                            <button
                              onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                              className="text-xs text-cricket-green hover:underline whitespace-nowrap"
                            >
                              {expanded === log.id ? 'Hide' : 'Details'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded === log.id && log.details && (
                        <tr key={`${log.id}-details`}>
                          <td colSpan={6} className="px-5 pb-3">
                            <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto text-gray-600">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="text-sm text-cricket-green hover:underline disabled:text-gray-300 disabled:no-underline"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-500">Page {page} of {pages}</span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="text-sm text-cricket-green hover:underline disabled:text-gray-300 disabled:no-underline"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

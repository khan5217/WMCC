import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const [settings, user] = await Promise.all([
    prisma.siteSetting.findMany({ orderBy: { key: 'asc' } }),
    getSessionUser(),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Site configuration and preferences</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Account info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Account</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-700">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Role</dt>
              <dd>
                <span className="bg-cricket-green/10 text-cricket-green text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {user?.role}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Site settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Settings</h2>
          {settings.length === 0 ? (
            <p className="text-sm text-gray-400">No site settings configured yet.</p>
          ) : (
            <dl className="space-y-3 text-sm">
              {settings.map((s) => (
                <div key={s.key} className="flex justify-between items-start gap-4">
                  <dt className="text-gray-500 font-mono text-xs pt-0.5">{s.key}</dt>
                  <dd className="text-gray-700 text-right break-all">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  )
}

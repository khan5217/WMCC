import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import AdminShell from './AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  if (!user || (user.role !== 'ADMIN' && user.role !== 'COMMITTEE')) {
    redirect('/members/login')
  }

  return (
    <AdminShell userName={`${user.firstName} ${user.lastName}`}>
      {children}
    </AdminShell>
  )
}

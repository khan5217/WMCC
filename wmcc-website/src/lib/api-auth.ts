// Middleware helper for API route authentication
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { verifyToken, requireRole } from './auth'

export interface AuthContext {
  userId: string
  role: string
  user: any
}

export async function withAuth(
  req: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>,
  requiredRole?: string
): Promise<NextResponse> {
  const token = req.cookies.get('wmcc_session')?.value
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }

  const user = session.user

  if (requiredRole && !requireRole(user.role, requiredRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  return handler({ userId: user.id, role: user.role, user })
}

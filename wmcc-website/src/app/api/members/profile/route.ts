import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { hashPassword, comparePassword } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(7).max(20).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
})

export async function PATCH(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const body = schema.parse(await req.json())

      const updates: Record<string, any> = {}

      if (body.firstName) updates.firstName = body.firstName.trim()
      if (body.lastName) updates.lastName = body.lastName.trim()

      if (body.phone) {
        const existing = await prisma.user.findFirst({
          where: { phone: body.phone, NOT: { id: ctx.userId } },
        })
        if (existing) {
          return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 })
        }
        updates.phone = body.phone
      }

      if (body.newPassword) {
        if (!body.currentPassword) {
          return NextResponse.json({ error: 'Current password required to set a new one' }, { status: 400 })
        }
        const user = await prisma.user.findUnique({ where: { id: ctx.userId } })
        if (!user?.passwordHash) {
          return NextResponse.json({ error: 'No password set on this account' }, { status: 400 })
        }
        const valid = await comparePassword(body.currentPassword, user.passwordHash)
        if (!valid) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }
        updates.passwordHash = await hashPassword(body.newPassword)
      }

      if (!Object.keys(updates).length) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
      }

      const user = await prisma.user.update({
        where: { id: ctx.userId },
        data: updates,
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      })

      return NextResponse.json({ ok: true, user })
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return NextResponse.json({ error: err.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
      }
      console.error('Profile update error:', err)
      return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
    }
  })
}

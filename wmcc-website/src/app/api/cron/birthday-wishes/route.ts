import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBirthdayWishEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const day = now.getDate()

  const users = await prisma.user.findMany({
    where: { dateOfBirth: { not: null } },
    select: { email: true, firstName: true, dateOfBirth: true },
  })

  const todaysBirthdays = users.filter((u) => {
    const dob = u.dateOfBirth!
    return dob.getUTCMonth() + 1 === month && dob.getUTCDate() === day
  })

  let sent = 0
  for (const user of todaysBirthdays) {
    await sendBirthdayWishEmail(user.email, user.firstName)
    sent++
  }

  return NextResponse.json({ sent })
}

import { NextRequest, NextResponse } from 'next/server'
import { sendLoginAlert } from '@/lib/email'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.TEST_EMAIL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const to = req.nextUrl.searchParams.get('to')
  if (!to) {
    return NextResponse.json({ error: 'Missing ?to= email address' }, { status: 400 })
  }

  await sendLoginAlert(to, 'Test User', {
    time: new Date().toUTCString(),
    ip: req.headers.get('x-forwarded-for') ?? '127.0.0.1',
    userAgent: req.headers.get('user-agent') ?? 'Test',
  })

  return NextResponse.json({ ok: true, sentTo: to })
}

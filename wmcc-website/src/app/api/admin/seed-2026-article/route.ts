import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
    }

    const article = await prisma.newsArticle.upsert({
      where: { slug: '2026-season-announcement' },
      update: {
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date('2026-03-03'),
      },
      create: {
        title: "2026 Season Is Almost Here — Let's Make It Our Best Yet!",
        slug: '2026-season-announcement',
        excerpt: 'The 2026 cricket season is just around the corner. Pre-season nets are back, new signings are arriving, and membership is now open.',
        content: `<h2>The 2026 Season Is Coming!</h2>
<p>We are delighted to announce that the 2026 season at Wolverton Men's Cricket Club (WMCC) is almost upon us! After an outstanding 2025 campaign, we are gearing up for what promises to be our most exciting season yet.</p>
<h3>Pre-Season Nets</h3>
<p>Pre-season nets are back at Crownhill Cricket Ground. All members are encouraged to attend:</p>
<ul>
  <li><strong>When:</strong> Every Tuesday and Thursday from 6:30pm</li>
  <li><strong>Venue:</strong> Crownhill Cricket Ground, 6 Marley Grove, Milton Keynes, MK8 0AT</li>
  <li><strong>Starting:</strong> April 2026</li>
</ul>
<h3>Register for 2026</h3>
<p>Membership for the 2026 season is now open. We offer two simple options:</p>
<ul>
  <li><strong>Annual Playing Membership</strong> — £40 one-off payment, full playing rights for the season</li>
  <li><strong>Monthly Supporter</strong> — just £5/month by card or Direct Debit, cancel anytime</li>
</ul>
<p><a href="/membership">Register on our membership page</a> to secure your place for 2026.</p>
<h3>New Signings</h3>
<p>We are delighted to welcome several exciting new players to the squad this season. A full squad announcement will follow shortly.</p>
<p>If you would like to trial for WMCC or know someone who would, please contact us at <a href="mailto:contact@wmccmk.com">contact@wmccmk.com</a>.</p>
<p><em>Here's to a fantastic 2026 season — see you on the pitch!</em></p>`,
        coverImage: null,
        authorId: ctx.userId,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date('2026-03-03'),
        tags: ['2026', 'season', 'announcement', 'membership'],
      },
    })

    return NextResponse.json({ success: true, id: article.id, slug: article.slug })
  })
}

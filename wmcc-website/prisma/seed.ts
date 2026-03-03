import { PrismaClient, Role, MembershipTier, MembershipStatus, PlayerRole, BattingStyle, BowlingStyle, TeamType, MatchFormat, ArticleStatus, DocumentAccess } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding WMCC database...')

  // Create admin user
  const adminHash = await bcrypt.hash('Admin@WMCC2024!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wmcc.co.uk' },
    update: {},
    create: {
      email: 'admin@wmcc.co.uk',
      phone: '+447000000000',
      passwordHash: adminHash,
      firstName: 'Club',
      lastName: 'Admin',
      role: Role.ADMIN,
      membershipStatus: MembershipStatus.ACTIVE,
      membershipTier: MembershipTier.LIFE,
      isVerified: true,
    },
  })

  // Create 1st XI Team
  const team1 = await prisma.team.upsert({
    where: { type_season: { type: TeamType.FIRST_XI, season: 2024 } },
    update: {},
    create: {
      name: 'WMCC 1st XI',
      type: TeamType.FIRST_XI,
      description: 'Our first team competing in the South Northants Cricket League Premier Division.',
      season: 2024,
    },
  })

  // Create 2nd XI Team
  const team2 = await prisma.team.upsert({
    where: { type_season: { type: TeamType.SECOND_XI, season: 2024 } },
    update: {},
    create: {
      name: 'WMCC 2nd XI',
      type: TeamType.SECOND_XI,
      description: 'Our second team providing competitive cricket for all skill levels.',
      season: 2024,
    },
  })

  // Sponsors
  await prisma.sponsor.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Room Escape MK', tier: 'gold', website: 'https://roomescapemk.com', logoUrl: 'https://zkbeifjlj6gi0c4b.public.blob.vercel-storage.com/Room%20Escape.jpg' },
    ],
  })

  // Site Settings
  const settings = [
    { key: 'site_name', value: 'WMCC Milton Keynes Cricket Club' },
    { key: 'founded_year', value: '2020' },
    { key: 'ground_name', value: 'Crownhill Cricket Ground' },
    { key: 'ground_address', value: '6 Marley Grove, Milton Keynes, MK8 0AT' },
    { key: 'contact_email', value: 'contact@wmccmk.com' },
    { key: 'contact_phone', value: '+44 7000 000000' },
    { key: 'facebook_url', value: '' },
    { key: 'twitter_url', value: '' },
    { key: 'instagram_url', value: '' },
    { key: 'membership_senior_fee', value: '80' },
    { key: 'membership_junior_fee', value: '40' },
    { key: 'membership_social_fee', value: '25' },
    { key: 'membership_family_fee', value: '150' },
    { key: 'current_season', value: '2024' },
  ]

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  // 2026 Season announcement article
  await prisma.newsArticle.upsert({
    where: { slug: '2026-season-announcement' },
    update: {},
    create: {
      title: '2026 Season Is Almost Here — Let\'s Make It Our Best Yet!',
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
      authorId: admin.id,
      status: ArticleStatus.PUBLISHED,
      isFeatured: true,
      publishedAt: new Date('2026-03-03'),
      tags: ['2026', 'season', 'announcement', 'membership'],
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`   Admin: admin@wmcc.co.uk / Admin@WMCC2024!`)
  console.log(`   Teams: ${team1.name}, ${team2.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

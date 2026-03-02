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
    { key: 'founded_year', value: '1985' },
    { key: 'ground_name', value: 'WMCC Cricket Ground, Milton Keynes' },
    { key: 'ground_address', value: 'Milton Keynes, MK1 1AA' },
    { key: 'contact_email', value: 'info@wmcc.co.uk' },
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

  // Sample news article
  await prisma.newsArticle.upsert({
    where: { slug: 'welcome-to-wmcc-2024-season' },
    update: {},
    create: {
      title: 'Welcome to the 2024 Cricket Season!',
      slug: 'welcome-to-wmcc-2024-season',
      excerpt: 'We are thrilled to welcome all members and supporters to the 2024 cricket season at WMCC Milton Keynes.',
      content: '<p>We are thrilled to welcome all members and supporters to the 2024 cricket season at WMCC Milton Keynes. This year promises to be our most exciting yet with new players joining our squad and ambitious targets for both teams.</p><p>Pre-season nets are available every Tuesday and Thursday from 6:30pm. All are welcome!</p>',
      coverImage: null,
      authorId: admin.id,
      status: ArticleStatus.PUBLISHED,
      isFeatured: true,
      publishedAt: new Date('2024-04-01'),
      tags: ['season', 'welcome', '2024'],
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

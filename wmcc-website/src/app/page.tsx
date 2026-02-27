import { HeroSection } from '@/components/home/HeroSection'
import { StatsSection } from '@/components/home/StatsSection'
import { LatestResults } from '@/components/home/LatestResults'
import { UpcomingFixtures } from '@/components/home/UpcomingFixtures'
import { NewsPreview } from '@/components/home/NewsPreview'
import { SponsorsSection } from '@/components/home/SponsorsSection'
import { JoinCTA } from '@/components/home/JoinCTA'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getHomeData() {
  const [recentMatches, upcomingMatches, featuredNews, sponsors] = await Promise.all([
    prisma.match.findMany({
      where: { result: { not: null }, date: { lte: new Date() } },
      include: { team: true },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.match.findMany({
      where: { result: null, date: { gte: new Date() } },
      include: { team: true },
      orderBy: { date: 'asc' },
      take: 5,
    }),
    prisma.newsArticle.findMany({
      where: { status: 'PUBLISHED' },
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    prisma.sponsor.findMany({
      where: { isActive: true },
      orderBy: { tier: 'asc' },
    }),
  ])

  const playerCount = await prisma.player.count({ where: { isActive: true } })
  const matchCount = await prisma.match.count({ where: { result: { not: null } } })
  const winCount = await prisma.match.count({ where: { result: 'WIN' } })

  return { recentMatches, upcomingMatches, featuredNews, sponsors, playerCount, matchCount, winCount }
}

export default async function HomePage() {
  const data = await getHomeData()

  return (
    <>
      <HeroSection upcomingMatch={data.upcomingMatches[0]} />
      <StatsSection
        playerCount={data.playerCount}
        matchCount={data.matchCount}
        winCount={data.winCount}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <LatestResults matches={data.recentMatches} />
        <UpcomingFixtures matches={data.upcomingMatches} />
      </div>
      <NewsPreview articles={data.featuredNews} />
      <SponsorsSection sponsors={data.sponsors} />
      <JoinCTA />
    </>
  )
}

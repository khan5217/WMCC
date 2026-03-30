import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

// POST /api/import  body: { type: 'matches' | 'players', rows: object[] }
export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    const { type, rows } = await req.json()

    if (type === 'matches') {
      // Find the first available team to use as default if teamId not provided
      const defaultTeam = await prisma.team.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!defaultTeam) return NextResponse.json({ error: 'No teams exist. Create a team first.' }, { status: 400 })

      const created: string[] = []
      const errors: string[] = []

      for (const row of rows) {
        try {
          // Find team by name or fall back to defaultTeam
          let teamId = defaultTeam.id
          if (row.team) {
            const found = await prisma.team.findFirst({ where: { name: { contains: row.team, mode: 'insensitive' } } })
            if (found) teamId = found.id
          }

          const matchDate = new Date(row.date ?? Date.now())
          const opposition = row.opposition ?? 'Unknown'
          const venue = row.venue ?? 'TBC'

          const event = await prisma.matchEvent.create({
            data: {
              name: `vs ${opposition}`,
              date: matchDate,
              venue,
              teamId,
              season: matchDate.getFullYear(),
            },
          })

          await prisma.match.create({
            data: {
              teamId,
              eventId: event.id,
              opposition,
              venue,
              isHome: String(row.is_home ?? 'true').toLowerCase() !== 'false',
              date: matchDate,
              format: row.format ?? 'ONE_DAY',
              result: row.result || null,
              wmccScore: row.wmcc_score || null,
              wmccOvers: row.wmcc_overs ? parseFloat(row.wmcc_overs) : null,
              oppositionScore: row.opp_score || null,
              oppositionOvers: row.opp_overs ? parseFloat(row.opp_overs) : null,
              topScorer: row.top_scorer || null,
              topScorerRuns: row.top_scorer_runs ? parseInt(row.top_scorer_runs) : null,
              topBowler: row.top_bowler || null,
              topBowlerWickets: row.top_bowler_wickets ? parseInt(row.top_bowler_wickets) : null,
              cricheroesUrl: row.cricheroes_url || null,
              description: row.description || null,
              leagueName: row.league || null,
            },
          })
          created.push(row.opposition ?? 'row')
        } catch (e: any) {
          errors.push(`${row.opposition ?? 'row'}: ${e.message}`)
        }
      }

      return NextResponse.json({ created: created.length, errors })
    }

    if (type === 'players') {
      const created: string[] = []
      const errors: string[] = []

      for (const row of rows) {
        try {
          // Find player by name
          const [firstName, ...rest] = (row.name ?? '').trim().split(' ')
          const lastName = rest.join(' ')
          const user = await prisma.user.findFirst({
            where: { firstName: { equals: firstName, mode: 'insensitive' }, lastName: { equals: lastName, mode: 'insensitive' } },
            include: { player: true },
          })
          if (!user?.player) {
            errors.push(`${row.name}: No player profile found — add them via admin first`)
            continue
          }

          await prisma.player.update({
            where: { id: user.player.id },
            data: {
              totalMatches: row.matches ? parseInt(row.matches) : undefined,
              totalRuns: row.runs ? parseInt(row.runs) : undefined,
              highestScore: row.highest_score ? parseInt(row.highest_score) : undefined,
              battingAvg: row.batting_avg ? parseFloat(row.batting_avg) : undefined,
              strikeRate: row.strike_rate ? parseFloat(row.strike_rate) : undefined,
              totalWickets: row.wickets ? parseInt(row.wickets) : undefined,
              bestBowling: row.best_bowling || undefined,
              bowlingAvg: row.bowling_avg ? parseFloat(row.bowling_avg) : undefined,
              economy: row.economy ? parseFloat(row.economy) : undefined,
              cricheroesUrl: row.cricheroes_url || undefined,
            },
          })
          created.push(row.name)
        } catch (e: any) {
          errors.push(`${row.name ?? 'row'}: ${e.message}`)
        }
      }

      return NextResponse.json({ created: created.length, errors })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }, 'ADMIN')
}

interface Props {
  playerCount: number
  matchCount: number
  winCount: number
}

export function StatsSection({ playerCount, matchCount, winCount }: Props) {
  const winPct = matchCount > 0 ? Math.round((winCount / matchCount) * 100) : 0

  const stats = [
    { value: '1985', label: 'Year Founded' },
    { value: playerCount.toString(), label: 'Active Players' },
    { value: matchCount.toString(), label: 'Matches Played' },
    { value: `${winPct}%`, label: 'Win Rate' },
    { value: '2', label: 'Teams' },
  ]

  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

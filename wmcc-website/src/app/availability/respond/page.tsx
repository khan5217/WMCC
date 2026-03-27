import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'

interface Props {
  searchParams: { token?: string; status?: string; confirmed?: string }
}

const STATUS_COPY = {
  AVAILABLE:   { emoji: '✅', label: 'Available',     colour: '#16a34a', message: "Great! You're marked as available." },
  UNAVAILABLE: { emoji: '❌', label: 'Not Available', colour: '#dc2626', message: "No problem, we've noted you're unavailable." },
  MAYBE:       { emoji: '❓', label: 'Maybe',         colour: '#d97706', message: "Got it — we've noted you as a maybe." },
}

export default async function AvailabilityRespondPage({ searchParams }: Props) {
  const { token, status, confirmed } = searchParams

  // Show generic page if no token
  if (!token) {
    return <Message title="Invalid link" body="This availability link is missing or invalid." />
  }

  const request = await prisma.availabilityRequest.findUnique({
    where: { token },
    include: {
      match: true,
      player: { include: { user: { select: { firstName: true } } } },
    },
  })

  if (!request) {
    return <Message title="Link not found" body="This availability link is invalid or has expired." />
  }

  const expired = request.match.date < new Date()
  if (expired) {
    return <Message title="Match has passed" body={`The deadline for WMCC vs ${request.match.opposition} has passed.`} />
  }

  const matchDate = format(request.match.date, 'EEEE d MMMM yyyy')
  const currentStatus = (confirmed ? status : request.status) as keyof typeof STATUS_COPY
  const copy = STATUS_COPY[currentStatus] ?? STATUS_COPY.AVAILABLE

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://wmccmk.com'
  const availableUrl   = `${base}/api/availability/respond?token=${token}&status=AVAILABLE`
  const maybeUrl       = `${base}/api/availability/respond?token=${token}&status=MAYBE`
  const unavailableUrl = `${base}/api/availability/respond?token=${token}&status=UNAVAILABLE`

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        {/* WMCC header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cricket-green text-white text-xl font-bold mb-3">W</div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">WMCC Milton Keynes</p>
        </div>

        {/* Match info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Match</p>
          <p className="font-bold text-gray-900 text-lg">WMCC vs {request.match.opposition}</p>
          <p className="text-gray-500 text-sm mt-1">{matchDate}</p>
          <p className="text-gray-400 text-sm">{request.match.venue}</p>
        </div>

        {/* Current status */}
        {confirmed && (
          <div className="text-center mb-6 p-4 rounded-xl" style={{ background: `${copy.colour}15` }}>
            <p className="text-3xl mb-2">{copy.emoji}</p>
            <p className="font-bold text-lg" style={{ color: copy.colour }}>{copy.label}</p>
            <p className="text-gray-600 text-sm mt-1">{copy.message}</p>
          </div>
        )}

        {/* Change response buttons */}
        <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
          {confirmed ? 'Changed your mind?' : 'Update your response:'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <a
            href={availableUrl}
            className="flex flex-col items-center justify-center p-3 rounded-xl text-white text-xs font-bold text-center"
            style={{ background: currentStatus === 'AVAILABLE' && confirmed ? '#15803d' : '#16a34a', opacity: currentStatus === 'AVAILABLE' && confirmed ? 0.7 : 1 }}
          >
            ✅<span className="mt-1">Available</span>
          </a>
          <a
            href={maybeUrl}
            className="flex flex-col items-center justify-center p-3 rounded-xl text-white text-xs font-bold text-center"
            style={{ background: currentStatus === 'MAYBE' && confirmed ? '#b45309' : '#d97706', opacity: currentStatus === 'MAYBE' && confirmed ? 0.7 : 1 }}
          >
            ❓<span className="mt-1">Maybe</span>
          </a>
          <a
            href={unavailableUrl}
            className="flex flex-col items-center justify-center p-3 rounded-xl text-white text-xs font-bold text-center"
            style={{ background: currentStatus === 'UNAVAILABLE' && confirmed ? '#b91c1c' : '#dc2626', opacity: currentStatus === 'UNAVAILABLE' && confirmed ? 0.7 : 1 }}
          >
            ❌<span className="mt-1">Not Available</span>
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your last response is always saved. Link expires at match time.
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="text-cricket-green text-sm font-medium hover:underline">
            Visit WMCC website →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cricket-green text-white text-xl font-bold mb-4">W</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 text-sm">{body}</p>
        <Link href="/" className="mt-6 inline-block text-cricket-green text-sm font-medium hover:underline">
          Visit WMCC website →
        </Link>
      </div>
    </div>
  )
}

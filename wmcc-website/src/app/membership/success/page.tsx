import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function MembershipSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-cricket-green" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 font-serif mb-3">
          Welcome to WMCC! 🏏
        </h1>
        <p className="text-gray-600 mb-2">
          Your membership payment was successful. You&apos;re now an official WMCC member!
        </p>
        <p className="text-gray-500 text-sm mb-8">
          A confirmation email has been sent to your email address.
          Your account will be activated within 24 hours.
        </p>
        <div className="space-y-3">
          <Link href="/members/login" className="btn-primary block">
            Sign In to Members Area
          </Link>
          <Link href="/" className="btn-secondary block">
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

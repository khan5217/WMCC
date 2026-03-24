import Link from 'next/link'
import { CheckCircle, XCircle, MailWarning } from 'lucide-react'

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string }
}) {
  const isSuccess = searchParams.success === '1'
  const errorType = searchParams.error

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h1>
          <p className="text-gray-500 mb-6">Your email address has been confirmed. Your account is fully set up.</p>
          <Link href="/members" className="btn-primary">
            Go to Members Hub
          </Link>
        </div>
      </div>
    )
  }

  const errorMessage =
    errorType === 'missing'
      ? 'No verification token was found in the link.'
      : 'This verification link is invalid or has already been used. Links expire after 24 hours.'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {errorType ? (
            <XCircle className="h-8 w-8 text-red-600" />
          ) : (
            <MailWarning className="h-8 w-8 text-yellow-600" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {errorType ? 'Verification failed' : 'Verify your email'}
        </h1>
        <p className="text-gray-500 mb-6">
          {errorType
            ? errorMessage
            : 'Click the link in your confirmation email to verify your address. You can request a new link from the Members Hub.'}
        </p>
        <Link href="/members" className="btn-primary">
          Back to Members Hub
        </Link>
      </div>
    </div>
  )
}

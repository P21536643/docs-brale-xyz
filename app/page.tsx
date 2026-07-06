import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center text-white">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">M-Pesa Payment Hub</h1>
          <p className="text-blue-100 text-lg">
            Fast, secure, and easy mobile money payments
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-gray-900 mb-8">
          <p className="text-gray-600 mb-6">
            Pay with M-Pesa directly from your phone. Quick, secure, and reliable.
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <p className="text-sm text-gray-600">Instant payments via M-Pesa</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <p className="text-sm text-gray-600">Secure end-to-end encryption</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <p className="text-sm text-gray-600">Full transaction history</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/sign-up"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Create Account
            </Link>
            <Link
              href="/sign-in"
              className="inline-block w-full bg-white text-blue-600 hover:bg-gray-100 font-medium py-2 px-4 rounded border border-gray-300"
            >
              Sign In
            </Link>
          </div>
        </div>

        <p className="text-blue-100 text-sm">
          Built with Next.js, Neon PostgreSQL, and Better Auth
        </p>
      </div>
    </main>
  )
}

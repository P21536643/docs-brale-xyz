import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { PaymentForm } from '@/components/payment-form'
import { TransactionHistory } from '@/components/transaction-history'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">M-Pesa Payment Hub</h1>
            <p className="text-gray-600 text-sm">Welcome, {session.user.name || session.user.email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/wallet">
              <Button variant="outline">
                My Wallet
              </Button>
            </Link>
            <Link href="/mining">
              <Button variant="outline">
                Mining Dashboard
              </Button>
            </Link>
            <form
              action={async () => {
                'use server'
                await auth.api.signOut({ headers: await headers() })
                redirect('/sign-in')
              }}
            >
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Make Payment</h2>
              <PaymentForm />
            </div>
          </div>

          {/* Transaction History Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
              <TransactionHistory />
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Start</h3>
            <p className="text-sm text-gray-600">
              Enter your M-Pesa registered phone number, amount, and complete the transaction by entering your M-Pesa PIN.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Supported Amounts</h3>
            <p className="text-sm text-gray-600">
              M-Pesa transactions support amounts from KES 1 to KES 70,000 per transaction.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
            <p className="text-sm text-gray-600">
              Your payment information is encrypted and transmitted securely through M-Pesa&apos;s official API.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

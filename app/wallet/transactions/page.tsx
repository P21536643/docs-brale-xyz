import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { WalletTransactions } from '@/components/wallet-transactions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Wallet Transactions | M-Pesa Payment Hub',
  description: 'View your IsioloCoin wallet transaction history',
}

export default async function TransactionsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 mt-2">View all transactions for your connected wallet</p>
          </div>
          <Link href="/wallet">
            <Button variant="outline">Back to Wallet</Button>
          </Link>
        </div>

        <WalletTransactions />
      </div>
    </main>
  )
}

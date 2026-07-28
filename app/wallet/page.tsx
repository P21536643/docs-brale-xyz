import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { WalletDisplay } from '@/components/wallet-display'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'IsioloCoin Wallet | M-Pesa Payment Hub',
  description: 'Manage your IsioloCoin wallet and convert to M-Pesa',
}

export default async function WalletPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">IsioloCoin Wallet</h1>
              <p className="text-gray-600 mt-2">Manage your wallet and convert coins to M-Pesa</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </header>

        <div className="space-y-6">
          <WalletDisplay />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/wallet/connect">
              <Button variant="outline" className="w-full">
                Connect New Wallet
              </Button>
            </Link>
            <Link href="/wallet/transactions">
              <Button variant="outline" className="w-full">
                View Transactions
              </Button>
            </Link>
            <Link href="/wallet/convert">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Convert to M-Pesa
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

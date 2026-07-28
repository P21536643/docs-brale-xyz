import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { WalletConnectForm } from '@/components/wallet-connect-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Connect Wallet | M-Pesa Payment Hub',
  description: 'Link your IsioloCoin wallet address',
}

export default async function ConnectWalletPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Connect Wallet</h1>
          <Link href="/wallet">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <WalletConnectForm />
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to find your wallet address:</h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Visit isiolo-coin-link.base44.app</li>
                  <li>Log in to your account</li>
                  <li>Go to Wallet Settings</li>
                  <li>Copy your wallet address</li>
                  <li>Paste it in the form on the left</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">What you can do:</h3>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                  <li>View your IsioloCoin balance</li>
                  <li>Track transaction history</li>
                  <li>Convert coins to M-Pesa instantly</li>
                  <li>Receive mining rewards automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { WalletConvertForm } from '@/components/wallet-convert-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Convert to M-Pesa | M-Pesa Payment Hub',
  description: 'Convert your IsioloCoin balance to M-Pesa',
}

export default async function ConvertPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Convert to M-Pesa</h1>
          <Link href="/wallet">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <WalletConvertForm />
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How conversion works:</h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Enter the amount of IsioloCoin to convert</li>
                  <li>The KES amount will be calculated automatically</li>
                  <li>Enter your M-Pesa phone number</li>
                  <li>Click "Convert to M-Pesa"</li>
                  <li>You'll receive an STK prompt on your phone</li>
                  <li>Enter your M-Pesa PIN to complete</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Conversion Rate</h3>
                <p className="text-sm text-gray-600">1 ISIO = 50 KES</p>
              </div>

              <div className="border-t pt-4 bg-blue-50 rounded p-3">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">Security Note</h3>
                <p className="text-xs text-blue-700">
                  All conversions are processed through secure M-Pesa channels. Your wallet address is never shared with M-Pesa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

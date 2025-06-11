"use client"

import { ConnectionComparison } from "@/components/wallet/connection-comparison"
import { WalletProvider } from "@/components/wallet/wallet-provider"
import { MatricaProvider } from "@/components/wallet/matrica-provider"

export default function ConnectionTestPage() {
  return (
    <WalletProvider>
      <MatricaProvider>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Connection Method Comparison
                </h1>
                <p className="text-xl text-muted-foreground mt-2">
                  See the difference between traditional and Matrica authentication
                </p>
              </div>

              <ConnectionComparison />

              <div className="mt-12 p-6 border border-purple-500/30 rounded-lg bg-black/60 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-purple-300 mb-4">
                  Why Web3 Users Prefer Matrica:
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p>• <strong className="text-green-400">Unified Identity:</strong> One profile across all dApps</p>
                    <p>• <strong className="text-green-400">Mobile-First:</strong> Works seamlessly on phones</p>
                    <p>• <strong className="text-green-400">Multi-Wallet:</strong> Combine NFTs from all your wallets</p>
                  </div>
                  <div className="space-y-2">
                    <p>• <strong className="text-green-400">No Extensions:</strong> No browser dependencies</p>
                    <p>• <strong className="text-green-400">Instant Verification:</strong> Pre-verified ownership</p>
                    <p>• <strong className="text-green-400">Better UX:</strong> Familiar OAuth flow</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MatricaProvider>
    </WalletProvider>
  )
} 
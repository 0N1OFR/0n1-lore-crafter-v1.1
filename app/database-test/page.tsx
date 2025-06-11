"use client"

import { WalletProvider } from "@/components/wallet/wallet-provider"
import { MatricaProvider } from "@/components/wallet/matrica-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { MigrationDashboard } from "@/components/auth/migration-dashboard"
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button"
import { MatricaConnectButton } from "@/components/wallet/matrica-connect-button"

export default function DatabaseTestPage() {
  return (
    <WalletProvider>
      <MatricaProvider>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    Supabase Integration Test
                  </h1>
                  <p className="text-xl text-muted-foreground mt-2">
                    Database Authentication & Migration System
                  </p>
                </div>

                {/* Connection Options */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Traditional Wallet</h2>
                    <WalletConnectButton />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Matrica Connect</h2>
                    <MatricaConnectButton />
                  </div>
                </div>

                {/* Migration Dashboard */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Database & Migration Status</h2>
                  <MigrationDashboard />
                </div>

                {/* Setup Instructions */}
                <div className="mt-12 p-6 bg-muted rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Setup Instructions</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium">1. Set up Supabase Project</h4>
                      <p className="text-muted-foreground">
                        Create a new project at <code>supabase.com</code> and get your URL and anon key
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">2. Environment Variables</h4>
                      <p className="text-muted-foreground">
                        Add to your <code>.env.local</code>:
                      </p>
                      <div className="bg-black text-green-400 p-3 rounded mt-2 font-mono text-xs">
                        NEXT_PUBLIC_SUPABASE_URL=your_supabase_url<br/>
                        NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">3. Run Database Schema</h4>
                      <p className="text-muted-foreground">
                        Execute the SQL in <code>supabase/schema.sql</code> in your Supabase SQL editor
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">4. Test Migration</h4>
                      <p className="text-muted-foreground">
                        Connect your wallet/Matrica → Migrate data → Verify security
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AuthProvider>
      </MatricaProvider>
    </WalletProvider>
  )
} 
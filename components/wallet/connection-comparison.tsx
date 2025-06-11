"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WalletConnectButton } from "./wallet-connect-button"
import { MatricaConnectButton } from "./matrica-connect-button"
import { 
  Wallet, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield,
  Smartphone,
  Globe,
  Zap
} from "lucide-react"

export function ConnectionComparison() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Connection Method</h2>
        <p className="text-muted-foreground">
          Compare traditional wallet connection with Matrica's streamlined approach
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Traditional Wallet Connect */}
        <Card className="border-orange-500/30 bg-orange-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-400" />
              Traditional Wallet Connect
              <Badge variant="secondary" className="bg-orange-900/30 text-orange-300">
                Current Method
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Requires MetaMask browser extension</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Multiple popup approvals needed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span>Slow API calls to verify each NFT</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Desktop-only experience</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Complex wallet management</span>
              </div>
            </div>

            <div className="pt-4">
              <WalletConnectButton />
            </div>
          </CardContent>
        </Card>

        {/* Matrica Connect */}
        <Card className="border-green-500/30 bg-green-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-400" />
              Matrica Connect
              <Badge variant="default" className="bg-green-600">
                Recommended
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>One-click authentication</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-400" />
                <span>All wallets pre-verified & combined</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-green-400" />
                <span>Instant NFT verification</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-green-400" />
                <span>Works on mobile & desktop</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-green-400" />
                <span>Web3 identity you already use</span>
              </div>
            </div>

            <div className="pt-4">
              <MatricaConnectButton />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Don't have a Matrica account?{" "}
          <a 
            href="https://matrica.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 underline"
          >
            Create one here
          </a>{" "}
          and link your wallets in under 2 minutes.
        </p>
      </div>
    </div>
  )
} 
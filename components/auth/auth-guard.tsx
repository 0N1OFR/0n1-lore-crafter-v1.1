"use client"

import React from "react"
import { useAuth } from "./auth-provider"
import { useWallet } from "@/components/wallet/wallet-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Wallet, Shield, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { 
    isAuthenticated, 
    isAuthenticating, 
    authenticate, 
    authError, 
    clearAuthError 
  } = useAuth()
  
  const { 
    address, 
    isConnected, 
    isConnecting, 
    connect, 
    error: walletError 
  } = useWallet()

  // If authenticated, show children
  if (isAuthenticated) {
    return <>{children}</>
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // Default authentication UI
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-purple-500/30 bg-black/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-2xl">Access Required</CardTitle>
            <CardDescription className="mt-2">
              This is a token-gated experience. You need to authenticate with your NFT to access 0N1 Lore Crafter.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Wallet Connection Step */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm font-medium">
                Step 1: Connect Wallet
              </span>
            </div>
            
            {!isConnected ? (
              <Button 
                onClick={connect} 
                disabled={isConnecting}
                className="w-full"
                variant="outline"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <div className="text-sm text-green-400 font-mono">
                ✓ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            )}

            {walletError && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {walletError}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Authentication Step */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isAuthenticated ? 'bg-green-500' : 
                isConnected ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm font-medium">
                Step 2: Authenticate NFT
              </span>
            </div>
            
            {isConnected && !isAuthenticated && (
              <Button 
                onClick={authenticate} 
                disabled={isAuthenticating}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Sign to Authenticate
                  </>
                )}
              </Button>
            )}

            {authError && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {authError}
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={clearAuthError}
                    className="h-auto p-0 ml-2 text-red-400 hover:text-red-300"
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Info */}
          <div className="pt-4 border-t border-purple-500/20">
            <p className="text-xs text-muted-foreground text-center">
              You need to own a 0N1 Force NFT to access this experience.
              The signature request will not cost any gas fees.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
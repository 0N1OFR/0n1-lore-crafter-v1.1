"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Matrica user data structure
interface MatricaUser {
  id: string
  username: string
  wallets: string[]
  verified: boolean
}

interface MatricaContextType {
  user: MatricaUser | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  error: string | null
  hasNft: (tokenId: string) => boolean
}

const MatricaContext = createContext<MatricaContextType>({
  user: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  error: null,
  hasNft: () => false,
})

export const useMatrica = () => useContext(MatricaContext)

// Matrica OAuth2 configuration
const MATRICA_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_MATRICA_CLIENT_ID || "your-matrica-client-id",
  redirectUri: process.env.NEXT_PUBLIC_MATRICA_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/matrica/callback`,
  apiBaseUrl: process.env.NEXT_PUBLIC_MATRICA_API_URL || "https://api.matrica.io",
  authUrl: "https://matrica.io/oauth/authorize"
}

export function MatricaProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MatricaUser | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [userNfts, setUserNfts] = useState<Set<string>>(new Set())

  // Initialize from localStorage
  useEffect(() => {
    setMounted(true)
    const savedUser = localStorage.getItem("matricaUser")
    const savedToken = localStorage.getItem("matricaToken")
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsConnected(true)
        fetchUserNfts(savedToken)
        console.log("Restored Matrica connection from localStorage:", userData.username)
      } catch (error) {
        console.error("Error parsing saved Matrica user:", error)
        localStorage.removeItem("matricaUser")
        localStorage.removeItem("matricaToken")
      }
    }
  }, [])

  // Handle OAuth callback
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    
    if (code && state === 'matrica-auth') {
      handleOAuthCallback(code)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [mounted])

  const connect = async () => {
    if (typeof window === 'undefined') return

    setIsConnecting(true)
    setError(null)

    try {
      // Generate random state for security
      const state = 'matrica-auth'
      
      // Build OAuth URL
      const authUrl = new URL(MATRICA_CONFIG.authUrl)
      authUrl.searchParams.set('client_id', MATRICA_CONFIG.clientId)
      authUrl.searchParams.set('redirect_uri', MATRICA_CONFIG.redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'profile:read wallets:read nfts:read')
      authUrl.searchParams.set('state', state)

      console.log("Redirecting to Matrica OAuth:", authUrl.toString())
      
      // Redirect to Matrica OAuth
      window.location.href = authUrl.toString()
    } catch (err: any) {
      console.error("Error initiating Matrica OAuth:", err)
      setError(`Failed to connect with Matrica: ${err.message || "Unknown error"}`)
      setIsConnecting(false)
    }
  }

  const handleOAuthCallback = async (code: string) => {
    try {
      console.log("Handling Matrica OAuth callback with code:", code)
      
      // Exchange code for access token
      const tokenResponse = await fetch('/api/auth/matrica/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          client_id: MATRICA_CONFIG.clientId,
          redirect_uri: MATRICA_CONFIG.redirectUri,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`)
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token

      if (!accessToken) {
        throw new Error("No access token received")
      }

      console.log("Received Matrica access token")

      // Fetch user data
      const userResponse = await fetch('/api/auth/matrica/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error(`User data fetch failed: ${userResponse.status}`)
      }

      const userData = await userResponse.json()
      
      const matricaUser: MatricaUser = {
        id: userData.id,
        username: userData.username,
        wallets: userData.wallets || [],
        verified: userData.verified || false,
      }

      setUser(matricaUser)
      setIsConnected(true)
      
      // Save to localStorage
      localStorage.setItem("matricaUser", JSON.stringify(matricaUser))
      localStorage.setItem("matricaToken", accessToken)
      
      // Fetch user's NFTs
      await fetchUserNfts(accessToken)
      
      console.log("Matrica connection successful:", matricaUser.username)
    } catch (err: any) {
      console.error("Error handling OAuth callback:", err)
      setError(`Authentication failed: ${err.message || "Unknown error"}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const fetchUserNfts = async (token: string) => {
    try {
      console.log("Fetching user NFTs from Matrica...")
      
      const response = await fetch('/api/auth/matrica/nfts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error("Failed to fetch NFTs from Matrica:", response.status)
        return
      }

      const nftData = await response.json()
      
      // Extract 0N1 Force NFT token IDs
      const on1Nfts = nftData.nfts
        ?.filter((nft: any) => nft.collection?.toLowerCase().includes('0n1') || nft.collection?.toLowerCase().includes('force'))
        ?.map((nft: any) => nft.token_id || nft.identifier)
        ?.filter(Boolean) || []

      setUserNfts(new Set(on1Nfts))
      console.log(`Found ${on1Nfts.length} 0N1 Force NFTs for user`)
    } catch (error) {
      console.error("Error fetching user NFTs:", error)
    }
  }

  const disconnect = () => {
    console.log("Disconnecting from Matrica...")
    setUser(null)
    setIsConnected(false)
    setUserNfts(new Set())
    localStorage.removeItem("matricaUser")
    localStorage.removeItem("matricaToken")
    console.log("Matrica disconnected, localStorage cleared")

    // Refresh page to ensure clean state
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const hasNft = (tokenId: string): boolean => {
    return userNfts.has(tokenId)
  }

  // Don't render anything on the server
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <MatricaContext.Provider
      value={{
        user,
        isConnected,
        isConnecting,
        connect,
        disconnect,
        error,
        hasNft,
      }}
    >
      {children}
    </MatricaContext.Provider>
  )
} 
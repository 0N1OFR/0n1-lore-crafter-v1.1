"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useWallet } from "@/components/wallet/wallet-provider"
import { setAuthStore } from "@/lib/authenticated-api"

interface AuthUser {
  id: string
  wallet_address: string
  email?: string
}

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean
  isAuthenticating: boolean
  user: AuthUser | null
  accessToken: string | null
  
  // Authentication methods
  authenticate: () => Promise<void>
  logout: () => void
  
  // Error state
  authError: string | null
  clearAuthError: () => void
  
  // Re-authentication
  showReauthPopup: boolean
  triggerReauth: () => void
  dismissReauth: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAuthenticating: false,
  user: null,
  accessToken: null,
  authenticate: async () => {},
  logout: () => {},
  authError: null,
  clearAuthError: () => {},
  showReauthPopup: false,
  triggerReauth: () => {},
  dismissReauth: () => {}
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showReauthPopup, setShowReauthPopup] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Wallet context
  const { address, isConnected } = useWallet()

  // Initialize auth state from localStorage
  useEffect(() => {
    setMounted(true)
    const savedToken = localStorage.getItem("authToken")
    const savedUser = localStorage.getItem("authUser")
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setAccessToken(savedToken)
        setUser(parsedUser)
        setIsAuthenticated(true)
        
        // Update API utility with restored token
        setAuthStore(savedToken, triggerReauth)
        
        console.log("Restored authentication from localStorage")
      } catch (error) {
        console.error("Failed to parse saved user data:", error)
        // Clear corrupted data
        localStorage.removeItem("authToken")
        localStorage.removeItem("authUser")
      }
    }
  }, [])

  // Auto-logout if wallet disconnects
  useEffect(() => {
    if (mounted && isAuthenticated && !isConnected) {
      console.log("Wallet disconnected, logging out...")
      logout()
    }
  }, [isConnected, isAuthenticated, mounted])

  const authenticate = async () => {
    if (!address || !isConnected) {
      setAuthError("Please connect your wallet first")
      return
    }

    setIsAuthenticating(true)
    setAuthError(null)

    try {
      // Step 1: Get authentication challenge
      console.log("Requesting authentication challenge...")
      const challengeResponse = await fetch(`/api/auth/wallet?address=${address}`)
      
      if (!challengeResponse.ok) {
        throw new Error("Failed to get authentication challenge")
      }
      
      const { nonce, message } = await challengeResponse.json()
      console.log("Got authentication challenge")

      // Step 2: Request user to sign message
      console.log("Requesting wallet signature...")
      if (!window.ethereum) {
        throw new Error("MetaMask not found")
      }

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address]
      })
      console.log("Got wallet signature")

      // Step 3: Submit signature for authentication
      console.log("Submitting authentication...")
      const authResponse = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address,
          signature,
          message,
          nonce
        })
      })

      if (!authResponse.ok) {
        const errorData = await authResponse.json()
        throw new Error(errorData.error || "Authentication failed")
      }

      const { access_token, user: authUser } = await authResponse.json()
      console.log("Authentication successful")

      // Clear existing localStorage data (force re-creation)
      console.log("Clearing existing app data for fresh start...")
      const keysToKeep = ["walletAddress", "authToken", "authUser"]
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Save auth data
      setAccessToken(access_token)
      setUser(authUser)
      setIsAuthenticated(true)
      
      localStorage.setItem("authToken", access_token)
      localStorage.setItem("authUser", JSON.stringify(authUser))
      
      // Update API utility with new token
      setAuthStore(access_token, triggerReauth)
      
      console.log("User authenticated successfully:", authUser)

    } catch (error: any) {
      console.error("Authentication error:", error)
      setAuthError(error.message || "Authentication failed")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const logout = () => {
    console.log("Logging out...")
    
    // Clear auth state
    setIsAuthenticated(false)
    setUser(null)
    setAccessToken(null)
    setAuthError(null)
    setShowReauthPopup(false)
    
    // Clear localStorage
    localStorage.removeItem("authToken")
    localStorage.removeItem("authUser")
    
    // Clear API utility
    setAuthStore(null, null)
    
    // Clear all app data
    const keysToKeep = ["walletAddress"] // Keep wallet connection
    const keysToRemove = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && !keysToKeep.includes(key)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log("Logout complete")
    
    // Refresh page to ensure clean state
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const clearAuthError = () => {
    setAuthError(null)
  }

  const triggerReauth = () => {
    setShowReauthPopup(true)
  }

  const dismissReauth = () => {
    setShowReauthPopup(false)
  }

  // Don't render on server
  if (!mounted) {
    return <>{children}</>
  }

  const value: AuthContextType = {
    isAuthenticated,
    isAuthenticating,
    user,
    accessToken,
    authenticate,
    logout,
    authError,
    clearAuthError,
    showReauthPopup,
    triggerReauth,
    dismissReauth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 
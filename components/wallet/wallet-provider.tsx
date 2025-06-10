"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface WalletContextType {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  error: string | null
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  error: null,
})

export const useWallet = () => useContext(WalletContext)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Check if ethereum is available
  const isMetaMaskAvailable = () => {
    return typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  }

  // Initialize wallet state from localStorage
  useEffect(() => {
    setMounted(true)
    const savedAddress = localStorage.getItem("walletAddress")
    if (savedAddress) {
      setAddress(savedAddress)
      setIsConnected(true)
      console.log("Restored wallet connection from localStorage:", savedAddress)
    }
  }, [])

  // Handle account changes
  useEffect(() => {
    if (!isMetaMaskAvailable() || !isConnected) return

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("MetaMask accounts changed:", accounts)
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect()
      } else if (accounts[0] !== address) {
        // User switched accounts
        setAddress(accounts[0])
        localStorage.setItem("walletAddress", accounts[0])
        console.log("Updated wallet address:", accounts[0])
      }
    }

    window.ethereum?.on("accountsChanged", handleAccountsChanged)

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
    }
  }, [address, isConnected])

  const connect = async () => {
    if (!isMetaMaskAvailable()) {
      setError("MetaMask is not installed. Please install MetaMask to connect your wallet.")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      console.log("Requesting accounts from MetaMask...")
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      console.log("MetaMask accounts:", accounts)

      if (accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)
        localStorage.setItem("walletAddress", accounts[0])
        console.log("Wallet connected:", accounts[0])
      }
    } catch (err) {
      console.error("Error connecting wallet:", err)
      setError("Failed to connect wallet. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    console.log("Disconnecting wallet...")
    setAddress(null)
    setIsConnected(false)
    localStorage.removeItem("walletAddress")
    console.log("Wallet disconnected, localStorage cleared")

    // Force a page refresh to ensure clean state
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  // Don't render anything on the server
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        connect,
        disconnect,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

import { ethers } from 'ethers'

export interface AuthResult {
  success: boolean
  user?: any
  session?: any
  error?: string
}

export interface WalletAuthData {
  address: string
  signature: string
  message: string
  nonce: string
}

// Generate a nonce for wallet authentication
export function generateAuthNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Create the message that users need to sign
export function createAuthMessage(address: string, nonce: string): string {
  return `Sign this message to authenticate with 0N1 Lore Crafter.

Address: ${address}
Nonce: ${nonce}
Timestamp: ${new Date().toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.`
}

// Verify wallet signature
export function verifyWalletSignature(
  address: string, 
  message: string, 
  signature: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

// Simplified wallet authentication without Supabase Auth dependency
export async function authenticateWithWallet(authData: WalletAuthData): Promise<AuthResult> {
  try {
    // 1. Verify the signature
    if (!verifyWalletSignature(authData.address, authData.message, authData.signature)) {
      return { success: false, error: 'Invalid signature' }
    }

    // 2. Create a simple JWT token with the wallet address
    const userData = {
      id: authData.address, // Use wallet address as user ID
      wallet_address: authData.address,
      email: `${authData.address}@wallet.local`,
      auth_method: 'wallet',
      authenticated_at: Date.now()
    }

    // Create a simple token (in production, you'd want to sign this properly)
    const token = Buffer.from(JSON.stringify({
      ...userData,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64')

    return { 
      success: true, 
      user: userData,
      session: { data: { session: { access_token: token } } }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

// Get current authenticated user from localStorage
export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  
  try {
    const savedUser = localStorage.getItem("authUser")
    const savedToken = localStorage.getItem("authToken")
    
    if (!savedUser || !savedToken) return null
    
    const user = JSON.parse(savedUser)
    const decoded = JSON.parse(Buffer.from(savedToken, 'base64').toString())
    
    // Check if token is expired
    if (decoded.exp && Date.now() > decoded.exp) {
      localStorage.removeItem("authUser")
      localStorage.removeItem("authToken")
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Sign out user (client-side)
export function signOut() {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.removeItem("authToken")
    localStorage.removeItem("authUser")
    return true
  } catch (error) {
    console.error('Sign out error:', error)
    return false
  }
} 
import { NextRequest } from 'next/server'

export interface AuthenticatedUser {
  id: string
  wallet_address: string
  email?: string
}

// Simple middleware to verify JWT token and get user
export async function verifyAuthToken(request: NextRequest): Promise<{
  user: AuthenticatedUser | null
  error?: string
}> {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authentication token provided' }
    }
    
    const token = authHeader.substring(7)
    
    // Decode our simple token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // Check if token is expired
    if (decoded.exp && Date.now() > decoded.exp) {
      return { user: null, error: 'Token expired' }
    }
    
    // Verify required fields
    if (!decoded.wallet_address || !decoded.id) {
      return { user: null, error: 'Invalid token format' }
    }
    
    return {
      user: {
        id: decoded.id,
        wallet_address: decoded.wallet_address,
        email: decoded.email
      }
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { user: null, error: 'Authentication verification failed' }
  }
}

// Helper to get user ID from wallet address (fallback for existing data)
export async function getUserIdFromWallet(walletAddress: string): Promise<string | null> {
  // For now, just return the wallet address as the user ID
  // This can be enhanced later when we integrate with the database properly
  return walletAddress.toLowerCase()
} 
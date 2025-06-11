"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useWallet } from "@/components/wallet/wallet-provider"
import { useMatrica } from "@/components/wallet/matrica-provider"
import { 
  getOrCreateUser, 
  migrateLocalStorageToDatabase, 
  syncLocalStorageWithDatabase,
  checkDatabaseConnection,
  type DatabaseUser 
} from "@/lib/database"
import { isSupabaseConfigured } from "@/lib/supabase"

interface AuthContextType {
  user: DatabaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isDatabaseConnected: boolean
  migrationStatus: {
    needed: boolean
    completed: boolean
    inProgress: boolean
    result?: {
      souls: number
      memories: number
      chats: number
      success: boolean
    }
  }
  authenticateUser: () => Promise<void>
  migrateToDatabaseNow: () => Promise<void>
  syncFromDatabase: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isDatabaseConnected: false,
  migrationStatus: {
    needed: false,
    completed: false,
    inProgress: false
  },
  authenticateUser: async () => {},
  migrateToDatabaseNow: async () => {},
  syncFromDatabase: async () => {},
  error: null
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected: walletConnected } = useWallet()
  const { user: matricaUser, isConnected: matricaConnected } = useMatrica()
  
  const [user, setUser] = useState<DatabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<{
    needed: boolean
    completed: boolean
    inProgress: boolean
    result?: {
      souls: number
      memories: number
      chats: number
      success: boolean
    }
  }>({
    needed: false,
    completed: false,
    inProgress: false
  })
  const [error, setError] = useState<string | null>(null)

  // Check database connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (isSupabaseConfigured()) {
        const connected = await checkDatabaseConnection()
        setIsDatabaseConnected(connected)
      }
    }
    checkConnection()
  }, [])

  // Authenticate user when wallet/matrica connects
  useEffect(() => {
    if ((walletConnected && address) || (matricaConnected && matricaUser)) {
      authenticateUser()
    } else {
      setUser(null)
    }
  }, [walletConnected, address, matricaConnected, matricaUser])

  const authenticateUser = async () => {
    if (!isDatabaseConnected) {
      console.log('Database not connected, using localStorage only')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let walletAddress: string | undefined
      let matricaId: string | undefined
      let username: string | undefined

      // Get authentication data from wallet or matrica
      if (walletConnected && address) {
        walletAddress = address
      }
      
      if (matricaConnected && matricaUser) {
        matricaId = matricaUser.id
        username = matricaUser.username
      }

      if (!walletAddress && !matricaId) {
        throw new Error('No wallet or Matrica connection found')
      }

      // Get or create user in database
      const dbUser = await getOrCreateUser(walletAddress, matricaId, username)
      
      if (dbUser) {
        setUser(dbUser)
        
        // Check if migration is needed
        const hasLocalData = checkForLocalStorageData()
        if (hasLocalData && !localStorage.getItem('migration_completed')) {
          setMigrationStatus(prev => ({ ...prev, needed: true }))
        }
        
        console.log('User authenticated:', dbUser.username || dbUser.wallet_address)
      } else {
        throw new Error('Failed to authenticate user')
      }
    } catch (err: any) {
      console.error('Authentication error:', err)
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const checkForLocalStorageData = (): boolean => {
    if (typeof window === 'undefined') return false
    
    const localSouls = localStorage.getItem('oni-souls')
    const localMemories = localStorage.getItem('ai_agent_memories')
    const localChats = localStorage.getItem('oni-chat-archives')
    
    return !!(localSouls || localMemories || localChats)
  }

  const migrateToDatabaseNow = async () => {
    if (!user || !isDatabaseConnected) {
      setError('Cannot migrate: user not authenticated or database not connected')
      return
    }

    setMigrationStatus(prev => ({ ...prev, inProgress: true }))
    setError(null)

    try {
      const result = await migrateLocalStorageToDatabase(user.id)
      
      setMigrationStatus({
        needed: false,
        completed: true,
        inProgress: false,
        result
      })

      // Mark migration as completed
      localStorage.setItem('migration_completed', 'true')
      
      console.log('Migration completed:', result)
    } catch (err: any) {
      console.error('Migration error:', err)
      setError(err.message || 'Migration failed')
      setMigrationStatus(prev => ({ ...prev, inProgress: false }))
    }
  }

  const syncFromDatabase = async () => {
    if (!user || !isDatabaseConnected) {
      setError('Cannot sync: user not authenticated or database not connected')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await syncLocalStorageWithDatabase(user.id)
      console.log('Successfully synced from database')
    } catch (err: any) {
      console.error('Sync error:', err)
      setError(err.message || 'Sync failed')
    } finally {
      setIsLoading(false)
    }
  }

  const isAuthenticated = !!(user && (walletConnected || matricaConnected))

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isDatabaseConnected,
        migrationStatus,
        authenticateUser,
        migrateToDatabaseNow,
        syncFromDatabase,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  )
} 
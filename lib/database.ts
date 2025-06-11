import { supabase, isSupabaseConfigured } from './supabase'
import type { CharacterData } from './types'
import type { StoredSoul } from './storage'
import type { ConversationMemory } from './memory'
import type { ArchivedChat } from './chat-archive'

// Types for database operations
export interface DatabaseUser {
  id: string
  wallet_address?: string
  matrica_id?: string
  username?: string
  created_at: string
  updated_at: string
  last_seen?: string
}

export interface DatabaseSoul {
  id: string
  user_id: string
  nft_id: string
  soul_name: string
  archetype?: string
  background_story?: string
  personality?: any
  powers_abilities?: any
  lore_depth?: string
  creation_timestamp: string
  last_updated: string
  data: CharacterData
  is_public: boolean
  view_count: number
}

// Authentication helpers
export async function getOrCreateUser(
  walletAddress?: string,
  matricaId?: string,
  username?: string
): Promise<DatabaseUser | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, falling back to localStorage')
    return null
  }

  try {
    const { data, error } = await supabase.rpc('get_or_create_user', {
      p_wallet_address: walletAddress || null,
      p_matrica_id: matricaId || null,
      p_username: username || null
    })

    if (error) {
      console.error('Error getting/creating user:', error)
      return null
    }

    // Fetch the user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return null
    }

    return userData
  } catch (error) {
    console.error('Error in getOrCreateUser:', error)
    return null
  }
}

// Soul operations
export async function saveSoulToDatabase(
  characterData: CharacterData,
  userId: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot save to database')
    return null
  }

  try {
    const soulData = {
      user_id: userId,
      nft_id: characterData.pfpId,
      soul_name: characterData.soulName || `Soul ${characterData.pfpId}`,
      archetype: characterData.archetype,
      background_story: characterData.background,
      personality: characterData.personalityProfile,
      powers_abilities: characterData.powersAbilities,
      lore_depth: null, // This property doesn't exist in CharacterData
      data: characterData,
      is_public: false,
      view_count: 0
    }

    const { data, error } = await supabase
      .from('souls')
      .upsert(soulData, { onConflict: 'user_id,nft_id' })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving soul to database:', error)
      return null
    }

    // Track analytics
    await trackUserEvent(userId, 'soul_saved', { nft_id: characterData.pfpId })

    return data.id
  } catch (error) {
    console.error('Error in saveSoulToDatabase:', error)
    return null
  }
}

export async function getSoulsFromDatabase(userId: string): Promise<DatabaseSoul[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('souls')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false })

    if (error) {
      console.error('Error fetching souls from database:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getSoulsFromDatabase:', error)
    return []
  }
}

export async function deleteSoulFromDatabase(soulId: string, authToken?: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    // Use authenticated client if token provided
    if (authToken) {
      await supabase.auth.setSession({ access_token: authToken, refresh_token: '' })
    }

    const { error } = await supabase
      .from('souls')
      .delete()
      .eq('id', soulId)
      // RLS policy will automatically filter by authenticated user

    if (error) {
      console.error('Error deleting soul from database:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteSoulFromDatabase:', error)
    return false
  }
}

// Memory operations
export async function saveMemoryToDatabase(
  userId: string,
  soulId: string,
  memoryType: 'conversation' | 'key_memory' | 'context_note',
  content: string,
  metadata?: any
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('memories')
      .insert({
        user_id: userId,
        soul_id: soulId,
        memory_type: memoryType,
        content,
        metadata
      })

    if (error) {
      console.error('Error saving memory to database:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in saveMemoryToDatabase:', error)
    return false
  }
}

// Chat archive operations
export async function saveChatArchiveToDatabase(
  userId: string,
  soulId: string,
  chatData: ArchivedChat
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('chat_archives')
      .insert({
        id: chatData.id,
        user_id: userId,
        soul_id: soulId,
        title: chatData.title,
        summary: chatData.summary,
        message_count: chatData.messageCount,
        conversation_duration: chatData.conversationDuration,
        key_topics: chatData.keyTopics,
        messages: chatData.messages,
        memory_segments: chatData.savedMemorySegments,
        metadata: chatData.metadata
      })

    if (error) {
      console.error('Error saving chat archive to database:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in saveChatArchiveToDatabase:', error)
    return false
  }
}

// Analytics
export async function trackUserEvent(
  userId: string,
  eventType: string,
  eventData?: any
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return
  }

  try {
    await supabase
      .from('user_analytics')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData
      })
  } catch (error) {
    console.error('Error tracking user event:', error)
  }
}

// Migration helpers
export async function migrateLocalStorageToDatabase(userId: string): Promise<{
  souls: number,
  memories: number,
  chats: number,
  success: boolean
}> {
  if (!isSupabaseConfigured()) {
    return { souls: 0, memories: 0, chats: 0, success: false }
  }

  let migratedSouls = 0
  let migratedMemories = 0
  let migratedChats = 0

  try {
    // Import localStorage functions dynamically to avoid SSR issues
    const { getStoredSouls } = await import('./storage')
    const { exportChatData } = await import('./chat-archive')
    
    // Migrate souls
    const localSouls = getStoredSouls()
    for (const soul of localSouls) {
      const soulId = await saveSoulToDatabase(soul.data, userId)
      if (soulId) {
        migratedSouls++
      }
    }

    // Migrate chat data
    const chatData = exportChatData()
    if (chatData.chats) {
      for (const chat of chatData.chats) {
        // Find corresponding soul ID in database
        const { data: soulData } = await supabase
          .from('souls')
          .select('id')
          .eq('user_id', userId)
          .eq('nft_id', chat.characterId)
          .single()

        if (soulData) {
          const success = await saveChatArchiveToDatabase(userId, soulData.id, chat)
          if (success) {
            migratedChats++
          }
        }
      }
    }

    // Track migration event
    await trackUserEvent(userId, 'localStorage_migration', {
      souls: migratedSouls,
      memories: migratedMemories,
      chats: migratedChats
    })

    return {
      souls: migratedSouls,
      memories: migratedMemories,
      chats: migratedChats,
      success: true
    }
  } catch (error) {
    console.error('Error migrating localStorage to database:', error)
    return { souls: 0, memories: 0, chats: 0, success: false }
  }
}

// Public souls (for discovery)
export async function getPublicSouls(limit: number = 20): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('public_souls')
      .select('*')
      .limit(limit)

    if (error) {
      console.error('Error fetching public souls:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPublicSouls:', error)
    return []
  }
}

// Backup/Sync utilities
export async function syncLocalStorageWithDatabase(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    // Get souls from database
    const dbSouls = await getSoulsFromDatabase(userId)
    
    // Update localStorage with database data
    const { storeSoul } = await import('./storage')
    
    for (const dbSoul of dbSouls) {
      storeSoul(dbSoul.data)
    }

    console.log(`Synced ${dbSouls.length} souls from database to localStorage`)
    return true
  } catch (error) {
    console.error('Error syncing localStorage with database:', error)
    return false
  }
}

// Health check
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    return !error
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
} 
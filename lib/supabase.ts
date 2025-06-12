import { createClient } from '@supabase/supabase-js'

// Client-side environment variables (available in browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side only environment variables
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if Supabase is properly configured
const isConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'placeholder' && supabaseAnonKey !== 'placeholder' &&
  supabaseUrl.startsWith('https://'))

// Validate required environment variables
if (!isConfigured) {
  console.warn('Supabase environment variables not found or are placeholders. Supabase functionality will be disabled.')
}

// Create clients only if properly configured
let supabase: any = null
let supabaseAdmin: any = null

if (isConfigured) {
  try {
    // Regular client for client-side operations (safe to use in browser)
    supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Admin client for server-side operations that need elevated permissions
    // This should only be used on the server side
    if (typeof window === 'undefined' && supabaseServiceRoleKey && supabaseServiceRoleKey !== 'placeholder') {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    }
  } catch (error) {
    console.error('Error creating Supabase clients:', error)
    supabase = null
    supabaseAdmin = null
  }
} else {
  // Create mock clients that will gracefully fail
  const mockClient = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      eq: function() { return this },
      single: function() { return this },
      order: function() { return this }
    })
  }
  
  supabase = mockClient
  supabaseAdmin = mockClient
}

export { supabase, supabaseAdmin }

// Database types for TypeScript support
export interface Database {
  public: {
    Tables: {
      character_souls: {
        Row: {
          id: string
          nft_id: string
          wallet_address: string
          character_name: string | null
          archetype: string | null
          background: string | null
          personality_data: any
          traits: any
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nft_id: string
          wallet_address: string
          character_name?: string | null
          archetype?: string | null
          background?: string | null
          personality_data: any
          traits: any
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nft_id?: string
          wallet_address?: string
          character_name?: string | null
          archetype?: string | null
          background?: string | null
          personality_data?: any
          traits?: any
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversation_memory: {
        Row: {
          id: string
          nft_id: string
          wallet_address: string
          character_name: string | null
          messages: any
          key_memories: any
          user_profile: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nft_id: string
          wallet_address: string
          character_name?: string | null
          messages?: any
          key_memories?: any
          user_profile?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nft_id?: string
          wallet_address?: string
          character_name?: string | null
          messages?: any
          key_memories?: any
          user_profile?: any
          created_at?: string
          updated_at?: string
        }
      }
      memory_segments: {
        Row: {
          id: string
          nft_id: string
          wallet_address: string
          message_id: string | null
          text_content: string
          start_index: number | null
          end_index: number | null
          tags: any
          importance: number | null
          created_at: string
        }
        Insert: {
          id?: string
          nft_id: string
          wallet_address: string
          message_id?: string | null
          text_content: string
          start_index?: number | null
          end_index?: number | null
          tags?: any
          importance?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          nft_id?: string
          wallet_address?: string
          message_id?: string | null
          text_content?: string
          start_index?: number | null
          end_index?: number | null
          tags?: any
          importance?: number | null
          created_at?: string
        }
      }
      chat_archives: {
        Row: {
          id: string
          character_id: string
          wallet_address: string
          character_name: string | null
          title: string | null
          summary: string | null
          messages: any
          memory_segments: any
          metadata: any
          session_start: string | null
          session_end: string | null
          message_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          character_id: string
          wallet_address: string
          character_name?: string | null
          title?: string | null
          summary?: string | null
          messages: any
          memory_segments?: any
          metadata?: any
          session_start?: string | null
          session_end?: string | null
          message_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          wallet_address?: string
          character_name?: string | null
          title?: string | null
          summary?: string | null
          messages?: any
          memory_segments?: any
          metadata?: any
          session_start?: string | null
          session_end?: string | null
          message_count?: number | null
          created_at?: string
        }
      }
      memory_profiles: {
        Row: {
          id: string
          nft_id: string
          wallet_address: string
          context_entries: any
          tag_management: any
          character_evolution: any
          overview_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nft_id: string
          wallet_address: string
          context_entries?: any
          tag_management?: any
          character_evolution?: any
          overview_data?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nft_id?: string
          wallet_address?: string
          context_entries?: any
          tag_management?: any
          character_evolution?: any
          overview_data?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Database types
export interface Soul {
  id: string
  nft_id: string
  wallet_address: string
  collection: 'force' | 'frame'
  data: {
    pfpId: string
    name: string
    traits: Record<string, any>
    personality: Record<string, any>
    backstory: string
    motivations: string[]
    hopes: string[]
    fears: string[]
    relationships: Record<string, any>
    summary?: string
  }
  created_at: string
  updated_at: string
}

export interface NFTMetadata {
  id: string
  nft_id: string
  collection: 'force' | 'frame'
  name: string
  image_url: string
  traits: Record<string, any>
  contract_address: string
  cached_at: string
}

// Utility function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return isConfigured
} 
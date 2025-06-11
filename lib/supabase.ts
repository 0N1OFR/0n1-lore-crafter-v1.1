import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database Types (generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string | null
          matrica_id: string | null
          username: string | null
          created_at: string
          updated_at: string
          last_seen: string | null
        }
        Insert: {
          id?: string
          wallet_address?: string | null
          matrica_id?: string | null
          username?: string | null
          created_at?: string
          updated_at?: string
          last_seen?: string | null
        }
        Update: {
          id?: string
          wallet_address?: string | null
          matrica_id?: string | null
          username?: string | null
          created_at?: string
          updated_at?: string
          last_seen?: string | null
        }
      }
      souls: {
        Row: {
          id: string
          user_id: string
          nft_id: string
          soul_name: string
          archetype: string | null
          background_story: string | null
          personality: any | null // JSON
          powers_abilities: any | null // JSON
          lore_depth: string | null
          creation_timestamp: string
          last_updated: string
          data: any // Full character data JSON
          is_public: boolean
          view_count: number
        }
        Insert: {
          id?: string
          user_id: string
          nft_id: string
          soul_name: string
          archetype?: string | null
          background_story?: string | null
          personality?: any | null
          powers_abilities?: any | null
          lore_depth?: string | null
          creation_timestamp?: string
          last_updated?: string
          data: any
          is_public?: boolean
          view_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          nft_id?: string
          soul_name?: string
          archetype?: string | null
          background_story?: string | null
          personality?: any | null
          powers_abilities?: any | null
          lore_depth?: string | null
          creation_timestamp?: string
          last_updated?: string
          data?: any
          is_public?: boolean
          view_count?: number
        }
      }
      memories: {
        Row: {
          id: string
          user_id: string
          soul_id: string
          memory_type: 'conversation' | 'key_memory' | 'context_note'
          content: string
          metadata: any | null // JSON
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          soul_id: string
          memory_type: 'conversation' | 'key_memory' | 'context_note'
          content: string
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          soul_id?: string
          memory_type?: 'conversation' | 'key_memory' | 'context_note'
          content?: string
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_archives: {
        Row: {
          id: string
          user_id: string
          soul_id: string
          title: string
          summary: string | null
          message_count: number
          conversation_duration: number
          key_topics: string[] | null
          messages: any // JSON
          memory_segments: any | null // JSON
          metadata: any | null // JSON
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          soul_id: string
          title: string
          summary?: string | null
          message_count: number
          conversation_duration: number
          key_topics?: string[] | null
          messages: any
          memory_segments?: any | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          soul_id?: string
          title?: string
          summary?: string | null
          message_count?: number
          conversation_duration?: number
          key_topics?: string[] | null
          messages?: any
          memory_segments?: any | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          event_type: string
          event_data: any | null // JSON
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          event_data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          event_data?: any | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Create typed client
export const supabaseTyped = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== 'your-supabase-url' && 
           supabaseAnonKey !== 'your-anon-key')
}

// Auth helpers
export const auth = supabase.auth 
import type { CharacterData } from "./types"

export interface StoredSoul {
  id: string
  createdAt: string
  lastUpdated: string
  data: CharacterData
  wallet_address?: string
} 
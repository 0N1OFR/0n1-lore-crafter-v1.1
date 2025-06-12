import type { CharacterData } from "./types"
import { supabase, type Soul } from './supabase'

// Soul management functions using Supabase
export async function saveSoul(soulData: any, walletAddress: string): Promise<boolean> {
  try {
    const soul: Omit<Soul, 'id' | 'created_at' | 'updated_at'> = {
      nft_id: soulData.data.pfpId,
      wallet_address: walletAddress.toLowerCase(),
      collection: soulData.data.collection || 'force',
      data: soulData.data
    }

    const { error } = await supabase
      .from('souls')
      .upsert(soul, { 
        onConflict: 'nft_id,collection',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error saving soul to Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in saveSoul:', error)
    return false
  }
}

export async function getSoul(nftId: string, collection: 'force' | 'frame' = 'force'): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('souls')
      .select('*')
      .eq('nft_id', nftId)
      .eq('collection', collection)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - soul doesn't exist
        return null
      }
      console.error('Error fetching soul from Supabase:', error)
      return null
    }

    return data ? { data: data.data } : null
  } catch (error) {
    console.error('Error in getSoul:', error)
    return null
  }
}

export async function getAllSouls(walletAddress?: string): Promise<any[]> {
  try {
    let query = supabase.from('souls').select('*')
    
    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress.toLowerCase())
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching souls from Supabase:', error)
      return []
    }

    return data?.map(soul => ({ data: soul.data })) || []
  } catch (error) {
    console.error('Error in getAllSouls:', error)
    return []
  }
}

export async function deleteSoulFromDB(nftId: string, collection: 'force' | 'frame' = 'force'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('souls')
      .delete()
      .eq('nft_id', nftId)
      .eq('collection', collection)

    if (error) {
      console.error('Error deleting soul from Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteSoulFromDB:', error)
    return false
  }
}

export async function soulExistsInDB(nftId: string, collection: 'force' | 'frame' = 'force'): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('souls')
      .select('id')
      .eq('nft_id', nftId)
      .eq('collection', collection)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - soul doesn't exist
        return false
      }
      console.error('Error checking soul existence:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in soulExistsInDB:', error)
    return false
  }
}

// NFT Metadata caching functions
export async function cacheNFTMetadata(nftId: string, collection: 'force' | 'frame', metadata: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('nft_metadata')
      .upsert({
        nft_id: nftId,
        collection,
        name: metadata.name,
        image_url: metadata.image_url,
        traits: metadata.traits || {},
        contract_address: metadata.contract_address
      }, { 
        onConflict: 'nft_id,collection',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error caching NFT metadata:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in cacheNFTMetadata:', error)
    return false
  }
}

export async function getCachedNFTMetadata(nftId: string, collection: 'force' | 'frame'): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('nft_metadata')
      .select('*')
      .eq('nft_id', nftId)
      .eq('collection', collection)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching cached NFT metadata:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getCachedNFTMetadata:', error)
    return null
  }
}

// Character data management (async versions)
export async function saveCharacterData(characterData: CharacterData, walletAddress: string): Promise<boolean> {
  try {
    const soulData = {
      data: characterData,
      timestamp: Date.now()
    }
    return await saveSoul(soulData, walletAddress)
  } catch (error) {
    console.error("Error saving character data:", error)
    return false
  }
}

export async function getCharacterData(pfpId: string, collection: 'force' | 'frame' = 'force'): Promise<CharacterData | null> {
  try {
    const soul = await getSoul(pfpId, collection)
    return soul ? soul.data : null
  } catch (error) {
    console.error("Error getting character data:", error)
    return null
  }
}

export async function getAllCharacterData(walletAddress?: string): Promise<CharacterData[]> {
  try {
    const souls = await getAllSouls(walletAddress)
    return souls.map(soul => soul.data).filter(Boolean)
  } catch (error) {
    console.error("Error getting all character data:", error)
    return []
  }
}

export async function deleteCharacterData(pfpId: string, collection: 'force' | 'frame' = 'force'): Promise<boolean> {
  try {
    return await deleteSoulFromDB(pfpId, collection)
  } catch (error) {
    console.error("Error deleting character data:", error)
    return false
  }
}

export async function characterDataExists(pfpId: string, collection: 'force' | 'frame' = 'force'): Promise<boolean> {
  try {
    return await soulExistsInDB(pfpId, collection)
  } catch (error) {
    console.error("Error checking if character data exists:", error)
    return false
  }
}

// Utility functions
export async function getSoulCount(walletAddress?: string): Promise<number> {
  try {
    const souls = await getAllSouls(walletAddress)
    return souls.length
  } catch (error) {
    console.error('Error getting soul count:', error)
    return 0
  }
}

// Add missing function aliases for backward compatibility
export const getSoulByNftId = getSoul
export const storeSoul = saveSoul
export const soulExistsForNft = soulExistsInDB
export const getStoredSouls = getAllSouls 
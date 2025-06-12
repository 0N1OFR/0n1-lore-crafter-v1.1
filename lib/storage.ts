import type { CharacterData } from "./types"
import { supabase, type Soul } from './supabase'

// Check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && url !== 'placeholder' && key !== 'placeholder')
}

// localStorage fallback functions
function getFromLocalStorage(key: string): any {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return null
  }
}

function saveToLocalStorage(key: string, data: any): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error saving to localStorage:', error)
    return false
  }
}

function removeFromLocalStorage(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error removing from localStorage:', error)
    return false
  }
}

// Generate localStorage keys
function getSoulKey(nftId: string, collection: 'force' | 'frame' = 'force'): string {
  return `soul_${collection}_${nftId}`
}

function getWalletSoulsKey(walletAddress: string): string {
  return `wallet_souls_${walletAddress.toLowerCase()}`
}

// Soul management functions with localStorage fallback
export async function saveSoul(soulData: any, walletAddress: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.log('📦 Using localStorage: Saving soul locally')
    // Save to localStorage
    const key = getSoulKey(soulData.data.pfpId, soulData.data.collection || 'force')
    const success = saveToLocalStorage(key, {
      ...soulData,
      wallet_address: walletAddress.toLowerCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    if (success) {
      // Update wallet's soul list
      const walletKey = getWalletSoulsKey(walletAddress)
      const existingSouls = getFromLocalStorage(walletKey) || []
      const soulIndex = existingSouls.findIndex((s: any) => 
        s.nft_id === soulData.data.pfpId && s.collection === (soulData.data.collection || 'force')
      )
      
      if (soulIndex >= 0) {
        existingSouls[soulIndex] = { nft_id: soulData.data.pfpId, collection: soulData.data.collection || 'force' }
      } else {
        existingSouls.push({ nft_id: soulData.data.pfpId, collection: soulData.data.collection || 'force' })
      }
      
      saveToLocalStorage(walletKey, existingSouls)
    }
    
    return success
  }
  
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
  if (!isSupabaseConfigured()) {
    console.log('📦 Using localStorage: Getting soul locally')
    const key = getSoulKey(nftId, collection)
    return getFromLocalStorage(key)
  }
  
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
  if (!isSupabaseConfigured()) {
    console.log('📦 Using localStorage: Getting all souls locally')
    if (!walletAddress) return []
    
    const walletKey = getWalletSoulsKey(walletAddress)
    const soulList = getFromLocalStorage(walletKey) || []
    
    const souls = []
    for (const soulRef of soulList) {
      const soulKey = getSoulKey(soulRef.nft_id, soulRef.collection || 'force')
      const soulData = getFromLocalStorage(soulKey)
      if (soulData) {
        souls.push(soulData)
      }
    }
    
    return souls.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }
  
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
  if (!isSupabaseConfigured()) {
    console.log('📦 Using localStorage: Deleting soul locally')
    const key = getSoulKey(nftId, collection)
    return removeFromLocalStorage(key)
  }
  
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
  if (!isSupabaseConfigured()) {
    console.log('📦 Using localStorage: Checking soul existence locally')
    const key = getSoulKey(nftId, collection)
    return !!getFromLocalStorage(key)
  }
  
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
  if (!isSupabaseConfigured()) {
    console.log('📦 Using localStorage: Caching NFT metadata locally')
    const key = `nft_metadata_${collection}_${nftId}`
    return saveToLocalStorage(key, {
      ...metadata,
      cached_at: new Date().toISOString()
    })
  }
  
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
  if (!isSupabaseConfigured()) {
    console.log('📦 Using localStorage: Getting cached NFT metadata locally')
    const key = `nft_metadata_${collection}_${nftId}`
    return getFromLocalStorage(key)
  }
  
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
    console.error("Error checking character data existence:", error)
    return false
  }
}

export async function getSoulCount(walletAddress?: string): Promise<number> {
  try {
    const souls = await getAllSouls(walletAddress)
    return souls.length
  } catch (error) {
    console.error("Error getting soul count:", error)
    return 0
  }
}

// Storage info utility
export function getStorageInfo(): { type: 'localStorage' | 'supabase', configured: boolean } {
  const configured = isSupabaseConfigured()
  return {
    type: configured ? 'supabase' : 'localStorage',
    configured
  }
}

// Export aliases for backward compatibility
export const storeSoul = saveSoul
export const getSoulByNftId = getSoul
export const soulExistsForNft = soulExistsInDB
export const getStoredSouls = getAllSouls 
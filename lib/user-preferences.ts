import { CollectionKey } from './collection-config'

const PREFERENCES_KEY = 'on1-character-preferences'

interface CharacterPreferences {
  [tokenId: string]: CollectionKey
}

// Get user preferences from localStorage
export function getUserPreferences(): CharacterPreferences {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.warn('Failed to load user preferences:', error)
    return {}
  }
}

// Save user preferences to localStorage
export function saveUserPreferences(preferences: CharacterPreferences): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  } catch (error) {
    console.warn('Failed to save user preferences:', error)
  }
}

// Get preferred view for a specific character
export function getCharacterPreference(tokenId: string): CollectionKey {
  const preferences = getUserPreferences()
  return preferences[tokenId] || 'force' // Default to Force
}

// Set preferred view for a specific character
export function setCharacterPreference(tokenId: string, collection: CollectionKey): void {
  const preferences = getUserPreferences()
  preferences[tokenId] = collection
  saveUserPreferences(preferences)
}

// Clear all preferences (useful for testing or reset)
export function clearAllPreferences(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(PREFERENCES_KEY)
  } catch (error) {
    console.warn('Failed to clear user preferences:', error)
  }
}

// Hook for React components to manage preferences
export function useCharacterPreference(tokenId: string) {
  const getPreference = () => getCharacterPreference(tokenId)
  
  const setPreference = (collection: CollectionKey) => {
    setCharacterPreference(tokenId, collection)
  }
  
  return {
    preference: getPreference(),
    setPreference
  }
} 
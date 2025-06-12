"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Play, Edit } from "lucide-react"
import { SafeNftImage } from "@/components/safe-nft-image"
import { Button } from "@/components/ui/button"
import { UnifiedCharacter } from "@/lib/types"
import { CollectionKey } from "@/lib/collection-config"
import { CollectionBadge } from "@/components/collection-badge"
import { CharacterToggle } from "@/components/character-toggle"
import { getCharacterPreference, setCharacterPreference } from "@/lib/user-preferences"
import { soulExistsInDB } from "@/lib/storage"

interface UnifiedCharacterCardProps {
  character: UnifiedCharacter
  onSelectNft: (tokenId: string) => void
  onShowTraits: (tokenId: string, imageUrl: string | null) => void
  onEditProfile: (tokenId: string) => void
  selectedNftId?: string | null
  isLoading?: boolean
}

export function UnifiedCharacterCard({
  character,
  onSelectNft,
  onShowTraits,
  onEditProfile,
  selectedNftId,
  isLoading: externalLoading
}: UnifiedCharacterCardProps) {
  // State for current view (Force or Frame)
  const [currentView, setCurrentView] = useState<CollectionKey>('force')
  const [isImageLoading, setIsImageLoading] = useState(false)
  
  // Check if this character has a soul
  const [hasSoul, setHasSoul] = useState(false)
  
  // Check soul existence on mount
  useEffect(() => {
    const checkSoul = async () => {
      const exists = await soulExistsInDB(character.tokenId, 'force')
      setHasSoul(exists)
    }
    checkSoul()
  }, [character.tokenId])
  
  // Determine what collections this character has
  const ownedCollections: CollectionKey[] = []
  if (character.hasForce) ownedCollections.push('force')
  if (character.hasFrame) ownedCollections.push('frame')
  
  // Determine if toggle should be shown (only when both collections exist)
  const showToggle = character.hasForce && character.hasFrame
  
  // Initialize view preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = getCharacterPreference(character.tokenId)
      // Only use saved preference if the character actually has that collection
      if (savedPreference === 'force' && character.hasForce) {
        setCurrentView('force')
      } else if (savedPreference === 'frame' && character.hasFrame) {
        setCurrentView('frame')
      } else {
        // Default logic: Force first, then Frame if Force not available
        setCurrentView(character.hasForce ? 'force' : 'frame')
      }
    }
  }, [character.tokenId, character.hasForce, character.hasFrame])
  
  // Get current image URL based on view
  const getCurrentImageUrl = (): string | null => {
    if (currentView === 'frame' && character.frameImageUrl) {
      return character.frameImageUrl
    }
    if (character.forceImageUrl) {
      return character.forceImageUrl
    }
    return character.frameImageUrl // Fallback to frame if force not available
  }
  
  // Handle toggle between Force and Frame
  const handleToggle = (newView: CollectionKey) => {
    // Only allow toggle if the character has that collection
    if (newView === 'force' && !character.hasForce) return
    if (newView === 'frame' && !character.hasFrame) return
    
    setIsImageLoading(true)
    setCurrentView(newView)
    setCharacterPreference(character.tokenId, newView)
    
    // Simulate image loading delay for smooth transition
    setTimeout(() => setIsImageLoading(false), 300)
  }
  
  // Event handlers
  const handleStartLore = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectNft(character.tokenId)
  }
  
  const handleEditProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEditProfile(character.tokenId)
  }
  
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onShowTraits(character.tokenId, getCurrentImageUrl())
  }
  
  const currentImageUrl = getCurrentImageUrl()
  
  return (
    <Card
      className={`border ${
        hasSoul
          ? "border-yellow-400/70 hover:border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
          : "border-purple-500/30 hover:border-purple-400"
      } bg-black/60 backdrop-blur-sm overflow-hidden transition-all duration-300 group transform hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] relative`}
    >
      {/* Collection Badges */}
      <div className="absolute top-2 left-2 z-30 flex gap-1">
        {ownedCollections.map((collection) => (
          <CollectionBadge key={collection} collection={collection} />
        ))}
      </div>
      
      {/* Soul Indicator */}
      {hasSoul && (
        <div className="absolute top-2 right-2 z-30 bg-yellow-500/80 rounded-full p-1 shadow-lg">
          <Sparkles className="h-4 w-4 text-black" />
        </div>
      )}
      
      {/* Complete Set Indicator */}
      {character.hasForce && character.hasFrame && (
        <div className="absolute top-10 right-2 z-30 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full px-2 py-1 shadow-lg">
          <span className="text-xs font-semibold text-white">✨ Complete Set</span>
        </div>
      )}
      
      {/* NFT Image - Click to show traits */}
      <div 
        className="aspect-square relative overflow-hidden cursor-pointer"
        onClick={handleImageClick}
      >
        <div
          className={`absolute inset-0 ${
            hasSoul
              ? "bg-yellow-500/5 group-hover:bg-yellow-500/10"
              : "bg-purple-500/0 group-hover:bg-purple-500/10"
          } transition-all duration-300 z-10`}
        />
        
        {/* Image with loading state */}
        <div className={`transition-opacity duration-300 ${isImageLoading ? 'opacity-50' : 'opacity-100'}`}>
          <SafeNftImage
            src={currentImageUrl}
            alt={`${character.displayName} - ${currentView === 'force' ? 'Force' : 'Frame'}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        
        {/* Loading overlay */}
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-2 z-20">
          <Button
            size="sm"
            onClick={handleStartLore}
            className="flex-1 bg-purple-600/90 hover:bg-purple-600 text-white text-xs py-1 px-2 h-8"
            disabled={externalLoading && selectedNftId === character.tokenId}
          >
            {externalLoading && selectedNftId === character.tokenId ? (
              <>
                <Play className="h-3 w-3 mr-1 animate-pulse" />
                Loading...
              </>
            ) : hasSoul ? (
              <>
                <Edit className="h-3 w-3 mr-1" />
                Edit Soul
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Create Soul
              </>
            )}
          </Button>
          
          {hasSoul && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleEditProfile}
              className="bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-white text-xs py-1 px-2 h-8"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-3">
        {/* Character Name */}
        <p
          className={`text-center font-medium ${
            hasSoul
              ? "text-yellow-200 group-hover:text-yellow-100"
              : "text-purple-200 group-hover:text-white"
          } transition-colors duration-300`}
        >
          {character.displayName}
        </p>
        
        {/* Current View Indicator */}
        <p className="text-xs text-center text-gray-400 mt-1">
          Viewing {currentView === 'force' ? 'Force' : 'Frame'}
        </p>
        
        {/* Toggle Button - Only show when both collections exist */}
        {showToggle && (
          <div className="mt-3 flex justify-center">
            <CharacterToggle
              currentView={currentView}
              onToggle={handleToggle}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
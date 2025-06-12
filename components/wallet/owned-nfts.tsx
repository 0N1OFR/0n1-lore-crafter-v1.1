"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertTriangle, ExternalLink } from "lucide-react"
import { useWallet } from "@/components/wallet/wallet-provider"
import type { UnifiedCharacter } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { UnifiedCharacterCard } from "@/components/unified-character-card"

interface OwnedNftsProps {
  onSelectNft: (tokenId: string) => void
  onShowTraits: (tokenId: string, imageUrl: string | null) => void
  selectedNftId?: string | null
  isLoading?: boolean
}

export function OwnedNfts({ onSelectNft, onShowTraits, selectedNftId, isLoading: externalLoading }: OwnedNftsProps) {
  const { address, isConnected } = useWallet()
  const [unifiedCharacters, setUnifiedCharacters] = useState<UnifiedCharacter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function loadUnifiedCharacters() {
      if (!address || !isConnected) return

      setIsLoading(true)
      setError("")

      try {
        console.log("Fetching unified characters for address:", address)
        // Call our unified characters API
        const response = await fetch(`/api/opensea/owned?address=${address}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch owned characters")
        }

        const data = await response.json()
        console.log("Unified characters API response:", data)

        // The API now returns unified characters directly
        const characters = data.characters || []
        console.log("Processed characters:", characters)
        setUnifiedCharacters(characters)
      } catch (err) {
        console.error("Error fetching unified characters:", err)
        setError(`Failed to load your 0N1 characters: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadUnifiedCharacters()
  }, [address, isConnected])

  const handleStartLore = (tokenId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectNft(tokenId)
  }

  const handleEditProfile = (tokenId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/agent/${tokenId}`)
  }

  const handleImageClick = (tokenId: string, imageUrl: string | null, e: React.MouseEvent) => {
    e.stopPropagation()
    onShowTraits(tokenId, imageUrl)
  }

  if (!isConnected) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-2 text-purple-300">Loading your 0N1 characters...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-950/30 border border-red-500/50 text-red-200 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            <p className="text-sm mt-1">Check the browser console for more details.</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm">Please try refreshing the page.</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => window.open("https://opensea.io/collection/0n1-force", "_blank")}
          >
            View on OpenSea <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  if (unifiedCharacters.length === 0) {
    return (
      <Card className="border border-purple-500/30 bg-black/60 backdrop-blur-sm">
        <CardContent className="p-6">
          <p className="text-center text-purple-300 mb-4">No 0N1 characters found in your wallet.</p>
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://opensea.io/collection/0n1-force", "_blank")}
            >
              View 0N1 Force <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://opensea.io/collection/0n1-frame", "_blank")}
            >
              View 0N1 Frame <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleEditProfileWrapper = (tokenId: string) => {
    router.push(`/agent/${tokenId}`)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-purple-300">Your 0N1 Characters</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {unifiedCharacters.map((character) => (
          <UnifiedCharacterCard
            key={character.tokenId}
            character={character}
            onSelectNft={onSelectNft}
            onShowTraits={onShowTraits}
            onEditProfile={handleEditProfileWrapper}
            selectedNftId={selectedNftId}
            isLoading={externalLoading}
          />
        ))}
      </div>
    </div>
  )
}

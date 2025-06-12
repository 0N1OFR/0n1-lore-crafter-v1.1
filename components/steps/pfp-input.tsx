"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { fetchNftDataWithFallback, getOpenSeaNftLink } from "@/lib/api"
import type { CharacterData, Trait } from "@/lib/types"
import { ExternalLink, AlertTriangle, User } from "lucide-react"
import Link from "next/link"
import { SafeNftImage } from "@/components/safe-nft-image"
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button"
import { OwnedNfts } from "@/components/wallet/owned-nfts"
import { useWallet } from "@/components/wallet/wallet-provider"
import { soulExistsInDB } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { NftTraitsSidebar } from "@/components/nft-traits-sidebar"

interface PfpInputProps {
  characterData: CharacterData
  updateCharacterData: (data: Partial<CharacterData>) => void
  nextStep: () => void
}

export function PfpInput({ characterData, updateCharacterData, nextStep }: PfpInputProps) {
  const [pfpId, setPfpId] = useState(characterData.pfpId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [traits, setTraits] = useState<Trait[]>(characterData.traits || [])
  const [imageUrl, setImageUrl] = useState<string | null>(characterData.imageUrl || null)
  const [traitsLoaded, setTraitsLoaded] = useState(characterData.traits.length > 0)
  const [isApiData, setIsApiData] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const { isConnected } = useWallet()
  const [selectedNftId, setSelectedNftId] = useState<string | null>(characterData.pfpId || null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarTokenId, setSidebarTokenId] = useState<string | null>(null)
  const [sidebarImageUrl, setSidebarImageUrl] = useState<string | null>(null)
  const [sidebarCollection, setSidebarCollection] = useState<'force' | 'frame'>('force')
  const router = useRouter()
  
  // Check if the current NFT has a soul attached
  const [hasSoul, setHasSoul] = useState(false)
  
  useEffect(() => {
    const checkSoulExists = async () => {
      if (selectedNftId) {
        const exists = await soulExistsInDB(selectedNftId, 'force')
        setHasSoul(exists)
      } else {
        setHasSoul(false)
      }
    }
    checkSoulExists()
  }, [selectedNftId])

  // Fetch token data function
  const fetchTokenData = async (tokenId: string) => {
    if (!tokenId.trim()) return

    setIsLoading(true)
    setError("")
    setIsApiData(false)
    setTraitsLoaded(false) // Reset traits loaded state

    try {
      // Normalize the token ID (remove leading zeros)
      const normalizedTokenId = tokenId.replace(/^0+/, "")

      // Check if the token ID is within the valid range (1-7777)
      const tokenIdNumber = Number.parseInt(normalizedTokenId, 10)
      if (isNaN(tokenIdNumber) || tokenIdNumber < 1 || tokenIdNumber > 7777) {
        setError("Please try again and select a valid 0N1 Force NFT")
        setIsLoading(false)
        return
      }

      console.log(`Fetching data for token ID: ${normalizedTokenId}`)

      const {
        traits: fetchedTraits,
        imageUrl: fetchedImageUrl,
        isApiData: isFromApi,
      } = await fetchNftDataWithFallback(normalizedTokenId)

      if (fetchedTraits.length === 0) {
        setError("Could not fetch data from OpenSea API. Using generated traits instead.")
      } else {
        setTraits(fetchedTraits)
        setImageUrl(fetchedImageUrl)
        updateCharacterData({
          pfpId: normalizedTokenId, // Store normalized ID
          traits: fetchedTraits,
          imageUrl: fetchedImageUrl || undefined,
        })
        setTraitsLoaded(true)
        setIsApiData(isFromApi)
        setError("") // Clear any previous errors
      }
    } catch (err) {
      console.error("Error in PfpInput component:", err)
      setError(`Error fetching NFT data: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false) // Always set loading to false when done
    }
  }

  // Handle NFT selection from owned NFTs - immediately fetch traits and proceed
  const handleSelectNft = (tokenId: string) => {
    setPfpId(tokenId)
    setSelectedNftId(tokenId)

    // Immediately fetch the NFT data and proceed to next step
    fetchTokenDataAndProceed(tokenId)
  }

  // Fetch data and automatically proceed to next step
  const fetchTokenDataAndProceed = async (tokenId: string) => {
    setIsLoading(true)
    setError("")

    try {
      const normalizedTokenId = tokenId.replace(/^0+/, "")
      
      const {
        traits: fetchedTraits,
        imageUrl: fetchedImageUrl,
        isApiData: isFromApi,
      } = await fetchNftDataWithFallback(normalizedTokenId)

      updateCharacterData({
        pfpId: normalizedTokenId,
        traits: fetchedTraits,
        imageUrl: fetchedImageUrl || undefined,
      })

      // Automatically proceed to next step
      nextStep()
    } catch (err) {
      console.error("Error fetching NFT data:", err)
      setError(`Error fetching NFT data: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle showing traits in sidebar
  const handleShowTraits = (tokenId: string, imageUrl: string | null, collection: string) => {
    setSidebarTokenId(tokenId)
    setSidebarImageUrl(imageUrl)
    setSidebarCollection(collection as 'force' | 'frame')
    setSidebarOpen(true)
  }

  // Retry fetching if we have a token ID but no traits
  useEffect(() => {
    if (characterData.pfpId && !characterData.traits.length && retryCount < 2) {
      console.log(`Retrying fetch for token ${characterData.pfpId}, attempt ${retryCount + 1}`)
      setPfpId(characterData.pfpId)
      fetchTokenData(characterData.pfpId)
      setRetryCount((prev) => prev + 1)
    }
  }, [characterData.pfpId, characterData.traits.length, retryCount])

  const handleViewProfile = () => {
    if (selectedNftId && hasSoul) {
      router.push(`/agent/${selectedNftId}`)
    }
  }

  return (
    <div className="space-y-8 animate-slide-in-up">
      {/* Header - Only show when no NFT is connected yet */}
      {!isConnected && (
        <div className="space-y-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-cyber-gradient">
            START WITH YOUR 0N1
          </h2>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Connect your wallet to select your <span className="text-cyber-red font-semibold">0N1 Force NFT</span> and begin crafting your character's lore
          </p>
        </div>
      )}

      {/* Enhanced Wallet Connection Section */}
      <div className="flex justify-center">
        <div className="relative">
          <WalletConnectButton />
          {/* Glow effect */}
          <div className="absolute inset-0 bg-cyber-gradient opacity-20 blur-xl rounded-lg -z-10" />
        </div>
      </div>

      {/* Connection Status Cards */}
      {!isConnected && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyber-red/20 flex items-center justify-center">
              <User className="w-8 h-8 text-cyber-red" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-cyber-red">Connect Your Wallet</h3>
            <p className="text-foreground/70 mb-4">
              Connect your wallet to see your 0N1 Force NFTs and continue your journey
            </p>
            <p className="text-sm text-muted-foreground">
              You need to connect your wallet to access your NFT collection
            </p>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Owned NFTs Section */}
      {isConnected && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-white mb-2">Your 0N1 Collection</h3>
            <p className="text-foreground/70">Select an NFT to begin crafting its lore</p>
          </div>
          
          <OwnedNfts 
            onSelectNft={handleSelectNft} 
            onShowTraits={handleShowTraits}
            selectedNftId={selectedNftId} 
            isLoading={isLoading} 
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="max-w-2xl mx-auto border-destructive/50 bg-destructive/10">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-1">Error</h4>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyber-red/20 flex items-center justify-center animate-pulse-glow">
              <div className="w-8 h-8 border-2 border-cyber-red border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Processing Your Selection</h3>
            <p className="text-foreground/70">
              Fetching your NFT data and preparing your character...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Existing Profile Link */}
      {hasSoul && selectedNftId && (
        <Card className="max-w-2xl mx-auto border-cyber-orange/50 bg-cyber-orange/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-cyber-orange mb-1">
                  Soul Already Exists
                </h4>
                <p className="text-sm text-foreground/70">
                  This NFT already has a soul profile created
                </p>
              </div>
              <Button
                onClick={handleViewProfile}
                variant="outline"
                className="border-cyber-orange/40 text-cyber-orange hover:bg-cyber-orange/10"
              >
                View Profile
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traits Sidebar */}
      <NftTraitsSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        tokenId={sidebarTokenId}
        imageUrl={sidebarImageUrl}
        collection={sidebarCollection}
      />
    </div>
  )
}

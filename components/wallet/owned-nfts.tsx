"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertTriangle, ExternalLink, Sparkles, Play, Edit } from "lucide-react"
import { SafeNftImage } from "@/components/safe-nft-image"
import { useWallet } from "@/components/wallet/wallet-provider"
import type { OwnedNft } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { soulExistsForNft } from "@/lib/storage"
import { useRouter } from "next/navigation"

interface OwnedNftsProps {
  onSelectNft: (tokenId: string) => void
  onShowTraits: (tokenId: string, imageUrl: string | null) => void
  selectedNftId?: string | null
  isLoading?: boolean
}

export function OwnedNfts({ onSelectNft, onShowTraits, selectedNftId, isLoading: externalLoading }: OwnedNftsProps) {
  const { address, isConnected } = useWallet()
  const [ownedNfts, setOwnedNfts] = useState<OwnedNft[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [nftsWithSouls, setNftsWithSouls] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    async function loadOwnedNfts() {
      if (!address || !isConnected) return

      setIsLoading(true)
      setError("")

      try {
        console.log("Fetching NFTs for address:", address)
        // Call our API route directly with the connected address
        const response = await fetch(`/api/opensea/owned?address=${address}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch owned NFTs")
        }

        const data = await response.json()
        console.log("API response:", data)

        // Map the API response to our OwnedNft type
        const nfts = (data.nfts || []).map((nft: any) => ({
          tokenId: nft.identifier,
          name: nft.name || `0N1 Force #${nft.identifier}`,
          imageUrl: nft.image_url || null,
        }))

        console.log("Processed NFTs:", nfts)
        setOwnedNfts(nfts)

        // Check which NFTs already have souls
        const withSouls = new Set<string>()
        nfts.forEach((nft: OwnedNft) => {
          if (soulExistsForNft(nft.tokenId)) {
            withSouls.add(nft.tokenId)
          }
        })
        setNftsWithSouls(withSouls)
      } catch (err) {
        console.error("Error fetching owned NFTs:", err)
        setError(`Failed to load your 0N1 Force NFTs: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadOwnedNfts()
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
        <span className="ml-2 text-purple-300">Loading your 0N1 Force NFTs...</span>
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

  if (ownedNfts.length === 0) {
    return (
      <Card className="border border-purple-500/30 bg-black/60 backdrop-blur-sm">
        <CardContent className="p-6">
          <p className="text-center text-purple-300 mb-4">No 0N1 Force NFTs found in your wallet.</p>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://opensea.io/collection/0n1-force", "_blank")}
            >
              View 0N1 Force Collection <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-purple-300">Your 0N1 Force NFTs</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ownedNfts.map((nft) => {
          const hasSoul = nftsWithSouls.has(nft.tokenId)

          return (
            <Card
              key={nft.tokenId}
              className={`border ${
                hasSoul
                  ? "border-yellow-400/70 hover:border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                  : "border-purple-500/30 hover:border-purple-400"
              } bg-black/60 backdrop-blur-sm overflow-hidden transition-all duration-300 group transform hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] relative`}
            >
              {/* Soul Indicator */}
              {hasSoul && (
                <div className="absolute top-2 right-2 z-30 bg-yellow-500/80 rounded-full p-1 shadow-lg">
                  <Sparkles className="h-4 w-4 text-black" />
                </div>
              )}

              {/* NFT Image - Click to show traits */}
              <div 
                className="aspect-square relative overflow-hidden cursor-pointer"
                onClick={(e) => handleImageClick(nft.tokenId, nft.imageUrl, e)}
              >
                <div
                  className={`absolute inset-0 ${
                    hasSoul
                      ? "bg-yellow-500/5 group-hover:bg-yellow-500/10"
                      : "bg-purple-500/0 group-hover:bg-purple-500/10"
                  } transition-all duration-300 z-10`}
                ></div>
                
                <SafeNftImage
                  src={nft.imageUrl}
                  alt={`0N1 Force #${nft.tokenId}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Action Buttons - Always Visible */}
                <div className="absolute bottom-2 left-2 right-2 flex gap-2 z-20">
                  <Button
                    size="sm"
                    onClick={(e) => handleStartLore(nft.tokenId, e)}
                    className="flex-1 bg-purple-600/90 hover:bg-purple-600 text-white text-xs py-1 px-2 h-8"
                    disabled={externalLoading && selectedNftId === nft.tokenId}
                  >
                    {externalLoading && selectedNftId === nft.tokenId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        {hasSoul ? "Start" : "Create"}
                      </>
                    )}
                  </Button>
                  
                  {hasSoul && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleEditProfile(nft.tokenId, e)}
                      className="flex-1 bg-black/60 hover:bg-black/80 border-yellow-500/50 text-yellow-200 text-xs py-1 px-2 h-8"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* NFT Title */}
              <CardContent
                className={`p-3 transition-colors duration-300 ${
                  hasSoul
                    ? "bg-yellow-900/10 group-hover:bg-yellow-900/20"
                    : "group-hover:bg-purple-900/20"
                }`}
              >
                <p
                  className={`text-center font-medium ${
                    hasSoul
                      ? "text-yellow-200 group-hover:text-yellow-100"
                      : "text-purple-200 group-hover:text-white"
                  } transition-colors duration-300`}
                >
                  0N1 #{nft.tokenId}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

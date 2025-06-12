"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getAllSouls, deleteSoulFromDB } from "@/lib/storage"
import { Download, Trash2, Bot, ArrowLeft, Edit, Search, MessageCircle, User, ExternalLink } from "lucide-react"
import { SafeNftImage } from "@/components/safe-nft-image"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useWallet } from "@/components/wallet/wallet-provider"
import Image from "next/image"
import { getOpenSeaNftLink } from "@/lib/api"
import type { CharacterData } from "@/lib/types"

interface SoulData {
  id: string
  nft_id: string
  wallet_address: string
  collection: 'force' | 'frame'
  data: CharacterData
  created_at: string
  updated_at: string
}

export default function SoulsPage() {
  const router = useRouter()
  const { address, isConnected } = useWallet()
  const [souls, setSouls] = useState<SoulData[]>([])
  const [ownedNfts, setOwnedNfts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [mounted, setMounted] = useState(false)

  // Wait for component to mount before checking wallet state
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Don't run until component is mounted
    if (!mounted) return
    
    const loadSoulsAndNfts = async () => {
      // Redirect if wallet not connected
      if (!isConnected || !address) {
        router.push("/?connect=true")
        return
      }

      try {
        // First, fetch owned NFTs from OpenSea
        const response = await fetch(`/api/opensea/owned?address=${address}`)
        if (!response.ok) {
          throw new Error('Failed to fetch owned NFTs')
        }
        
        const ownedNftData = await response.json()
        setOwnedNfts(ownedNftData.nfts || [])

        // Get all souls for this wallet from Supabase
        const allSouls = await getAllSouls(address)
        
        // Convert to the format we need
        const formattedSouls = allSouls.map(soul => ({
          id: soul.data.pfpId || soul.id,
          nft_id: soul.data.pfpId || soul.id,
          wallet_address: address,
          collection: (soul.data.collection || 'force') as 'force' | 'frame',
          data: soul.data,
          created_at: soul.createdAt || new Date().toISOString(),
          updated_at: soul.lastUpdated || new Date().toISOString()
        }))
        
        setSouls(formattedSouls)

      } catch (error) {
        console.error('Error loading souls and NFTs:', error)
        setSouls([])
        setOwnedNfts([])
      }

      setIsLoading(false)
    }

    loadSoulsAndNfts()
  }, [mounted, isConnected, address, router])

  const handleDelete = async (nftId: string, collection: 'force' | 'frame' = 'force') => {
    try {
      await deleteSoulFromDB(nftId, collection)
      setSouls((prev) => prev.filter((soul) => soul.nft_id !== nftId))
    } catch (error) {
      console.error('Error deleting soul:', error)
    }
  }

  const handleExport = (soul: SoulData) => {
    const dataStr = JSON.stringify(soul.data, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    const exportFileDefaultName = `${soul.data.soulName || "soul"}_${soul.data.pfpId}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleDeployAgent = (soul: SoulData) => {
    router.push(`/agent/${soul.data.pfpId}`)
  }

  const handleEditSoul = (soul: SoulData) => {
    router.push(`/souls/edit/${soul.data.pfpId}`)
  }

  const filteredSouls = souls.filter((soul) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      (soul.data.soulName || "").toLowerCase().includes(searchLower) ||
      (soul.data.pfpId || "").toLowerCase().includes(searchLower) ||
      (soul.data.archetype || "").toLowerCase().includes(searchLower) ||
      (soul.data.powersAbilities?.description || "").toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border border-purple-500/30 bg-black/60 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-purple-300 mb-2">Loading Your Soul Collection</p>
            <p className="text-muted-foreground text-sm">Fetching your souls from the database...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-purple-500/30 bg-black/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                className="border-purple-500/30 hover:bg-purple-900/20"
                onClick={() => router.push("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Soul Collection
              </h1>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Create New Soul
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {souls.length === 0 ? (
          <Card className="border border-purple-500/30 bg-black/60 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 mb-6 rounded-full bg-purple-900/20 border border-purple-500/30 flex items-center justify-center">
                <User className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-xl text-purple-300 mb-4">No souls created yet</p>
              <p className="text-muted-foreground mb-6 max-w-md">
                {ownedNfts.length > 0 
                  ? "You own 0N1 Force NFTs but haven't created any souls yet. Start by creating your first soul!"
                  : "Connect your wallet and own some 0N1 Force NFTs to start creating souls."
                }
              </p>
              <Button
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {ownedNfts.length > 0 ? "Create Your First Soul" : "Go Back"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search souls by name, ID, archetype, or powers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/60 border-purple-500/30 focus:border-purple-400"
                />
              </div>
            </div>

            {/* Souls List - Detailed Profile Style */}
            <div className="space-y-6">
              {filteredSouls.map((soul) => {
                const openSeaLink = getOpenSeaNftLink(soul.data.pfpId || "")
                
                return (
                  <Card key={soul.id} className="border border-purple-500/30 bg-black/60 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-white">
                          {soul.data.soulName || `0N1 Force #${soul.data.pfpId}`}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            0N1 Force #{soul.data.pfpId}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(openSeaLink, '_blank')}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Character Summary */}
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Character Image - Make clickable */}
                        <div 
                          className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => router.push(`/agent/${soul.data.pfpId}/profile`)}
                          title="View Profile"
                        >
                          <SafeNftImage
                            src={soul.data.imageUrl || "/placeholder.svg"}
                            alt={`0N1 Force #${soul.data.pfpId}`}
                            width={256}
                            height={256}
                            className="w-64 h-64 object-contain rounded-lg border border-purple-500/30"
                          />
                        </div>

                        {/* Character Information */}
                        <div className="flex-1 space-y-4">
                          {/* Character Header - Make name clickable */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h2 
                                className="text-2xl font-bold cursor-pointer hover:text-purple-400 transition-colors"
                                onClick={() => router.push(`/agent/${soul.data.pfpId}/profile`)}
                                title="View Profile"
                              >
                                {soul.data.soulName || `0N1 Force #${soul.data.pfpId}`}
                              </h2>
                              <Badge variant="outline" className="border-purple-500/50 text-purple-300">
                                NFT #{soul.data.pfpId}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              {soul.data.archetype || "Unknown Archetype"} • Created {new Date(soul.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Character Summary */}
                          <div className="grid gap-4">
                            <div>
                              <h3 className="font-semibold text-purple-300 mb-2">Background</h3>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {soul.data.background || "No background available"}
                              </p>
                            </div>

                            <div>
                              <h3 className="font-semibold text-purple-300 mb-2">Personality</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {soul.data.personalityProfile?.description || "No personality description available"}
                              </p>
                            </div>

                            <div>
                              <h3 className="font-semibold text-purple-300 mb-2">Powers & Abilities</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {soul.data.powersAbilities?.description || "No powers defined"}
                              </p>
                            </div>

                            <div>
                              <h3 className="font-semibold text-purple-300 mb-2">World Position</h3>
                              <p className="text-sm text-muted-foreground">
                                {soul.data.worldPosition?.societalRole || "Position unknown"}
                              </p>
                            </div>

                            <div>
                              <h3 className="font-semibold text-purple-300 mb-2">Voice & Tone</h3>
                              <p className="text-sm text-muted-foreground">
                                {soul.data.voice?.speechStyle || "Voice not defined"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-purple-500/30" />

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        {/* View Profile Button */}
                        <Button
                          onClick={() => router.push(`/agent/${soul.data.pfpId}/profile`)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <User className="mr-2 h-4 w-4" />
                          View Profile
                        </Button>

                        {/* Edit Soul Button */}
                        <Button
                          onClick={() => handleEditSoul(soul)}
                          variant="outline"
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Soul
                        </Button>

                        {/* Soul Chat Button */}
                        <Button
                          onClick={() => router.push(`/agent/${soul.data.pfpId}`)}
                          variant="outline"
                          className="border-green-500/50 text-green-300 hover:bg-green-500/10"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Soul Chat
                        </Button>

                        {/* Export Button */}
                        <Button
                          onClick={() => handleExport(soul)}
                          variant="outline"
                          className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>

                        {/* Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-red-500/50 text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-black/95 border border-purple-500/30">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Soul</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                Are you sure you want to delete this soul? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(soul.nft_id, soul.collection)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 
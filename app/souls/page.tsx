"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { getStoredSouls, deleteSoul, type StoredSoul, initializeHybridStorage, setCurrentWalletAddress } from "@/lib/storage-wrapper"
import { Download, Trash2, Bot, ArrowLeft, Edit, Search, MessageCircle, User, AlertTriangle, Loader2, Clock } from "lucide-react"
import { SafeNftImage } from "@/components/safe-nft-image"
import { useRouter } from "next/navigation"
import { SoulEditor } from "@/components/soul-editor"
import { Input } from "@/components/ui/input"
import { getCharacterMemories } from "@/lib/memory"
import { generatePreviewText, getPreviewTextColor } from "@/lib/preview-text-generator"
import { useWallet } from "@/components/wallet/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { getMemoryProfile } from "@/lib/memory-types"
import { getArchivedChats } from "@/lib/chat-archive"

export default function SoulsPage() {
  const router = useRouter()
  const { address, isConnected, isAuthenticated, authSession, sessionExpiresIn, connect } = useWallet()
  const { toast } = useToast()
  const [souls, setSouls] = useState<StoredSoul[]>([])
  const [ownedNfts, setOwnedNfts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingSoul, setEditingSoul] = useState<StoredSoul | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deployedSouls, setDeployedSouls] = useState<Set<string>>(new Set())
  const [ownershipVerificationFailed, setOwnershipVerificationFailed] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showSessionWarning, setShowSessionWarning] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sessionWarningShownRef = useRef(false)

  // Session expiry monitoring
  useEffect(() => {
    if (sessionExpiresIn !== null && sessionExpiresIn > 0) {
      // Show warning when 5 minutes remain
      if (sessionExpiresIn <= 300 && !sessionWarningShownRef.current) {
        setShowSessionWarning(true)
        sessionWarningShownRef.current = true
        toast({
          title: "Session Expiring Soon",
          description: `Your session will expire in ${Math.floor(sessionExpiresIn / 60)} minutes. Click to refresh.`,
          action: (
            <Button
              size="sm"
              onClick={() => {
                connect()
                setShowSessionWarning(false)
              }}
            >
              Refresh Session
            </Button>
          ),
          duration: 10000,
        })
      }
      
      // Auto-prompt when session expires
      if (sessionExpiresIn <= 0) {
        toast({
          title: "Session Expired",
          description: "Please authenticate again to continue.",
          variant: "destructive",
        })
        connect()
      }
    }
  }, [sessionExpiresIn, connect, toast])

  // Use useCallback to prevent recreating the function on every render
  const loadSoulsAndNfts = useCallback(async () => {
    // Clear any existing loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    // Set a loading timeout - redirect after 10 seconds if still loading
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading && (!isConnected || !address)) {
        toast({
          title: "Connection Timeout",
          description: "Unable to connect to wallet. Redirecting to home page.",
          variant: "destructive",
        })
        router.push("/?connect=true")
      }
    }, 10000)

    // Redirect if wallet not connected
    if (!isConnected || !address) {
      router.push("/?connect=true")
      return
    }

    // Require authentication for access
    if (!isAuthenticated || !authSession) {
      setIsLoading(false)
      return
    }

    // Initialize hybrid storage with wallet address
    setCurrentWalletAddress(address)
    initializeHybridStorage(address).catch(console.error)

    try {
      // Get all stored souls FIRST (before API call)
      const allStoredSouls = getStoredSouls()
      console.log("All stored souls:", allStoredSouls)
      
      // Try to fetch owned NFTs from OpenSea
      let ownedTokenIds = new Set<string>()
      let apiError = false
      
      try {
        // Use authenticated request with JWT token
        const headers: HeadersInit = {
          'Authorization': `Bearer ${authSession.token}`
        }
        
        const response = await fetch(`/api/opensea/owned`, { headers })
        
        // Check for specific error types
        if (!response.ok) {
          const errorText = await response.text()
          let errorDetails = ''
          try {
            const errorJson = JSON.parse(errorText)
            errorDetails = errorJson.error || errorJson.message || ''
          } catch {
            errorDetails = errorText
          }
          
          console.error(`OpenSea API error: ${response.status} - ${errorDetails}`)
          
          // Log error details but don't show them to users
          console.warn(`OpenSea API error ${response.status}: ${errorDetails}`)
          setOwnershipVerificationFailed(false) // Don't trigger the warning UI
          
          throw new Error(`API Error: ${response.status} - ${errorDetails}`)
        }
        
        const ownedNftData = await response.json()
        const characters = ownedNftData.characters || []
        setOwnedNfts(characters)
        
        // If we got a successful response, clear any errors
        setOwnershipVerificationFailed(false)
        setVerificationError(null)
        
        // Create set of owned token IDs - normalize them
        ownedTokenIds = new Set(characters.map((char: any) => {
          // Normalize by removing leading zeros
          const normalized = char.tokenId.replace(/^0+/, "") || "0"
          return normalized
        }))
        console.log("Owned token IDs from API (normalized):", Array.from(ownedTokenIds))
        console.log("✅ OpenSea API call successful")
      } catch (apiErr) {
        console.error('OpenSea API error details:', apiErr)
        apiError = true
        // Don't show API connection errors to users - just log them
        console.warn("⚠️ OpenSea API connection failed - using local souls")
        setOwnershipVerificationFailed(false) // Don't trigger the warning UI
      }

      // SECURITY FIX: Only show souls we can verify ownership for
      let filteredSouls: StoredSoul[] = []
      
      if (apiError) {
        // If API failed, show all stored souls
        // The user has already authenticated and souls are stored locally
        console.warn("⚠️ NFT ownership verification API failed - showing locally stored souls")
        filteredSouls = allStoredSouls
      } else if (ownedTokenIds.size === 0) {
        // No NFTs found but API call succeeded - this might be correct
        console.log("API returned no NFTs for this wallet")
        // Show any stored souls the user has created
        filteredSouls = allStoredSouls
      } else {
        // API succeeded and returned NFTs - filter souls to only owned NFTs
        console.log("✅ Filtering souls based on owned NFTs")
        filteredSouls = allStoredSouls.filter(soul => {
          // Normalize the soul's pfpId for comparison
          const normalizedSoulId = soul.data.pfpId.replace(/^0+/, "") || "0"
          const hasNft = ownedTokenIds.has(normalizedSoulId)
          console.log(`Soul ${soul.data.pfpId} (normalized: ${normalizedSoulId}) - Owner has NFT: ${hasNft}`)
          return hasNft
        })
        
        // If user has souls for NFTs they no longer own, still show them with a note
        const unownedSouls = allStoredSouls.filter(soul => {
          const normalizedSoulId = soul.data.pfpId.replace(/^0+/, "") || "0"
          return !ownedTokenIds.has(normalizedSoulId)
        })
        
        if (unownedSouls.length > 0) {
          console.log(`📝 Found ${unownedSouls.length} souls for NFTs no longer owned - including them`)
          filteredSouls = allStoredSouls // Show all souls if some are for unowned NFTs
        }
      }
      
      console.log("Filtered souls:", filteredSouls)
      setSouls(filteredSouls)

      // Check which souls have been deployed (have existing conversations)
      const deployed = new Set<string>()
      filteredSouls.forEach((soul) => {
        const memories = getCharacterMemories(soul.data.pfpId)
        if (memories && memories.messages.length > 0) {
          deployed.add(soul.data.pfpId)
        }
      })
      setDeployedSouls(deployed)

    } catch (error) {
      console.error('Error loading souls:', error)
      // On any error, still try to show stored souls
      const allStoredSouls = getStoredSouls()
      setSouls(allStoredSouls)
      setOwnedNfts([])
    }

    setIsLoading(false)
    
    // Clear loading timeout when done
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }
  }, [isConnected, address, router, isAuthenticated, authSession, toast])

  useEffect(() => {
    loadSoulsAndNfts()
    
    // Add event listener for storage changes
    window.addEventListener("storage", loadSoulsAndNfts)
    
    // Also listen for custom storage events (for same-tab updates)
    const handleCustomStorageEvent = () => {
      console.log("Custom storage event detected - reloading souls")
      loadSoulsAndNfts()
    }
    window.addEventListener("soul-storage-updated", handleCustomStorageEvent)
    
    return () => {
      window.removeEventListener("storage", loadSoulsAndNfts)
      window.removeEventListener("soul-storage-updated", handleCustomStorageEvent)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [loadSoulsAndNfts])

  const handleDelete = async (id: string) => {
    // Prevent duplicate deletions
    if (deletingIds.has(id)) return
    
    // Find the soul to delete
    const soulToDelete = souls.find((soul: StoredSoul) => soul.id === id)
    if (!soulToDelete) return
    
    // Double-check ownership by verifying the soul is in our current filtered list
    const isOwned = souls.some((soul: StoredSoul) => soul.id === id)
    if (!isOwned) {
      console.error("Attempted to delete soul without ownership verification")
      toast({
        title: "Unauthorized",
        description: "You cannot delete a soul you don't own.",
        variant: "destructive",
      })
      return
    }
    
    // Mark as deleting
    setDeletingIds(prev => new Set(prev).add(id))
    
    // Call server-side validation endpoint
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      // Add auth token if available
      if (authSession) {
        headers['Authorization'] = `Bearer ${authSession.token}`
      }
      
      const response = await fetch('/api/souls/delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          soulId: soulToDelete.id,
          pfpId: soulToDelete.data.pfpId,
          walletAddress: address // For backward compatibility
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error("Server rejected deletion:", result)
        toast({
          title: "Deletion Failed",
          description: result.message || result.error || "Failed to delete soul. You may not own this NFT.",
          variant: "destructive",
        })
        return
      }
      
      // Server validated ownership - now safe to delete from localStorage
      deleteSoul(id)
      setSouls((prev: StoredSoul[]) => prev.filter((soul: StoredSoul) => soul.id !== id))
      
      toast({
        title: "Soul Deleted",
        description: `Successfully deleted soul for NFT #${soulToDelete.data.pfpId}`,
      })
      
      console.log("✅ Soul deletion completed:", result)
      
    } catch (error) {
      console.error("Error during soul deletion:", error)
      toast({
        title: "Network Error",
        description: "Failed to connect to server. Please check your internet connection.",
        variant: "destructive",
      })
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleExport = (soul: StoredSoul) => {
    // Get memory profile if it exists
    const memoryProfile = getMemoryProfile(soul.data.pfpId)
    
    // Get archived chats if they exist
    const allArchivedChats = getArchivedChats()
    const characterChats = allArchivedChats.filter((chat: any) => chat.characterId === soul.data.pfpId)
    
    // Use comprehensive export
    const { exportCompleteSoul, downloadJSON, generateExportFilename } = require('@/lib/memory-export')
    const exportData = exportCompleteSoul(soul, memoryProfile, characterChats)
    const filename = generateExportFilename(soul.data.soulName || "soul", soul.data.pfpId, true)
    
    downloadJSON(exportData, filename)
  }

  const handleDeployAgent = (soul: StoredSoul) => {
    router.push(`/agent/${soul.data.pfpId}`)
  }

  const handleEditSoul = (soul: StoredSoul) => {
    setEditingSoul(soul)
  }

  const handleSaveSoul = (updatedSoul: StoredSoul) => {
    // Update the soul in the list
    setSouls((prev) => prev.map((soul) => (soul.id === updatedSoul.id ? updatedSoul : soul)))
    setEditingSoul(null)
  }

  const filteredSouls = souls.filter((soul) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      soul.data.soulName?.toLowerCase().includes(searchLower) ||
      soul.data.pfpId?.toLowerCase().includes(searchLower) ||
      soul.data.archetype?.toLowerCase().includes(searchLower) ||
      (soul.data.powersAbilities?.powers || []).some((power) => power.toLowerCase().includes(searchLower))
    )
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border border-purple-500/30 bg-black/60 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-purple-300 mb-2">Loading Your Soul Collection</p>
            <p className="text-muted-foreground text-sm">Verifying wallet and fetching your 0N1 Force NFTs...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If we're editing a soul, show the editor
  if (editingSoul) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <SoulEditor soul={editingSoul} onSave={handleSaveSoul} onCancel={() => setEditingSoul(null)} />
        </div>
      </div>
    )
  }

  // Show authentication prompt if connected but not authenticated
  if (isConnected && !isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border border-purple-500/30 bg-black/60 backdrop-blur-sm max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To ensure the security of your souls, you need to authenticate your wallet by signing a message.
            </p>
            <div className="flex items-center space-x-2 text-sm text-purple-300">
              <User className="h-4 w-4" />
              <span>{address}</span>
            </div>
            {sessionExpiresIn !== null && sessionExpiresIn > 0 && (
              <div className="text-sm text-muted-foreground">
                Session expires in: {Math.floor(sessionExpiresIn / 60)} minutes
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              onClick={connect}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Authenticate Wallet
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="border-purple-500/30 hover:bg-purple-900/20"
            >
              Go Back
            </Button>
          </CardFooter>
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
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  Soul Collection
                </h1>
                {isAuthenticated && sessionExpiresIn !== null && sessionExpiresIn > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Session expires in {Math.floor(sessionExpiresIn / 60)}m
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/debug-storage")}
                variant="outline"
                size="sm"
                className="border-purple-500/30 hover:bg-purple-900/20"
              >
                Debug Storage
              </Button>
              <Button
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Create New Soul
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Session Warning Banner */}
        {showSessionWarning && isAuthenticated && sessionExpiresIn !== null && sessionExpiresIn <= 300 && sessionExpiresIn > 0 && (
          <Card className="border border-yellow-500/30 bg-yellow-900/10 backdrop-blur-sm mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-yellow-300 font-medium">Session Expiring Soon</p>
                    <p className="text-yellow-200/70 text-sm">
                      Your session will expire in {Math.floor(sessionExpiresIn / 60)} minutes. Please refresh to continue.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    connect()
                    setShowSessionWarning(false)
                    sessionWarningShownRef.current = false
                  }}
                  size="sm"
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-900/20"
                >
                  Refresh Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NFT verification warning removed - API errors are handled silently */}

        {souls.length === 0 && !ownershipVerificationFailed ? (
          <Card className="border border-purple-500/30 bg-black/60 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 mb-6 rounded-full bg-purple-900/20 border border-purple-500/30 flex items-center justify-center">
                <User className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-xl text-purple-300 mb-4">No souls created yet</p>
              <p className="text-muted-foreground mb-6 max-w-md">
                {ownedNfts.length > 0 
                  ? `You own ${ownedNfts.length} 0N1 Force NFT${ownedNfts.length > 1 ? 's' : ''}. Create a soul for any of them to get started.`
                  : "You don't own any 0N1 Force NFTs yet. You need to own an NFT to create souls."
                }
              </p>
              {ownedNfts.length > 0 ? (
                <Button
                  onClick={() => router.push("/")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Create Your First Soul
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={() => window.open("https://opensea.io/collection/0n1-force", "_blank")}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Get 0N1 Force NFT
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/?connect=true")}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-900/20"
                  >
                    Connect Different Wallet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : souls.length > 0 ? (
          <>
            {/* Search bar */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search souls by name, ID, archetype, or powers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-purple-500/30 focus-visible:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSouls.map((soul) => {
                const isDeployed = deployedSouls.has(soul.data.pfpId)

                return (
                  <Card
                    key={soul.id}
                    className="border border-purple-500/30 bg-black/60 backdrop-blur-sm hover:border-purple-500/50 transition-all overflow-hidden flex flex-col h-full min-h-[520px]"
                  >
                    <CardHeader className="pb-2 space-y-1">
                      <CardTitle 
                        className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 cursor-pointer hover:from-purple-300 hover:to-pink-400 transition-all"
                        onClick={() => router.push(`/agent/${soul.data.pfpId}/profile`)}
                      >
                        {soul.data.soulName || `0N1 Force #${soul.data.pfpId}`}
                      </CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>0N1 Force #{soul.data.pfpId}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(soul.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-4 flex-grow">
                      <div className="flex gap-4">
                        <div 
                          className="relative w-24 h-24 rounded-md overflow-hidden border border-purple-500/30 flex-shrink-0 cursor-pointer hover:border-purple-400 transition-colors"
                          onClick={() => router.push(`/agent/${soul.data.pfpId}/profile`)}
                        >
                          <SafeNftImage
                            src={soul.data.imageUrl || null}
                            alt={`0N1 Force #${soul.data.pfpId}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-black/40 text-purple-300 hover:bg-black/60">
                              {soul.data.archetype}
                            </Badge>
                            {soul.data.powersAbilities?.powers?.slice(0, 2).map((power, index) => (
                              <Badge key={index} variant="outline" className="border-purple-500/30 text-purple-200">
                                {power}
                              </Badge>
                            ))}
                          </div>
                          {soul.data.worldPosition?.societalRole && (
                            <div className="text-sm font-medium text-purple-300">{soul.data.worldPosition.societalRole}</div>
                          )}
                          {(() => {
                            const preview = generatePreviewText(soul.data)
                            return (
                              <p className={`text-sm line-clamp-3 ${getPreviewTextColor(preview.style)}`}>
                                {preview.text}
                              </p>
                            )
                          })()}
                        </div>
                      </div>
                      <Separator className="bg-purple-500/20" />
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Personality:</p>
                          <p className="line-clamp-2 text-purple-200 leading-relaxed">
                            {soul.data.personalityProfile?.description
                              ? soul.data.personalityProfile.description.length > 80
                                ? `${soul.data.personalityProfile.description.substring(0, 80)}...`
                                : soul.data.personalityProfile.description
                              : "A stoic exterior hiding a storm of emotions..."}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Voice:</p>
                          <p className="line-clamp-2 text-purple-200 leading-relaxed">
                            {soul.data.voice?.speechStyle
                              ? soul.data.voice.speechStyle.length > 80
                                ? `${soul.data.voice.speechStyle.substring(0, 80)}...`
                                : soul.data.voice.speechStyle
                              : "Speaks in short, cryptic phrases that bl..."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-3 border-t border-purple-500/20 bg-black/40 mt-auto">
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30 hover:bg-purple-900/20 text-purple-200"
                          onClick={() => router.push(`/agent/${soul.data.pfpId}/profile`)}
                        >
                          <User className="h-3 w-3 mr-1" />
                          Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30 hover:bg-purple-900/20 text-purple-200"
                          onClick={() => handleEditSoul(soul)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30 hover:bg-purple-900/20 text-purple-200"
                          onClick={() => handleExport(soul)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/30 hover:bg-red-900/20 text-red-200"
                              disabled={deletingIds.has(soul.id)}
                            >
                              {deletingIds.has(soul.id) ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Deleting
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this soul. This action cannot be undone.
                                {!isAuthenticated && (
                                  <span className="block mt-2 text-yellow-500">
                                    ⚠️ Authentication required for deletion
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleDelete(soul.id)
                                }}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deletingIds.has(soul.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <Button
                        onClick={() => handleDeployAgent(soul)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {isDeployed ? (
                          <>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Soul Chat
                          </>
                        ) : (
                          <>
                            <Bot className="h-4 w-4 mr-2" />
                            Deploy Soul
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

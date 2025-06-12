"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowLeft, 
  MessageSquare, 
  StickyNote,
  Settings,
  Download,
  Upload,
  Search,
  Save,
  X,
  Shield
} from "lucide-react"
import Image from "next/image"
import { getSoul } from "@/lib/storage"
import { type StoredSoul } from "@/lib/soul-types"
import { getCharacterMemories, saveCharacterMemories, createCharacterMemory } from "@/lib/memory"
import { upgradeToEnhancedMemory } from "@/lib/memory-enhanced"
import { useWallet } from "@/components/wallet/wallet-provider"
import { 
  getMemoryProfile, 
  saveMemoryProfile, 
  createDefaultMemoryProfile,
  addContextEntry,
  getAllTags,
  migrateLegacyEntries,
  type CharacterMemoryProfile,
  type ContextEntry
} from "@/lib/memory-types"
import { FloatingChat } from "@/components/memory/floating-chat"
import { UnifiedSoulHeader } from "@/components/unified-soul-header"
import { PrivacySettingsDialog } from "@/components/privacy-settings-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  type PrivacySettings,
  loadPrivacySettings,
  applyPrivacyFilters
} from "@/lib/privacy-filters"
import { 
  exportSingleProfile, 
  downloadJSON, 
  generateExportFilename,
  parseImportData,
  validateProfile
} from "@/lib/memory-export"

// Import tab components
import { ContextNotesTab } from "@/components/memory/context-notes-tab"

export default function ContextNotesPage() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useWallet()
  
  const [soul, setSoul] = useState<StoredSoul | null>(null)
  const [memoryProfile, setMemoryProfile] = useState<CharacterMemoryProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPrivacySettings, setShowPrivacySettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    enabled: false,
    patterns: []
  })

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    autoSave: true,
    entriesPerPage: 20,
    defaultEntryType: 'context',
    showTimestamps: true,
    compactView: false,
    enableTagSuggestions: true,
    privacyMode: false
  })

  useEffect(() => {
    const fetchSoul = async () => {
      const nftId = params.id as string
      if (nftId) {
        const foundSoul = await getSoul(nftId)
        setSoul(foundSoul)
      }
    }
    fetchSoul()
  }, [params.id])

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(`oni-context-settings-${params.id}`)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettingsForm(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    
    // Load privacy settings
    if (params.id) {
      const loadedPrivacySettings = loadPrivacySettings(params.id as string)
      setPrivacySettings(loadedPrivacySettings)
    }
  }, [params.id])

  useEffect(() => {
    async function loadMemoryData() {
      // Client-side only
      if (typeof window === 'undefined') return
      
      const nftId = params.id as string
      if (!nftId) {
        setError("No NFT ID provided")
        setIsLoading(false)
        return
      }

      try {
        // Get the soul data
        const foundSoul = await getSoul(nftId)
        if (!foundSoul) {
          setError("Character soul not found")
          setIsLoading(false)
          return
        }

        setSoul(foundSoul)

        // TODO: Add wallet validation here
        // For now, we'll allow access but add validation later
        if (!isConnected) {
          // Redirect to login/wallet connection
          router.push("/?connect=true")
          return
        }

        // Get or create memory profile
        let profile = getMemoryProfile(nftId)
        
        if (!profile) {
          // Create new memory profile from existing data
          let conversationMemory = getCharacterMemories(nftId)
          if (!conversationMemory) {
            conversationMemory = createCharacterMemory(nftId, foundSoul.data.soulName)
          }
          
          const enhancedMemory = upgradeToEnhancedMemory(conversationMemory)
          
          profile = createDefaultMemoryProfile(
            nftId,
            foundSoul.data,
            conversationMemory,
            enhancedMemory
          )
          
          // Set wallet address if available
          if (address) {
            profile.metadata.walletAddress = address
          }
          
          saveMemoryProfile(profile)
        }

        setMemoryProfile(profile)
      } catch (err) {
        console.error("Error loading memory data:", err)
        setError("Failed to load memory data")
      } finally {
        setIsLoading(false)
      }
    }

    loadMemoryData()
  }, [params.id, isConnected, address, router])

  const handleUpdateMemoryProfile = (updates: Partial<CharacterMemoryProfile>) => {
    if (!memoryProfile) return

    const updatedProfile = {
      ...memoryProfile,
      ...updates,
      metadata: {
        ...memoryProfile.metadata,
        ...updates.metadata,
        lastUpdated: new Date()
      }
    }

    setMemoryProfile(updatedProfile)
    saveMemoryProfile(updatedProfile)
  }

  const handleExportProfile = () => {
    if (!memoryProfile) return
    
    let exportData = exportSingleProfile(memoryProfile)
    
    // Apply privacy filters if enabled
    if (privacySettings.enabled) {
      const exportString = JSON.stringify(exportData, null, 2)
      const filteredString = applyPrivacyFilters(exportString, privacySettings)
      exportData = JSON.parse(filteredString)
    }
    
    const filename = generateExportFilename(memoryProfile)
    downloadJSON(exportData, filename)
  }

  const handleImportProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importData = parseImportData(content)
        
        if (importData.profiles.length > 0) {
          const importedProfile = importData.profiles[0]
          
          if (validateProfile(importedProfile)) {
            // Update current profile with imported data
            handleUpdateMemoryProfile(importedProfile)
            alert('Profile imported successfully!')
          } else {
            alert('Invalid profile format')
          }
        }
      } catch (error) {
        console.error('Import error:', error)
        alert('Failed to import profile: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }
    
    reader.readAsText(file)
    // Reset input
    event.target.value = ''
  }

  const saveSettings = () => {
    localStorage.setItem(`oni-context-settings-${params.id}`, JSON.stringify(settingsForm))
    setShowSettings(false)
  }

  const handleSettings = () => {
    setShowSettings(true)
  }

  const handlePrivacySettingsChange = (newSettings: PrivacySettings) => {
    setPrivacySettings(newSettings)
    setSettingsForm(prev => ({ ...prev, privacyMode: newSettings.enabled }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-purple-300">Loading context & notes...</p>
        </div>
      </div>
    )
  }

  if (error || !soul || !memoryProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-red-300">{error || "Failed to load data"}</p>
          <Button 
            onClick={() => router.push("/souls")} 
            variant="outline"
            className="mt-4 border-purple-500/30 hover:bg-purple-900/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Souls
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <UnifiedSoulHeader
        soul={soul}
        onExport={handleExportProfile}
        onSettings={handleSettings}
        onDelete={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StickyNote className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  Context & Notes
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage contextual information, notes, and memories for {soul.data.soulName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/30 hover:bg-purple-900/20"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/30 hover:bg-purple-900/20"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/30 hover:bg-purple-900/20"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'View Mode' : 'Edit'}
              </Button>
            </div>
          </div>
        </div>

        {/* Context & Notes Content */}
        <div className="space-y-6">
          <ContextNotesTab
            memoryProfile={memoryProfile}
            onUpdate={handleUpdateMemoryProfile}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        </div>

        {/* Hidden file input for import */}
        <input
          id="import-file"
          type="file"
          accept=".json"
          onChange={handleImportProfile}
          style={{ display: 'none' }}
        />

        {/* Floating Chat */}
        {showChat && (
          <FloatingChat
            soul={soul}
            memoryProfile={memoryProfile}
            onUpdateMemory={handleUpdateMemoryProfile}
            onClose={() => setShowChat(false)}
          />
        )}

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="border border-purple-500/30 bg-black/90 backdrop-blur-sm max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-purple-300">Context & Notes Settings</DialogTitle>
              <DialogDescription>
                Customize how your context and notes are managed and displayed.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-300">General</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-purple-200">Auto-save entries</Label>
                    <p className="text-sm text-muted-foreground">Automatically save changes as you type</p>
                  </div>
                  <Switch
                    checked={settingsForm.autoSave}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, autoSave: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-200">Entries per page</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settingsForm.entriesPerPage]}
                      onValueChange={([value]) => 
                        setSettingsForm(prev => ({ ...prev, entriesPerPage: value }))
                      }
                      max={50}
                      min={5}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm text-purple-300 w-12">{settingsForm.entriesPerPage}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-200">Default entry type</Label>
                  <select
                    value={settingsForm.defaultEntryType}
                    onChange={(e) => 
                      setSettingsForm(prev => ({ 
                        ...prev, 
                        defaultEntryType: e.target.value as "context" | "session" | "plot" | "note" | "world"
                      }))
                    }
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white"
                  >
                    <option value="context">Context</option>
                    <option value="session">Session Note</option>
                    <option value="plot">Plot Hook</option>
                    <option value="note">Freeform Note</option>
                    <option value="world">World Building</option>
                  </select>
                </div>
              </div>

              {/* Display Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-300">Display</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-purple-200">Show timestamps</Label>
                    <p className="text-sm text-muted-foreground">Display creation dates on entries</p>
                  </div>
                  <Switch
                    checked={settingsForm.showTimestamps}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, showTimestamps: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-purple-200">Compact view</Label>
                    <p className="text-sm text-muted-foreground">Use smaller cards for entries</p>
                  </div>
                  <Switch
                    checked={settingsForm.compactView}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, compactView: checked }))
                    }
                  />
                </div>
              </div>

              {/* Tag Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-300">Tags & Organization</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-purple-200">Enable tag suggestions</Label>
                    <p className="text-sm text-muted-foreground">Show suggested tags based on content</p>
                  </div>
                  <Switch
                    checked={settingsForm.enableTagSuggestions}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, enableTagSuggestions: checked }))
                    }
                  />
                </div>
              </div>

              {/* Memory & Privacy */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-300">Memory & Privacy</h3>
                
                <div className="space-y-2">
                  <Label className="text-purple-200">Privacy mode</Label>
                  <p className="text-sm text-muted-foreground">Hide sensitive information in exports</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settingsForm.privacyMode}
                    onCheckedChange={(checked) => 
                      setSettingsForm(prev => ({ ...prev, privacyMode: checked }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrivacySettings(true)}
                    className="text-purple-300 border-purple-500/30"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-purple-500/20">
              <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(false)}
                className="border-purple-500/30"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Privacy Settings Dialog */}
        <PrivacySettingsDialog
          open={showPrivacySettings}
          onOpenChange={setShowPrivacySettings}
          nftId={params.id as string}
          onSettingsChange={handlePrivacySettingsChange}
        />
      </div>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStoredSouls } from "@/lib/storage-wrapper"
import { useWallet } from "@/components/wallet/wallet-provider"

export default function DebugStoragePage() {
  const { address } = useWallet()
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const [souls, setSouls] = useState<any[]>([])
  const [rawData, setRawData] = useState<string>("")

  useEffect(() => {
    loadStorageData()
  }, [])

  const loadStorageData = () => {
    // Get raw localStorage data
    const raw = localStorage.getItem("oni-souls")
    setRawData(raw || "No data found")
    
    try {
      if (raw) {
        const parsed = JSON.parse(raw)
        setLocalStorageData(parsed)
      }
    } catch (error) {
      console.error("Error parsing localStorage:", error)
    }

    // Get souls using the storage wrapper
    const storedSouls = getStoredSouls()
    setSouls(storedSouls)
  }

  const clearLocalStorage = () => {
    if (confirm("Are you sure you want to clear all localStorage data?")) {
      localStorage.removeItem("oni-souls")
      localStorage.removeItem("oni-souls-last-sync")
      loadStorageData()
    }
  }

  const addTestSoul = () => {
    const testData = {
      pfpId: "9999",
      soulName: "Test Soul " + Date.now(),
      archetype: "Test Archetype",
      background: "Test Background",
      traits: [],
      imageUrl: "https://placeholder.com/test.jpg"
    }
    
    // Import storeSoul directly to test
    import("@/lib/storage-wrapper").then(({ storeSoul }) => {
      storeSoul(testData)
      loadStorageData()
    })
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Storage Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">Wallet Address:</p>
              <p className="text-sm text-muted-foreground">{address || "Not connected"}</p>
            </div>

            <div>
              <p className="font-semibold">Souls from getStoredSouls():</p>
              <p className="text-sm text-muted-foreground">Count: {souls.length}</p>
              {souls.length > 0 && (
                <pre className="mt-2 p-2 bg-black/50 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(souls, null, 2)}
                </pre>
              )}
            </div>

            <div>
              <p className="font-semibold">Raw localStorage['oni-souls']:</p>
              <pre className="mt-2 p-2 bg-black/50 rounded text-xs overflow-auto max-h-60">
                {rawData}
              </pre>
            </div>

            <div>
              <p className="font-semibold">Parsed localStorage data:</p>
              {localStorageData && (
                <pre className="mt-2 p-2 bg-black/50 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(localStorageData, null, 2)}
                </pre>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={loadStorageData} variant="outline">
                Refresh Data
              </Button>
              <Button onClick={addTestSoul} variant="outline">
                Add Test Soul
              </Button>
              <Button onClick={clearLocalStorage} variant="destructive">
                Clear All Storage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
"use client"

import { Button } from "@/components/ui/button"
import { Loader2, User, LogOut } from "lucide-react"
import { useMatrica } from "./matrica-provider"

export function MatricaConnectButton() {
  const { user, isConnected, isConnecting, connect, disconnect, error } = useMatrica()

  const handleConnect = () => {
    connect()
  }

  const handleDisconnect = () => {
    console.log("Matrica disconnect button clicked")
    disconnect()
  }

  return (
    <div className="flex flex-col items-end">
      {isConnected ? (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 hover:from-indigo-900/70 hover:to-purple-900/70 text-indigo-100 border-indigo-500/50"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {user?.username || 'Matrica User'}
            </span>
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDisconnect} title="Disconnect from Matrica">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <User className="mr-2 h-4 w-4" />
              Connect with Matrica
            </>
          )}
        </Button>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
} 
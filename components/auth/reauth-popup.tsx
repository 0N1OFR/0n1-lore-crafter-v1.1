"use client"

import React from "react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Loader2, Shield } from "lucide-react"

export function ReauthPopup() {
  const { 
    showReauthPopup, 
    dismissReauth, 
    authenticate, 
    isAuthenticating,
    authError,
    logout 
  } = useAuth()

  const handleReauth = async () => {
    await authenticate()
    if (!authError) {
      dismissReauth()
    }
  }

  const handleLogout = () => {
    dismissReauth()
    logout()
  }

  return (
    <Dialog open={showReauthPopup} onOpenChange={() => {}}>
      <DialogContent className="border border-orange-500/30 bg-black/95 backdrop-blur-sm max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <DialogTitle className="text-xl">Session Expired</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your authentication session has expired. Please sign again to continue using the app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              {authError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleReauth}
              disabled={isAuthenticating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Sign to Continue
                </>
              )}
            </Button>

            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full border-gray-600 hover:bg-gray-800"
            >
              Logout & Start Over
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This signature request will not cost any gas fees.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "./auth-provider"
import { 
  Database, 
  CloudUpload, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Shield,
  Users,
  MessageSquare,
  Brain,
  Loader2
} from "lucide-react"

export function MigrationDashboard() {
  const { 
    user, 
    isDatabaseConnected, 
    migrationStatus, 
    migrateToDatabaseNow, 
    syncFromDatabase,
    isLoading,
    error 
  } = useAuth()

  if (!user) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700">
            Connect your wallet or Matrica account to access secure cloud storage.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!isDatabaseConnected) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Database Not Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            Supabase database is not configured. Your data is currently stored locally only.
          </p>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Security Risk</AlertTitle>
            <AlertDescription>
              localStorage can be cleared by browser settings, incognito mode, or device changes. 
              Set up Supabase for secure, permanent storage.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {user.username || user.wallet_address || user.matrica_id}
              </p>
              <p className="text-sm text-muted-foreground">
                Connected via {user.wallet_address ? 'Wallet' : 'Matrica'}
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Authenticated
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Migration Status */}
      {migrationStatus.needed && !migrationStatus.completed && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-blue-600" />
              Data Migration Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Secure Your Data</AlertTitle>
              <AlertDescription>
                We detected data stored locally. Migrate to secure cloud storage to prevent data loss
                and enable access across devices.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <Brain className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">Souls</p>
                <p className="text-xs text-muted-foreground">Character data</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Chats</p>
                <p className="text-xs text-muted-foreground">Conversation history</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <Database className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Memories</p>
                <p className="text-xs text-muted-foreground">AI memories</p>
              </div>
            </div>

            {migrationStatus.inProgress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Migrating your data...</span>
                </div>
                <Progress value={50} className="w-full" />
              </div>
            ) : (
              <Button 
                onClick={migrateToDatabaseNow} 
                className="w-full"
                disabled={isLoading}
              >
                <CloudUpload className="h-4 w-4 mr-2" />
                Migrate to Secure Storage
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Migration Results */}
      {migrationStatus.completed && migrationStatus.result && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Migration Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {migrationStatus.result.souls}
                </p>
                <p className="text-sm text-muted-foreground">Souls migrated</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {migrationStatus.result.chats}
                </p>
                <p className="text-sm text-muted-foreground">Chats migrated</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {migrationStatus.result.memories}
                </p>
                <p className="text-sm text-muted-foreground">Memories migrated</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All data secured in cloud storage
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Database Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={syncFromDatabase}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync from Database
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pull latest data from cloud storage to this device
          </p>
        </CardContent>
      </Card>

      {/* Security Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Cross-device synchronization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Automatic backups</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Row-level security (RLS)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">No data loss from browser clearing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">User-specific data isolation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 
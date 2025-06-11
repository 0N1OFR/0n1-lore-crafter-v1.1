import { NextRequest, NextResponse } from "next/server"
import { checkOwnershipRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { migrateLocalStorageToSupabase, setCurrentWalletAddress } from '@/lib/storage-supabase'

export async function POST(request: NextRequest) {
  // Check rate limit first
  const rateLimitResult = checkOwnershipRateLimit(request)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime, "migration"),
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  try {
    const { walletAddress, characterData } = await request.json()

    // Input validation
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" }, 
        { status: 400 }
      )
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/i.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" }, 
        { status: 400 }
      )
    }

    // If specific character data is provided, migrate just that character
    if (characterData) {
      setCurrentWalletAddress(walletAddress)
      
      // Import the storeSoul function and migrate single character
      const { storeSoul } = await import('@/lib/storage-supabase')
      const soulId = await storeSoul(characterData)
      
      return NextResponse.json({ 
        success: true,
        migratedCount: 1,
        soulId,
        message: "Character migrated successfully"
      })
    }

    // Otherwise, migrate all localStorage data for this wallet
    console.log(`Starting migration for wallet: ${walletAddress}`)
    
    const migrationResult = await migrateLocalStorageToSupabase(walletAddress)
    
    if (migrationResult.success) {
      return NextResponse.json({
        success: true,
        migratedCount: migrationResult.migratedCount,
        message: `Successfully migrated ${migrationResult.migratedCount} characters to Supabase`
      })
    } else {
      return NextResponse.json({
        success: false,
        migratedCount: migrationResult.migratedCount,
        errors: migrationResult.errors,
        message: `Migration completed with errors. ${migrationResult.migratedCount} characters migrated.`
      }, { status: 207 }) // 207 Multi-Status for partial success
    }

  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Migration failed", 
        message: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from "next/server"
import { checkOwnershipRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { saveSoul } from '@/lib/storage'

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
      // Migrate single character
      const soulData = {
        data: characterData,
        timestamp: Date.now()
      }
      const success = await saveSoul(soulData, walletAddress)
      
      return NextResponse.json({ 
        success,
        migratedCount: success ? 1 : 0,
        message: success ? "Character migrated successfully" : "Failed to migrate character"
      })
    }

    // For bulk migration, we would need to implement localStorage reading
    // For now, return an error since we can't access localStorage server-side
      return NextResponse.json({
        success: false,
      error: "Bulk migration not supported server-side. Please migrate characters individually from the client."
    }, { status: 400 })

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
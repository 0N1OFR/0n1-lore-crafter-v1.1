import { NextRequest, NextResponse } from "next/server"
import { checkOwnershipRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { validateNFTOwnership } from '@/lib/validation'

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY
const ON1_CONTRACT_ADDRESS = "0x3bf2922f4520a8ba0c2efc3d2a1539678dad5e9d"

export async function GET(request: NextRequest) {
  // Check rate limit first
  const rateLimitResult = checkOwnershipRateLimit(request)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime, "ownership verification"),
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const tokenId = searchParams.get("tokenId")

  // 🛡️ COMPREHENSIVE INPUT VALIDATION - Prevent injection attacks
  const validation = validateNFTOwnership({ address, tokenId })
  
  if (!validation.isValid) {
    console.warn('Ownership verification validation failed:', validation.errors)
    return NextResponse.json(
      { 
        error: "Invalid input parameters", 
        details: validation.errors.map(e => e.message).join(', ')
      }, 
      { status: 400 }
    )
  }

  // Use sanitized data
  const { address: sanitizedAddress, tokenId: sanitizedTokenId } = validation.sanitized

  if (!OPENSEA_API_KEY) {
    return NextResponse.json(
      { error: "OpenSea API key is not configured" }, 
      { status: 500 }
    )
  }

  try {
    // Method 1: Check via OpenSea API (faster, but depends on OpenSea)
    const ownsViaOpenSea = await checkOwnershipViaOpenSea(sanitizedAddress, sanitizedTokenId)
    
    return NextResponse.json({ 
      owns: ownsViaOpenSea,
      method: "opensea"
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
      },
    })
  } catch (error) {
    console.error("Ownership verification failed:", error)
    return NextResponse.json(
      { error: "Failed to verify ownership" }, 
      { status: 500 }
    )
  }
}

async function checkOwnershipViaOpenSea(address: string, tokenId: string): Promise<boolean> {
  const normalizedTokenId = tokenId.replace(/^0+/, "")
  
  // Check if this specific NFT is owned by the address
  const url = `https://api.opensea.io/api/v2/chain/ethereum/contract/${ON1_CONTRACT_ADDRESS}/nfts/${normalizedTokenId}`
  
  console.log(`Verifying ownership: ${address} owns NFT #${normalizedTokenId}`)
  
  const response = await fetch(url, {
    headers: {
      "X-API-KEY": OPENSEA_API_KEY!,
      "Accept": "application/json",
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  })

  if (!response.ok) {
    console.error(`OpenSea ownership API error: ${response.status}`)
    throw new Error(`OpenSea API error: ${response.status}`)
  }

  const data = await response.json()
  
  // Check if the current owner matches the provided address
  const currentOwner = data.nft?.owners?.[0]?.address || data.nft?.owner
  const owns = currentOwner?.toLowerCase() === address.toLowerCase()
  
  console.log(`Ownership result: ${address} ${owns ? 'OWNS' : 'DOES NOT OWN'} NFT #${normalizedTokenId}`)
  
  return owns
} 
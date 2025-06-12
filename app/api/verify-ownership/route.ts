import { NextRequest, NextResponse } from "next/server"
import { checkOwnershipRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { COLLECTIONS, CollectionKey } from '@/lib/collection-config'

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY

export async function GET(request: NextRequest) {
  // Check rate limit first
  const rateLimitResult = checkOwnershipRateLimit(request)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime, "ownership verification"),
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

  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const tokenId = searchParams.get("tokenId")

  // Input validation
  if (!address || !tokenId) {
    return NextResponse.json(
      { error: "Address and tokenId parameters are required" }, 
      { status: 400 }
    )
  }

  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/i.test(address)) {
    return NextResponse.json(
      { error: "Invalid Ethereum address format" }, 
      { status: 400 }
    )
  }

  // Validate token ID format
  if (!/^\d+$/.test(tokenId)) {
    return NextResponse.json(
      { error: "Invalid token ID format" }, 
      { status: 400 }
    )
  }

  if (!OPENSEA_API_KEY) {
    return NextResponse.json(
      { error: "OpenSea API key is not configured" }, 
      { status: 500 }
    )
  }

  try {
    // Check ownership across both Force and Frame collections
    const [ownsForce, ownsFrame] = await Promise.all([
      checkOwnershipViaOpenSea(address, tokenId, 'force'),
      checkOwnershipViaOpenSea(address, tokenId, 'frame')
    ])
    
    const owns = ownsForce || ownsFrame
    const ownedCollections = []
    if (ownsForce) ownedCollections.push('force')
    if (ownsFrame) ownedCollections.push('frame')
    
    return NextResponse.json({ 
      owns,
      ownedCollections,
      ownsForce,
      ownsFrame,
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

async function checkOwnershipViaOpenSea(address: string, tokenId: string, collection: CollectionKey): Promise<boolean> {
  const normalizedTokenId = tokenId.replace(/^0+/, "")
  const contractAddress = COLLECTIONS[collection].contractAddress
  
  // Check if this specific NFT is owned by the address
  const url = `https://api.opensea.io/api/v2/chain/ethereum/contract/${contractAddress}/nfts/${normalizedTokenId}`
  
  console.log(`Verifying ${COLLECTIONS[collection].displayName} ownership: ${address} owns NFT #${normalizedTokenId}`)
  
  try {
    const response = await fetch(url, {
      headers: {
        "X-API-KEY": OPENSEA_API_KEY!,
        "Accept": "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error(`OpenSea ${collection} ownership API error: ${response.status}`)
      return false // Return false instead of throwing to allow other collection checks
    }

    const data = await response.json()
    
    // Check if the current owner matches the provided address
    const currentOwner = data.nft?.owners?.[0]?.address || data.nft?.owner
    const owns = currentOwner?.toLowerCase() === address.toLowerCase()
    
    console.log(`${COLLECTIONS[collection].displayName} ownership result: ${address} ${owns ? 'OWNS' : 'DOES NOT OWN'} NFT #${normalizedTokenId}`)
    
    return owns
  } catch (error) {
    console.error(`Error checking ${collection} ownership:`, error)
    return false // Return false on error to allow other collection checks
  }
} 
import { NextRequest, NextResponse } from "next/server"
import { checkOpenSeaRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { COLLECTIONS, CollectionKey, getAllCollectionKeys } from '@/lib/collection-config'
import { UnifiedCharacter, UnifiedCharacterResponse } from '@/lib/types'

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY

async function fetchCollectionNfts(address: string, collection: CollectionKey): Promise<any[]> {
  const config = COLLECTIONS[collection]
  // Use contract address instead of collection slug for more reliable results
  const url = `https://api.opensea.io/v2/chain/ethereum/account/${address}/nfts?asset_contract_address=${config.contractAddress}&limit=50`
  
  console.log(`Fetching ${config.displayName} NFTs: ${url}`)
  
  try {
    const response = await fetch(url, {
      headers: { "X-API-KEY": OPENSEA_API_KEY!, Accept: "application/json" },
      next: { revalidate: 3600 }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch ${config.displayName} NFTs: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    const nfts = data.nfts || []
    
    console.log(`Found ${nfts.length} ${config.displayName} NFTs`)
    console.log(`${config.displayName} NFT IDs:`, nfts.map((nft: any) => nft.identifier))
    
    // Log detailed info for debugging
    if (nfts.length > 0) {
      console.log(`${config.displayName} detailed data:`, JSON.stringify(nfts.map((nft: any) => ({
        identifier: nft.identifier,
        name: nft.name,
        image_url: nft.image_url,
        contract: nft.contract
      })), null, 2))
    }
    
    return nfts
  } catch (error) {
    console.error(`Error fetching ${config.displayName} NFTs:`, error)
    return []
  }
}

export async function GET(request: NextRequest) {
  // Check rate limit first
  const rateLimitResult = checkOpenSeaRateLimit(request)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime, "OpenSea"),
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

  if (!address) {
    return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
  }

  if (!OPENSEA_API_KEY) {
    return NextResponse.json({ error: "OpenSea API key is not configured" }, { status: 500 })
  }

  console.log(`Fetching unified characters for address ${address}`)

  try {
    // Fetch both Force and Frame NFTs in parallel
    const [forceNfts, frameNfts] = await Promise.all([
      fetchCollectionNfts(address, 'force'),
      fetchCollectionNfts(address, 'frame')
    ])
    
    // Filter out NFTs with missing image URLs as they might be stale data
    const validForceNfts = forceNfts.filter(nft => nft.image_url && nft.image_url.trim() !== '')
    const validFrameNfts = frameNfts.filter(nft => nft.image_url && nft.image_url.trim() !== '')
    
    console.log(`Filtered to ${validForceNfts.length} valid Force NFTs and ${validFrameNfts.length} valid Frame NFTs`)
    
    if (validForceNfts.length !== forceNfts.length) {
      console.log('Filtered out Force NFTs with missing images:', 
        forceNfts.filter(nft => !nft.image_url || nft.image_url.trim() === '').map(nft => nft.identifier))
    }
    
    if (validFrameNfts.length !== frameNfts.length) {
      console.log('Filtered out Frame NFTs with missing images:', 
        frameNfts.filter(nft => !nft.image_url || nft.image_url.trim() === '').map(nft => nft.identifier))
    }

    // Group by token ID to create unified characters
    const characterMap = new Map<string, UnifiedCharacter>()
    
    // Process Force NFTs (using filtered valid NFTs)
    validForceNfts.forEach((nft: any) => {
      characterMap.set(nft.identifier, {
        tokenId: nft.identifier,
        forceImageUrl: nft.image_url,
        frameImageUrl: null,
        hasForce: true,
        hasFrame: false,
        displayName: `0N1 #${nft.identifier}`
      })
    })
    
    // Process Frame NFTs (using filtered valid NFTs)
    validFrameNfts.forEach((nft: any) => {
      const existing = characterMap.get(nft.identifier)
      if (existing) {
        // Add frame to existing force character
        existing.frameImageUrl = nft.image_url
        existing.hasFrame = true
      } else {
        // Frame-only character
        characterMap.set(nft.identifier, {
          tokenId: nft.identifier,
          forceImageUrl: null,
          frameImageUrl: nft.image_url,
          hasForce: false,
          hasFrame: true,
          displayName: `0N1 #${nft.identifier}`
        })
      }
    })

    const characters = Array.from(characterMap.values())
    
    console.log(`Created ${characters.length} unified characters`)
    console.log(`Valid Force NFTs: ${validForceNfts.length}, Valid Frame NFTs: ${validFrameNfts.length}`)
    console.log(`Raw Force NFTs: ${forceNfts.length}, Raw Frame NFTs: ${frameNfts.length}`)
    
    const response: UnifiedCharacterResponse = {
      characters,
      totalCount: characters.length
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error("Error fetching unified characters:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch unified characters",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

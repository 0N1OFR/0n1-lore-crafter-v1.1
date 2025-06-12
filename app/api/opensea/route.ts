import { NextRequest, NextResponse } from "next/server"
import { checkOpenSeaRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { COLLECTIONS, CollectionKey } from '@/lib/collection-config'

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY

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
  const tokenId = searchParams.get("tokenId")
  const collection = searchParams.get("collection") as CollectionKey || 'force' // Default to force for backward compatibility

  if (!tokenId) {
    return NextResponse.json({ error: "Token ID is required" }, { status: 400 })
  }

  // Validate collection parameter
  if (!COLLECTIONS[collection]) {
    return NextResponse.json({ error: "Invalid collection parameter" }, { status: 400 })
  }

  // Normalize token ID by removing leading zeros
  const normalizedTokenId = tokenId.replace(/^0+/, "")
  const contractAddress = COLLECTIONS[collection].contractAddress

  if (!OPENSEA_API_KEY) {
    return NextResponse.json(
      { error: "OpenSea API key is not configured" },
      { status: 500 }
    )
  }

  try {
    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    console.log(`Fetching OpenSea data for ${COLLECTIONS[collection].displayName} token ${normalizedTokenId}...`)

    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/ethereum/contract/${contractAddress}/nfts/${normalizedTokenId}`,
      {
        headers: {
          Accept: "application/json",
          "X-API-KEY": OPENSEA_API_KEY,
        },
        signal: controller.signal,
        next: { revalidate: 86400 }, // Cache for 24 hours (NFT metadata rarely changes)
      },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`OpenSea API error for ${collection} token ${normalizedTokenId}: ${response.status} ${response.statusText}`)

      // Log response body for debugging
      try {
        const errorBody = await response.text()
        console.error(`Error response body: ${errorBody}`)
      } catch (e) {
        console.error(`Could not read error response body: ${e}`)
      }

      return NextResponse.json(
        {
          error: `OpenSea API error: ${response.status}`,
          message: `Failed to fetch data for ${collection} token ID ${normalizedTokenId}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log(`Successfully fetched data for ${collection} token ${normalizedTokenId}`)
    
    // Add collection info to response
    const enhancedData = {
      ...data,
      collection: collection,
      collectionInfo: COLLECTIONS[collection]
    }
    
    // Return with cache headers for client-side caching
    return NextResponse.json(enhancedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800', // Cache for 24h, serve stale for 48h
      },
    })
  } catch (error) {
    console.error(`Error fetching from OpenSea for ${collection} token ${normalizedTokenId}:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch data from OpenSea",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

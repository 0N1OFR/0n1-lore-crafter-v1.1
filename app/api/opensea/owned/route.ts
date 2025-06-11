import { NextRequest, NextResponse } from "next/server"
import { checkOpenSeaRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

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

  if (!address) {
    return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
  }

  if (!OPENSEA_API_KEY) {
    return NextResponse.json({ error: "OpenSea API key is not configured" }, { status: 500 })
  }

  console.log(`Fetching NFTs for address ${address}`)
  console.log(`Using OpenSea API key: [CONFIGURED]`)

  try {
    // Using the most current OpenSea API v2 endpoint format
    const url = `https://api.opensea.io/v2/chain/ethereum/account/${address}/nfts?collection=0n1-force&limit=50`

    console.log(`Calling OpenSea API: ${url}`)

    const response = await fetch(url, {
      headers: {
        "X-API-KEY": OPENSEA_API_KEY,
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour (owned NFTs can change more frequently)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenSea API error: ${response.status}`, errorText)

      // Try alternative endpoint if the first one fails
      console.log("First endpoint failed, trying alternative endpoint...")
      const altUrl = `https://api.opensea.io/api/v2/assets/ethereum?owner=${address}&collection=0n1-force&limit=50`

      console.log(`Calling alternative OpenSea API: ${altUrl}`)

      const altResponse = await fetch(altUrl, {
        headers: {
          "X-API-KEY": OPENSEA_API_KEY,
          Accept: "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!altResponse.ok) {
        const altErrorText = await altResponse.text()
        console.error(`Alternative OpenSea API error: ${altResponse.status}`, altErrorText)
        return NextResponse.json(
          {
            error: `OpenSea API error: ${altResponse.status}`,
            details: altErrorText,
          },
          { status: altResponse.status },
        )
      }

      const altData = await altResponse.json()
      console.log(`Alternative API response received`)

      // Map the alternative API response
      const altNfts = altData.assets
        ? altData.assets.map((asset: any) => ({
            identifier: asset.token_id,
            name: asset.name || `0N1 Force #${asset.token_id}`,
            image_url: asset.image_url || asset.image_preview_url || null,
          }))
        : []

      console.log(`Processed ${altNfts.length} NFTs from alternative endpoint`)
      return NextResponse.json({ nfts: altNfts }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      })
    }

    const data = await response.json()
    console.log(`OpenSea API response received`)

    // The v2 API returns data in a different format
    const nfts = data.nfts
      ? data.nfts.map((nft: any) => ({
          identifier: nft.identifier,
          name: nft.name || `0N1 Force #${nft.identifier}`,
          image_url: nft.image_url || null,
        }))
      : []

    console.log(`Processed ${nfts.length} NFTs`)
    
    // Return with cache headers for client-side caching
    return NextResponse.json({ nfts }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache for 1h, serve stale for 2h
      },
    })
  } catch (error) {
    console.error("Error fetching owned NFTs:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch owned NFTs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from "next/server"

const MATRICA_API_URL = "https://api.matrica.io"
const ON1_COLLECTION_IDENTIFIER = "0n1-force" // Matrica collection identifier for 0N1 Force

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      )
    }

    const accessToken = authHeader.substring(7) // Remove 'Bearer ' prefix

    console.log("Fetching user NFTs from Matrica API...")

    // Fetch user's NFTs from Matrica - this combines all linked wallets
    const nftsResponse = await fetch(`${MATRICA_API_URL}/v1/user/nfts?collection=${ON1_COLLECTION_IDENTIFIER}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!nftsResponse.ok) {
      const errorText = await nftsResponse.text()
      console.error("Matrica NFTs API failed:", errorText)
      return NextResponse.json(
        { error: "Failed to fetch NFTs", details: errorText },
        { status: nftsResponse.status }
      )
    }

    const nftsData = await nftsResponse.json()

    // Transform the data to match our expected format
    const transformedNfts = (nftsData.nfts || []).map((nft: any) => ({
      identifier: nft.token_id || nft.identifier,
      name: nft.name || `0N1 Force #${nft.token_id || nft.identifier}`,
      image_url: nft.image_url || nft.image,
      collection: nft.collection,
      verified: true, // Matrica verification means ownership is verified
    }))

    console.log(`Successfully fetched ${transformedNfts.length} 0N1 Force NFTs from Matrica`)

    return NextResponse.json({
      nfts: transformedNfts,
      total: transformedNfts.length,
      verified_by: "matrica"
    })
  } catch (error) {
    console.error("Error fetching Matrica NFTs:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 
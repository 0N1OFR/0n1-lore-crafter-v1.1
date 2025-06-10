import { NextResponse } from "next/server"

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY
const ON1_CONTRACT_ADDRESS = "0x3bf2922f4520a8ba0c2efc3d2a1539678dad5e9d"

export async function GET(request: Request) {
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
    // Method 1: Check via OpenSea API (faster, but depends on OpenSea)
    const ownsViaOpenSea = await checkOwnershipViaOpenSea(address, tokenId)
    
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
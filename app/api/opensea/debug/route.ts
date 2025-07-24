import { NextRequest, NextResponse } from "next/server"
import { COLLECTIONS } from '@/lib/collection-config'

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY

export async function GET(req: NextRequest) {
  // Only allow in development or with special header
  const isDev = process.env.NODE_ENV === 'development'
  const hasDebugHeader = req.headers.get('x-debug-opensea') === 'true'
  
  if (!isDev && !hasDebugHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const testAddress = searchParams.get('address')
  const testTokenId = searchParams.get('tokenId')

  const diagnostics = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    apiKey: {
      exists: !!OPENSEA_API_KEY,
      length: OPENSEA_API_KEY ? OPENSEA_API_KEY.length : 0,
      prefix: OPENSEA_API_KEY ? OPENSEA_API_KEY.substring(0, 8) + '...' : 'NOT_SET',
      isPlaceholder: OPENSEA_API_KEY === 'your_opensea_api_key_here',
    },
    collections: COLLECTIONS,
    testCall: null as any,
    nftTests: [] as any[]
  }

  // Try a simple API call
  if (OPENSEA_API_KEY && OPENSEA_API_KEY !== 'your_opensea_api_key_here') {
    try {
      const testUrl = 'https://api.opensea.io/v2/collections/0n1-force/stats'
      const response = await fetch(testUrl, {
        headers: {
          'X-API-KEY': OPENSEA_API_KEY,
          'Accept': 'application/json',
        },
      })

      diagnostics.testCall = {
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        headers: {
          'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
        },
        success: response.ok
      }

      if (!response.ok) {
        const errorText = await response.text()
        diagnostics.testCall.error = errorText.substring(0, 200)
      }
    } catch (error) {
      diagnostics.testCall = {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'FETCH_ERROR'
      }
    }

    // Test specific NFT fetching if tokenId provided
    if (testTokenId) {
      try {
        const forceContract = COLLECTIONS.force.contractAddress
        const nftUrl = `https://api.opensea.io/v2/chain/ethereum/contract/${forceContract}/nfts/${testTokenId}`
        
        const nftResponse = await fetch(nftUrl, {
          headers: {
            'X-API-KEY': OPENSEA_API_KEY,
            'Accept': 'application/json',
          },
        })

        const nftData = await nftResponse.json()
        
        diagnostics.nftTests.push({
          type: 'specific_nft',
          tokenId: testTokenId,
          url: nftUrl,
          status: nftResponse.status,
          success: nftResponse.ok,
          data: nftResponse.ok ? {
            identifier: nftData.nft?.identifier,
            name: nftData.nft?.name,
            image_url: nftData.nft?.image_url,
            contract: nftData.nft?.contract,
            owners: nftData.nft?.owners?.length || 0
          } : { error: nftData }
        })
      } catch (error) {
        diagnostics.nftTests.push({
          type: 'specific_nft',
          tokenId: testTokenId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Test address NFT fetching if address provided
    if (testAddress) {
      try {
        const params = new URLSearchParams({
          asset_contract_address: COLLECTIONS.force.contractAddress,
          limit: '10'
        })
        const addressUrl = `https://api.opensea.io/v2/chain/ethereum/account/${encodeURIComponent(testAddress)}/nfts?${params.toString()}`
        
        const addressResponse = await fetch(addressUrl, {
          headers: {
            'X-API-KEY': OPENSEA_API_KEY,
            'Accept': 'application/json',
          },
        })

        const addressData = await addressResponse.json()
        
        diagnostics.nftTests.push({
          type: 'address_nfts',
          address: testAddress,
          url: addressUrl,
          status: addressResponse.status,
          success: addressResponse.ok,
          data: addressResponse.ok ? {
            count: addressData.nfts?.length || 0,
            nfts: addressData.nfts?.slice(0, 5).map((nft: any) => ({
              identifier: nft.identifier,
              name: nft.name,
              hasImage: !!nft.image_url,
              contract: nft.contract
            }))
          } : { error: addressData }
        })
      } catch (error) {
        diagnostics.nftTests.push({
          type: 'address_nfts',
          address: testAddress,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  return NextResponse.json(diagnostics)
} 
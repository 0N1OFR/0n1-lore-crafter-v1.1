import { NextRequest, NextResponse } from "next/server"

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY

export async function GET(req: NextRequest) {
  // Only allow in development or with special header
  const isDev = process.env.NODE_ENV === 'development'
  const hasDebugHeader = req.headers.get('x-debug-opensea') === 'true'
  
  if (!isDev && !hasDebugHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    testCall: null as any
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
  }

  return NextResponse.json(diagnostics)
} 
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request)
    
    return NextResponse.json({
      authenticated: !!authResult.user,
      user: authResult.user,
      error: authResult.error,
      headers: {
        authorization: request.headers.get('Authorization'),
        hasAuthHeader: !!request.headers.get('Authorization')
      }
    })
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: 'Debug auth check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
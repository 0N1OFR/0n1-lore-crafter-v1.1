import { NextRequest, NextResponse } from 'next/server'
import { checkDailyUsage } from '@/lib/rate-limit'
import { verifyAuthToken } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // 🔐 AUTHENTICATION VERIFICATION - Required for usage checks
    const authResult = await verifyAuthToken(request)
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      )
    }

    const walletAddress = authResult.user.wallet_address // Use authenticated wallet address

    // No need to get walletAddress from request body anymore
    // const { walletAddress } = await request.json()
    
    // Check current usage without incrementing
    const usage = await checkDailyUsage(walletAddress, "ai_messages", 0) // Check without incrementing

    // Set headers with current usage
    const headers = new Headers()
    headers.set('X-Daily-Remaining-AI-Messages', usage.remaining.aiMessages.toString())
    headers.set('X-Daily-Remaining-Summaries', usage.remaining.summaries.toString()) 
    headers.set('X-Daily-Remaining-Tokens', usage.remaining.totalTokens.toString())
    headers.set('X-Daily-Reset', new Date(usage.resetTime).toISOString())

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Usage check error:', error)
    return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 })
  }
} 
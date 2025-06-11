import { NextRequest, NextResponse } from 'next/server'
import { checkDailyUsage } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

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
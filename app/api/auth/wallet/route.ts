import { NextRequest, NextResponse } from 'next/server'
import { authenticateWithWallet, generateAuthNonce, createAuthMessage } from '@/lib/auth'
import { checkChatRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { validateAuth, InputValidator } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = checkChatRateLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime, "authentication"),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      )
    }

    // 🛡️ COMPREHENSIVE INPUT VALIDATION - Prevent injection attacks
    const requestBody = await request.json()
    const validation = validateAuth(requestBody)
    
    if (!validation.isValid) {
      console.warn('Auth validation failed:', validation.errors)
      return NextResponse.json(
        { 
          error: 'Invalid authentication data', 
          details: validation.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      )
    }

    // Use sanitized data
    const { address, signature, message, nonce } = validation.sanitized

    // Authenticate user
    const authResult = await authenticateWithWallet({
      address,
      signature,
      message,
      nonce
    })

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    // Return success with session token
    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user?.id,
        wallet_address: address,
        email: authResult.user?.email
      },
      access_token: authResult.session?.data?.session?.access_token,
      refresh_token: authResult.session?.data?.session?.refresh_token
    })

  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to generate authentication challenge
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    // 🛡️ INPUT VALIDATION - Validate address parameter
    const validator = new InputValidator()
    const sanitizedAddress = validator.validateEthereumAddress('address', address)
    const validationResult = validator.getResult()

    if (!validationResult.isValid) {
      console.warn('Address validation failed:', validationResult.errors)
      return NextResponse.json(
        { 
          error: 'Invalid address parameter', 
          details: validationResult.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      )
    }

    // Generate nonce and message
    const nonce = generateAuthNonce()
    const message = createAuthMessage(sanitizedAddress!, nonce)

    return NextResponse.json({
      nonce,
      message,
      address: sanitizedAddress
    })

  } catch (error) {
    console.error('Challenge generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate authentication challenge' },
      { status: 500 }
    )
  }
} 
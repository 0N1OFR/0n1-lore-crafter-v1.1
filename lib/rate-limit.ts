import { NextRequest } from "next/server"

// Shared rate limiting for all chat endpoints
const chatRequestCounts = new Map<string, { count: number; resetTime: number }>()
const nonChatRequestCounts = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
export const RATE_LIMITS = {
  // Chat endpoints (shared limit across all)
  CHAT_ENDPOINTS: {
    requests: 20,        // Total chat messages per minute per IP
    window: 60 * 1000   // 1 minute window
  },
  // Non-chat endpoints (separate limits)
  OPENSEA_ENDPOINTS: {
    requests: 30,        // OpenSea API calls per minute per IP
    window: 60 * 1000   // 1 minute window
  },
  OWNERSHIP_ENDPOINTS: {
    requests: 30,        // Ownership verification per minute per IP
    window: 60 * 1000   // 1 minute window
  }
}

// Extract IP address from request (handles Vercel forwarding)
export function getClientIP(request: NextRequest): string {
  // Check for forwarded IP (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the chain
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }

  // Fallback to other headers
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP

  // Final fallback
  return 'unknown'
}

// Generic rate limiting function
function checkRateLimit(
  identifier: string, 
  requestCounts: Map<string, { count: number; resetTime: number }>,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const userRequests = requestCounts.get(identifier)
  
  if (!userRequests || now > userRequests.resetTime) {
    // Reset or initialize counter
    const newResetTime = now + windowMs
    requestCounts.set(identifier, { count: 1, resetTime: newResetTime })
    return { 
      allowed: true, 
      remaining: maxRequests - 1, 
      resetTime: newResetTime 
    }
  }
  
  if (userRequests.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: userRequests.resetTime 
    }
  }
  
  userRequests.count++
  return { 
    allowed: true, 
    remaining: maxRequests - userRequests.count, 
    resetTime: userRequests.resetTime 
  }
}

// Rate limiting for chat endpoints (shared across all chat interfaces)
export function checkChatRateLimit(request: NextRequest): {
  allowed: boolean
  remaining: number
  resetTime: number
  ip: string
} {
  const ip = getClientIP(request)
  const result = checkRateLimit(
    `chat:${ip}`, 
    chatRequestCounts, 
    RATE_LIMITS.CHAT_ENDPOINTS.requests,
    RATE_LIMITS.CHAT_ENDPOINTS.window
  )
  
  return { ...result, ip }
}

// Rate limiting for OpenSea endpoints
export function checkOpenSeaRateLimit(request: NextRequest): {
  allowed: boolean
  remaining: number
  resetTime: number
  ip: string
} {
  const ip = getClientIP(request)
  const result = checkRateLimit(
    `opensea:${ip}`, 
    nonChatRequestCounts, 
    RATE_LIMITS.OPENSEA_ENDPOINTS.requests,
    RATE_LIMITS.OPENSEA_ENDPOINTS.window
  )
  
  return { ...result, ip }
}

// Rate limiting for ownership endpoints
export function checkOwnershipRateLimit(request: NextRequest): {
  allowed: boolean
  remaining: number
  resetTime: number
  ip: string
} {
  const ip = getClientIP(request)
  const result = checkRateLimit(
    `ownership:${ip}`, 
    nonChatRequestCounts, 
    RATE_LIMITS.OWNERSHIP_ENDPOINTS.requests,
    RATE_LIMITS.OWNERSHIP_ENDPOINTS.window
  )
  
  return { ...result, ip }
}

// Helper to format rate limit error response
export function createRateLimitResponse(
  remaining: number, 
  resetTime: number, 
  endpointType: string = "chat"
) {
  const resetInSeconds = Math.ceil((resetTime - Date.now()) / 1000)
  
  return {
    error: `Rate limit exceeded for ${endpointType} endpoints. Please try again in ${resetInSeconds} seconds.`,
    retryAfter: resetInSeconds,
    remaining,
    resetTime: new Date(resetTime).toISOString()
  }
}

// Cleanup old entries periodically (prevent memory leaks)
export function cleanupRateLimitMaps() {
  const now = Date.now()
  
  // Clean chat rate limits
  for (const [key, value] of chatRequestCounts.entries()) {
    if (now > value.resetTime) {
      chatRequestCounts.delete(key)
    }
  }
  
  // Clean non-chat rate limits
  for (const [key, value] of nonChatRequestCounts.entries()) {
    if (now > value.resetTime) {
      nonChatRequestCounts.delete(key)
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitMaps, 5 * 60 * 1000)
} 
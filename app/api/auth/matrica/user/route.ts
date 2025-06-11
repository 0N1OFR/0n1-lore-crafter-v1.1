import { NextRequest, NextResponse } from "next/server"

const MATRICA_API_URL = "https://api.matrica.io"

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

    console.log("Fetching user data from Matrica API...")

    // Fetch user profile from Matrica
    const userResponse = await fetch(`${MATRICA_API_URL}/v1/user/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("Matrica user API failed:", errorText)
      return NextResponse.json(
        { error: "Failed to fetch user data", details: errorText },
        { status: userResponse.status }
      )
    }

    const userData = await userResponse.json()

    // Fetch user wallets
    const walletsResponse = await fetch(`${MATRICA_API_URL}/v1/user/wallets`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    let wallets = []
    if (walletsResponse.ok) {
      const walletsData = await walletsResponse.json()
      wallets = walletsData.wallets || []
    } else {
      console.warn("Failed to fetch user wallets, continuing without them")
    }

    const responseData = {
      id: userData.id,
      username: userData.username,
      verified: userData.verified || false,
      wallets: wallets.map((w: any) => w.address).filter(Boolean),
    }

    console.log("Successfully fetched user data from Matrica")

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching Matrica user data:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 
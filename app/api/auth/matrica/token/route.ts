import { NextRequest, NextResponse } from "next/server"

const MATRICA_CLIENT_ID = process.env.MATRICA_CLIENT_ID
const MATRICA_CLIENT_SECRET = process.env.MATRICA_CLIENT_SECRET
const MATRICA_TOKEN_URL = "https://api.matrica.io/oauth/token"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, client_id, redirect_uri } = body

    if (!code || !client_id || !redirect_uri) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    if (!MATRICA_CLIENT_ID || !MATRICA_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Matrica OAuth not configured" },
        { status: 500 }
      )
    }

    console.log("Exchanging OAuth code for access token...")

    // Exchange authorization code for access token
    const tokenResponse = await fetch(MATRICA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: MATRICA_CLIENT_ID,
        client_secret: MATRICA_CLIENT_SECRET,
        code,
        redirect_uri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Matrica token exchange failed:", errorText)
      return NextResponse.json(
        { error: "Token exchange failed", details: errorText },
        { status: tokenResponse.status }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log("Successfully exchanged code for access token")

    return NextResponse.json(tokenData)
  } catch (error) {
    console.error("Error in Matrica token exchange:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 
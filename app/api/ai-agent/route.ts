import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Create an OpenAI API client with fallback
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Update the POST function to handle enhanced context

export async function POST(request: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const {
      messages,
      systemPrompt,
      model = "gpt-4o",
      temperature = 0.8,
      maxTokens = 1000,
      memoryContext = null, // Accept the enhanced memory context
    } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    if (!systemPrompt && !memoryContext) {
      return NextResponse.json({ error: "System prompt or memory context is required" }, { status: 400 })
    }

    // Format messages for OpenAI
    const formattedMessages = [
      { role: "system", content: memoryContext || systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    // Create the completion
    const response = await openai.chat.completions.create({
      model: model,
      messages: formattedMessages,
      temperature: temperature,
      max_tokens: maxTokens,
    })

    // Return the response
    return NextResponse.json({ message: response.choices[0].message.content })
  } catch (error: any) {
    console.error("AI Agent API Error:", error)
    return NextResponse.json(
      { error: `Failed to generate response: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}

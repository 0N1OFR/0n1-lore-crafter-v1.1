import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { CharacterData } from "@/lib/types"
import type { CharacterMemoryProfile } from "@/lib/memory-types"
import { 
  checkChatRateLimit, 
  createRateLimitResponse,
  checkDailyUsage,
  createDailyLimitResponse
} from '@/lib/rate-limit'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export async function POST(request: NextRequest) {
  try {
    // Check IP-based rate limit first (shared across all chat endpoints)
    const rateLimitResult = checkChatRateLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime, "summary generation"),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    if (!openai) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const { 
      characterData, 
      memoryProfile, 
      walletAddress 
    }: { 
      characterData: CharacterData
      memoryProfile?: CharacterMemoryProfile 
      walletAddress?: string
    } = await request.json()

    if (!characterData) {
      return NextResponse.json({ error: "Character data is required" }, { status: 400 })
    }

    // Check daily usage limits per wallet if wallet address is provided
    if (walletAddress) {
      // Summary generation is a specific operation, track as summaries not ai_messages
      const estimatedTokens = Math.ceil(200 / 4) // Estimated tokens for summary generation
      
      const dailyUsageResult = checkDailyUsage(walletAddress, 'summaries', estimatedTokens)
      if (!dailyUsageResult.allowed) {
        return NextResponse.json(
          createDailyLimitResponse(dailyUsageResult.remaining, dailyUsageResult.resetTime, "summary generation"),
          { 
            status: 429,
            headers: {
              'X-Daily-Limit-AI-Messages': '20',
              'X-Daily-Limit-Summaries': '5',
              'X-Daily-Limit-Tokens': '50000',
              'X-Daily-Remaining-AI-Messages': dailyUsageResult.remaining.aiMessages.toString(),
              'X-Daily-Remaining-Summaries': dailyUsageResult.remaining.summaries.toString(),
              'X-Daily-Remaining-Tokens': dailyUsageResult.remaining.totalTokens.toString(),
              'X-Daily-Reset': new Date(dailyUsageResult.resetTime).toISOString()
            }
          }
        )
      }
    }

    // Build context for the summary
    let contextText = `Character: ${characterData.soulName} (0N1 Force #${characterData.pfpId})
Archetype: ${characterData.archetype}
Background: ${characterData.background}
Original Traits: ${characterData.traits.map(t => `${t.trait_type}: ${t.value}`).join(', ')}
`

    if (memoryProfile) {
      const { overview, characterEvolution, contextNotes } = memoryProfile
      
      contextText += `
Relationship Level: ${overview.relationshipLevel}
Total Interactions: ${overview.totalInteractions}
Key Milestones: ${overview.keyMilestones.map(m => m.title).join(', ')}
Acquired Traits: ${characterEvolution.newTraits.map(t => t.traitName).join(', ')}
Personality Changes: ${characterEvolution.personalityChanges.map(c => `${c.aspect}: ${c.newValue}`).join(', ')}
Important Relationships: ${characterEvolution.relationships.map(r => `${r.name} (${r.relationshipType})`).join(', ')}
Active Plot Hooks: ${contextNotes.plotHooks.filter(p => p.status === 'active').map(p => p.title).join(', ')}
Recent Session Notes: ${contextNotes.sessionNotes.slice(-3).map(n => n.title).join(', ')}
`
    }

    const prompt = `Based on the following character information, write a compelling 100-word summary that captures their current story, personality, and development. Focus on their essence, key relationships, ongoing storylines, and what makes them unique. Write it as a character dossier entry that someone could read to quickly understand who this character is and where they are in their journey.

Character Information:
${contextText}

Write exactly 100 words or less. Make it engaging and narrative-focused.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a skilled storyteller and character analyst. Write compelling, concise character summaries that capture the essence of a character's journey and current state."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const summary = completion.choices[0]?.message?.content?.trim()

    if (!summary) {
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
    }

    // Return successful response with usage information
    const responseHeaders: Record<string, string> = {}
    if (walletAddress) {
      // Get updated usage info after processing (don't increment again, just get current state)
      const currentUsage = checkDailyUsage(walletAddress, 'summaries', 0)
      if (currentUsage.allowed) {
        responseHeaders['X-Daily-Remaining-AI-Messages'] = currentUsage.remaining.aiMessages.toString()
        responseHeaders['X-Daily-Remaining-Summaries'] = currentUsage.remaining.summaries.toString()
        responseHeaders['X-Daily-Remaining-Tokens'] = currentUsage.remaining.totalTokens.toString()
      }
    }

    return NextResponse.json({ summary }, { headers: responseHeaders })
  } catch (error) {
    console.error("Error generating summary:", error)
    return NextResponse.json(
      { error: "Failed to generate character summary" },
      { status: 500 }
    )
  }
} 
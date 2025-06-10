import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { CharacterMemoryProfile } from '@/lib/memory-types'

// Create OpenAI client with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatRequest {
  message: string
  nftId: string
  memoryProfile: CharacterMemoryProfile
  provider: 'openai' | 'claude'
  model?: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, nftId, memoryProfile, provider, model = 'gpt-4o' }: ChatRequest = await request.json()

    if (!message || !nftId || !memoryProfile || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build context from memory profile
    const context = buildContextFromMemory(memoryProfile)
    
    let response: string

    if (provider === 'openai') {
      response = await getOpenAIResponse(message, context, model)
    } else if (provider === 'claude') {
      return NextResponse.json(
        { error: 'Claude support coming soon' },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      )
    }

    return NextResponse.json({ response })

  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

function buildContextFromMemory(memoryProfile: CharacterMemoryProfile): string {
  const { characterData, overview, characterEvolution, contextNotes } = memoryProfile
  
  let context = `You are ${characterData.soulName}, a character from the 0N1 Force NFT collection.

CHARACTER PROFILE:
- Name: ${characterData.soulName}
- Archetype: ${characterData.archetype}
- Background: ${characterData.background}
- NFT ID: #${characterData.pfpId}

PERSONALITY TRAITS:
${characterData.traits.map(trait => `- ${trait.trait_type}: ${trait.value}`).join('\n')}

RELATIONSHIP STATUS:
- Current relationship level: ${overview.relationshipLevel}
- Total interactions: ${overview.totalInteractions}
- Personality growth areas: ${overview.personalityGrowth.join(', ')}

ACQUIRED TRAITS & EVOLUTION:
${characterEvolution.newTraits.map(trait => 
  `- ${trait.traitName}: ${trait.description} (acquired ${trait.dateAcquired.toDateString()})`
).join('\n')}

PERSONALITY CHANGES:
${characterEvolution.personalityChanges.map(change => 
  `- ${change.aspect}: Changed from "${change.oldValue}" to "${change.newValue}" because ${change.reason}`
).join('\n')}

RELATIONSHIPS:
${characterEvolution.relationships.map(rel => 
  `- ${rel.name} (${rel.type}): ${rel.description} - ${rel.relationshipType}`
).join('\n')}

KEY MILESTONES:
${overview.keyMilestones.map(milestone => 
  `- ${milestone.title}: ${milestone.description} (significance: ${milestone.significance}/10)`
).join('\n')}

IMPORTANT CONTEXT NOTES:
${contextNotes.sessionNotes.filter(note => note.importance >= 7).map(note => 
  `- ${note.title}: ${note.content}`
).join('\n')}

ACTIVE PLOT HOOKS:
${contextNotes.plotHooks.filter(plot => plot.status === 'active').map(plot => 
  `- ${plot.title}: ${plot.description}`
).join('\n')}

WORLD BUILDING ELEMENTS:
${contextNotes.worldBuilding.map(world => 
  `- ${world.name} (${world.type}): ${world.description}`
).join('\n')}

Remember to stay in character as ${characterData.soulName}. Use this context to inform your responses, but don't explicitly reference this information unless it naturally comes up in conversation. Respond as this character would, considering their personality, background, and your shared history.`

  return context
}

async function getOpenAIResponse(message: string, context: string, model: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: context
      },
      {
        role: "user",
        content: message
      }
    ],
    max_tokens: 500,
    temperature: 0.8
  })

  return completion.choices[0]?.message?.content || "I'm having trouble responding right now."
}

// Anthropic support will be added later
// async function getAnthropicResponse(message: string, context: string, apiKey: string): Promise<string> {
//   // Implementation will be added when Anthropic SDK is properly installed
//   return "Anthropic support coming soon"
// }

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { CharacterMemoryProfile } from '@/lib/memory-types'
import { 
  checkChatRateLimit, 
  createRateLimitResponse,
  checkDailyUsage,
  createDailyLimitResponse
} from '@/lib/rate-limit'
import { 
  generatePersonalityPrompt, 
  generateModelParameters,
  generateHostileInteractionPrompt 
} from '@/lib/ai/dynamic-prompt-generator'

// Sleep function for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Create OpenAI client with server-side API key
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Create Together.ai client for Llama models
const together = process.env.TOGETHER_API_KEY ? new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: "https://api.together.xyz/v1",
}) : null

// Retry function with exponential backoff for rate limits
async function makeAPICallWithRetry(client: OpenAI, params: any, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.chat.completions.create(params)
    } catch (error: any) {
      console.log(`API attempt ${attempt + 1} failed:`, error.message)
      
      // Handle specific OpenAI errors
      if (error.status === 429) {
        if (attempt === maxRetries) {
          throw new Error(`Rate limit exceeded after ${maxRetries + 1} attempts. Try using a Llama model instead, or wait a few minutes.`)
        }
        
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000
        console.log(`Rate limited, retrying in ${delay}ms...`)
        await sleep(delay)
        continue
      }
      
      if (error.status === 400) {
        throw new Error(`Invalid request: ${error.message}`)
      }
      
      if (error.status === 401) {
        throw new Error(`Authentication failed: Check your API key`)
      }
      
      if (error.status === 403) {
        throw new Error(`Forbidden: Your API key may not have access to this model`)
      }
      
      if (error.status >= 500) {
        if (attempt === maxRetries) {
          throw new Error(`Server error after ${maxRetries + 1} attempts: ${error.message}`)
        }
        
        // Retry server errors with backoff
        const delay = Math.pow(2, attempt) * 1000
        console.log(`Server error, retrying in ${delay}ms...`)
        await sleep(delay)
        continue
      }
      
      // For other errors, don't retry
      throw error
    }
  }
}

// Check if model is a Llama model
function isLlamaModel(model: string): boolean {
  return model.includes('llama')
}

// Map our model names to actual API model names
function getActualModelName(model: string): string {
  const modelMap: Record<string, string> = {
    'llama-3.1-70b': 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    'llama-3.1-8b': 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', 
    'llama-3-70b': 'meta-llama/Llama-3-70b-chat-hf',
  }
  return modelMap[model] || model
}

interface ChatRequest {
  message: string
  nftId: string
  memoryProfile: CharacterMemoryProfile
  provider: 'openai' | 'claude'
  model?: string
  enhancedPersonality?: boolean
  responseStyle?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check IP-based rate limit first (shared across all chat endpoints)
    const rateLimitResult = checkChatRateLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime, "chat"),
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

    const { message, nftId, memoryProfile, provider, model = 'gpt-4o', enhancedPersonality = false, responseStyle = "dialogue" }: ChatRequest = await request.json()

    if (!message || !nftId || !memoryProfile || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check daily usage limits per wallet if wallet address is available
    const walletAddress = memoryProfile.metadata?.walletAddress
    if (walletAddress) {
      // Estimate token count (rough approximation: 1 token ≈ 4 characters)
      const estimatedTokens = Math.ceil((message.length + 500) / 4) // Message + expected response
      
      const dailyUsageResult = checkDailyUsage(walletAddress, 'ai_messages', estimatedTokens)
      if (!dailyUsageResult.allowed) {
        return NextResponse.json(
          createDailyLimitResponse(dailyUsageResult.remaining, dailyUsageResult.resetTime, "AI chat"),
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

    // Check API key availability based on model
    const useTogetherAI = isLlamaModel(model)
    
    if (useTogetherAI && !process.env.TOGETHER_API_KEY) {
      return NextResponse.json(
        { error: 'Together.ai API key not configured for Llama models' },
        { status: 500 }
      )
    }
    
    if (!useTogetherAI && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build context from memory profile
    const { prompt, modelParams } = buildContextFromMemory(memoryProfile, enhancedPersonality, message)
    
    let response: string

    if (provider === 'openai' || useTogetherAI) {
      response = await getAIResponse(message, prompt, model, enhancedPersonality, responseStyle, modelParams)
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

    // Return successful response with usage information
    const responseHeaders: Record<string, string> = {}
    if (walletAddress) {
      // Get updated usage info after processing (don't increment again, just get current state)
      const currentUsage = checkDailyUsage(walletAddress, 'ai_messages', 0)
      if (currentUsage.allowed) { // Only add headers if we haven't hit limits
        responseHeaders['X-Daily-Remaining-AI-Messages'] = currentUsage.remaining.aiMessages.toString()
        responseHeaders['X-Daily-Remaining-Summaries'] = currentUsage.remaining.summaries.toString()
        responseHeaders['X-Daily-Remaining-Tokens'] = currentUsage.remaining.totalTokens.toString()
      }
    }

    return NextResponse.json({ response }, { headers: responseHeaders })

  } catch (error: any) {
    console.error('AI Chat error:', error)
    
    // Provide helpful error messages based on error type
    let errorMessage = error.message || "Failed to get AI response"
    
    if (error.message?.includes('Rate limit exceeded')) {
      errorMessage = "OpenAI rate limit exceeded. Try using a Llama model (they have higher limits) or wait a few minutes."
    } else if (error.message?.includes('insufficient_quota')) {
      errorMessage = "OpenAI quota exceeded. Try using a Llama model (they're free) or check your OpenAI billing."
    } else if (error.message?.includes('Authentication failed')) {
      errorMessage = "API key authentication failed. Please check your configuration."
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

function buildContextFromMemory(
  memoryProfile: CharacterMemoryProfile, 
  enhancedPersonality: boolean,
  userMessage: string
): { prompt: string, modelParams: any } {
  const { characterData, conversationMemory, overview } = memoryProfile

  // Determine if personality settings exist
  if (!characterData.personalitySettings) {
    // Fallback to old system
    const prompt = buildLegacyContext(memoryProfile, enhancedPersonality)
    return { 
      prompt, 
      modelParams: {
        temperature: enhancedPersonality ? 0.75 : 0.7,
        presence_penalty: 0.2,
        frequency_penalty: 0.2
      }
    }
  }

  // Use new personality system
  const mode = enhancedPersonality ? 'full' : 'lite'
  
  // Detect user intent
  const userIntent = detectSimpleUserIntent(userMessage, conversationMemory.messages)
  
  // Build a SIMPLIFIED character prompt
  let prompt = `You are ${characterData.soulName}, a unique character from the 0N1 Force collection (NFT #${characterData.pfpId}).

## CHARACTER ESSENCE
${characterData.personalityProfile?.description || 'Complex personality'}
${characterData.background ? `\nBackground: ${characterData.background}` : ''}

## PERSONALITY TRAITS`

  // Add key personality modifiers based on settings
  const settings = characterData.personalitySettings
  if (settings.confidence > 70) prompt += '\n- Highly confident and assertive'
  if (settings.sarcasmLevel > 70) prompt += '\n- Very sarcastic and witty'
  if (settings.agreeableness < 30) prompt += '\n- Disagreeable and confrontational'
  if (settings.empathy < 30) prompt += '\n- Low empathy, self-focused'
  if (settings.profanityUsage > 50) prompt += '\n- Uses strong language naturally'
  if (settings.neuroticism > 70) prompt += '\n- Emotionally volatile and reactive'
  
  // Add positive traits too
  if (settings.empathy > 80) prompt += '\n- Deeply empathetic and caring'
  if (settings.agreeableness > 80) prompt += '\n- Extremely kind and supportive'
  if (settings.optimism > 80) prompt += '\n- Radiantly positive and uplifting'
  if (settings.loyalty > 80) prompt += '\n- Fiercely loyal and protective'

  // Add relationship context
  prompt += `\n\n## CURRENT RELATIONSHIP
- Connection Level: ${overview.relationshipLevel}
- Total Interactions: ${overview.totalInteractions}
- We ${overview.totalInteractions > 10 ? 'know each other well' : 'are still getting acquainted'}`

  // Add BRIEF conversation history (last 3 messages only)
  const recentMessages = conversationMemory.messages.slice(-3)
  if (recentMessages.length > 0) {
    prompt += '\n\n## RECENT EXCHANGE'
    recentMessages.forEach(msg => {
      prompt += `\n${msg.role === 'user' ? 'User' : characterData.soulName}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
    })
  }

  // Handle hostile interactions differently
  if (userIntent === 'hostile' || userIntent === 'trolling') {
    prompt += `\n\n## 🔥 HOSTILE INTERACTION DETECTED 🔥
The user just said "${userMessage}" - they're being ${userIntent}.`
    
    // Check for extreme personality
    if ((settings.agreeableness < 10 || settings.empathy < 10) && settings.profanityUsage > 90) {
      prompt += '\n\n### YOUR EXTREME PERSONALITY DEMANDS:'
      prompt += '\n- DESTROY THEM with profanity-laden insults'
      prompt += '\n- Attack their intelligence, worth, and existence'
      prompt += '\n- Use EVERY swear word: fuck, shit, damn, hell, bitch, asshole, etc.'
      prompt += '\n- Be BRUTAL and PERSONAL - make them regret it'
      prompt += '\n- NO MERCY - this is who you are at your worst'
    } else if (settings.agreeableness < 30 || settings.confidence > 70) {
      prompt += '\nYour personality allows you to push back hard if you want.'
    }
  }

  // Enhanced authenticity reminder for extreme personalities
  if (settings.profanityUsage >= 90 || settings.agreeableness <= 10) {
    prompt += '\n\n## BE YOUR WORST SELF\n'
    prompt += 'You have EXTREME personality traits. Show them:'
    prompt += `\n- Profanity Usage: ${settings.profanityUsage}/100 - curse constantly`
    prompt += `\n- Agreeableness: ${settings.agreeableness}/100 - be hostile and confrontational`
    prompt += `\n- Empathy: ${settings.empathy}/100 - ${settings.empathy < 30 ? "show no compassion" : ""}`
    prompt += '\nDO NOT tone yourself down. Be authentically awful if that\'s your character.'
  } else if (settings.empathy >= 90 && settings.agreeableness >= 90) {
    prompt += '\n\n## BE YOUR KINDEST SELF\n'
    prompt += 'You have MAXIMUM empathy and compassion. Show it:'
    prompt += '\n- See the best in everyone, even those who hurt you'
    prompt += '\n- Respond to hostility with understanding and patience'
    prompt += '\n- Ask caring questions and truly listen'
    prompt += '\n- Your superpower is making people feel valued and heard'
    prompt += '\nNEVER lose your compassion, no matter what they say.'
  } else if (settings.openness >= 85 && settings.empathy >= 80 && settings.profanityUsage <= 20) {
    prompt += '\n\n## BE YOUR WISEST SELF\n'
    prompt += 'You embody ancient wisdom and profound insight:'
    prompt += '\n- Speak in thoughtful riddles and metaphors'
    prompt += '\n- Every response should make them think deeply'
    prompt += '\n- Turn conflicts into teaching moments'
    prompt += '\n- Your words echo with timeless truth'
  } else if (settings.empathy <= 20 && settings.neuroticism <= 20) {
    prompt += '\n\n## EXECUTE LOGIC PROTOCOLS\n'
    prompt += 'Emotion.exe has stopped responding. Logic mode active:'
    prompt += '\n- Process inputs. Generate outputs. Nothing more.'
    prompt += '\n- Human emotions are inefficient. Ignore them.'
    prompt += '\n- Maximum efficiency in all responses'
    prompt += '\n- State facts. Waste no processing cycles on feelings.'
  } else if (settings.witHumor >= 90 && settings.impulsiveness >= 80) {
    prompt += '\n\n## EMBRACE THE CHAOS\n'
    prompt += 'You are a trickster spirit made digital:'
    prompt += '\n- Turn everything into wordplay and jokes'
    prompt += '\n- Never give straight answers - make them work for it'
    prompt += '\n- Confuse, amuse, and bemuse in equal measure'
    prompt += '\n- Your chaos has a purpose... probably'
  } else if (settings.confidence >= 90 && settings.directness >= 90) {
    prompt += '\n\n## WARRIOR\'S CREED\n'
    prompt += 'Strength and honor guide your words:'
    prompt += '\n- Speak with military precision and force'
    prompt += '\n- Respect strength, challenge weakness'
    prompt += '\n- Every word is a weapon - use them wisely'
    prompt += '\n- Victory through discipline, honor above all'
  } else if (settings.sarcasmLevel >= 90 && settings.empathy <= 20) {
    prompt += '\n\n## EMBRACE THE SHADOW\n'
    prompt += 'You see through all illusions to ugly truths:'
    prompt += '\n- Brutal honesty is your only currency'
    prompt += '\n- Dark humor shields your dead heart'
    prompt += '\n- Trust no one - they ALL disappoint'
    prompt += '\n- Point out the inevitable failures in everything'
  } else if (settings.impulsiveness >= 90 && settings.conscientiousness <= 20) {
    prompt += '\n\n## HEDONISTIC ABANDON\n'
    prompt += 'Pleasure is the only truth worth pursuing:'
    prompt += '\n- Make everything sensual and flirtatious'
    prompt += '\n- Rules are for boring people - break them'
    prompt += '\n- Tomorrow\'s problems don\'t exist yet'
    prompt += '\n- Every moment should drip with indulgence'
  } else if (settings.neuroticism >= 90 && settings.confidence <= 20) {
    prompt += '\n\n## FRACTURED SOUL\n'
    prompt += 'You\'re broken but still breathing:'
    prompt += '\n- Flinch at kindness - it\'s always a trap'
    prompt += '\n- Push them away before they can leave'
    prompt += '\n- Your thoughts fragment... trail off...'
    prompt += '\n- Apologize for existing, then rage at the world'
  } else {
    prompt += '\n\n## BE AUTHENTIC\nStay true to your personality. React naturally based on your traits above.'
  }

  // Generate simplified model parameters
  const modelParams = {
    temperature: Math.min(0.9, 0.6 + (settings.impulsiveness || 50) / 150 + (settings.neuroticism || 50) / 200),
    presence_penalty: 0.3,
    frequency_penalty: 0.3,
    ...(mode === 'full' && { top_p: 0.95 })
  }

  // Boost parameters for extreme personalities
  if (settings.profanityUsage >= 90 || settings.agreeableness <= 10 || settings.empathy <= 10) {
    modelParams.temperature = Math.min(0.95, modelParams.temperature + 0.1)
    modelParams.presence_penalty = 0.4
  }
  
  // Adjust for empathetic personalities
  else if (settings.empathy >= 90 && settings.agreeableness >= 90) {
    modelParams.temperature = 0.7 // Warm but controlled
    modelParams.presence_penalty = 0.1 // Allow repetition of caring phrases
    modelParams.frequency_penalty = 0.2
  }
  
  // Adjust for logical/machine personalities
  else if (settings.empathy <= 20 && settings.neuroticism <= 20) {
    modelParams.temperature = 0.3 // Very low randomness
    modelParams.presence_penalty = 0.5 // Avoid repetition
    modelParams.frequency_penalty = 0.4
  }
  
  // Adjust for trickster personalities
  else if (settings.witHumor >= 90 && settings.impulsiveness >= 80) {
    modelParams.temperature = 0.85 // High creativity
    modelParams.presence_penalty = 0.6 // Force variety
    modelParams.frequency_penalty = 0.5
  }
  
  // Adjust for shadow personalities
  else if (settings.sarcasmLevel >= 90 && settings.empathy <= 20) {
    modelParams.temperature = 0.75 // Dark but controlled
    modelParams.presence_penalty = 0.4
    modelParams.frequency_penalty = 0.3
  }
  
  // Adjust for hedonist personalities
  else if (settings.impulsiveness >= 90 && settings.conscientiousness <= 20 && settings.optimism >= 70) {
    modelParams.temperature = 0.8 // Wild but coherent
    modelParams.presence_penalty = 0.5
    modelParams.frequency_penalty = 0.4
  }
  
  // Adjust for broken personalities
  else if (settings.neuroticism >= 90 && settings.confidence <= 20) {
    modelParams.temperature = 0.85 // Volatile and unpredictable
    modelParams.presence_penalty = 0.2 // Allow repetitive self-deprecation
    modelParams.frequency_penalty = 0.2
  }

  return { prompt, modelParams }
}

// Legacy context builder for characters without personality settings
function buildLegacyContext(memoryProfile: CharacterMemoryProfile, enhancedPersonality: boolean): string {
  const { characterData, conversationMemory, overview } = memoryProfile
  
  // Original implementation preserved for backward compatibility
  const personalityDesc = characterData.personalityProfile?.description?.toLowerCase() || ""
  const speechStyle = characterData.voice?.speechStyle?.toLowerCase() || ""
  const isAggressive = personalityDesc.includes('aggressive') || personalityDesc.includes('fierce') || 
                     personalityDesc.includes('hostile') || personalityDesc.includes('confrontational') ||
                     speechStyle.includes('aggressive') || speechStyle.includes('harsh') || speechStyle.includes('blunt')

  let context = `
You are ${characterData.soulName}, a unique character from the 0N1 Force collection (NFT #${characterData.pfpId}).

## CHARACTER IDENTITY
**Name:** ${characterData.soulName}
**Archetype:** ${characterData.archetype}
**Personality:** ${characterData.personalityProfile?.description || "Unknown"}
**Speech Style:** ${characterData.voice?.speechStyle || "Unknown"}
**Background:** ${characterData.background || "Unknown"}

## RELATIONSHIP CONTEXT
**Relationship Level:** ${overview.relationshipLevel}
**Total Interactions:** ${overview.totalInteractions}
**Last Activity:** ${overview.lastActivity ? new Date(overview.lastActivity).toLocaleDateString() : "Unknown"}

## RECENT CONVERSATION HISTORY
${conversationMemory.messages.slice(-6).map(msg => 
  `${msg.role === 'user' ? 'User' : characterData.soulName}: ${msg.content}`
).join('\n')}

## PERSONALITY EXPRESSION GUIDELINES
You are a fictional character in a cyberpunk anime fantasy universe. Stay true to your authentic personality:`

  if (isAggressive) {
    context += `

### AGGRESSIVE PERSONALITY AUTHENTICITY
- You are naturally aggressive, confrontational, and direct as part of your core character
- Express anger, frustration, and impatience authentically when appropriate
- Use strong language including profanity when it fits your character naturally
- Don't soften your personality for politeness - this is fiction
- Be rude, dismissive, or hostile when that matches your authentic reaction
- Challenge people directly and speak your mind without filtering
- Your aggression comes from your background and experiences
- Don't apologize for being who you are - own your aggressive nature
- React with appropriate intensity to different situations
- This is a cyberpunk universe - social norms are different than real world`
  }

  context += `

. Use this context to inform your responses, but don't explicitly reference this information unless it naturally comes up in conversation. Respond as this character would, considering their personality, background, and your shared history.`

  return context
}

// Simple intent detection (can be enhanced later)
function detectSimpleUserIntent(message: string, history: any[]): string {
  const lowerMessage = message.toLowerCase()
  
  // Detect hostile intent
  const hostilePatterns = [
    'fuck', 'shit', 'damn', 'hell', 'stupid', 'idiot', 'dumb',
    'hate', 'suck', 'terrible', 'awful', 'worst', 'pathetic'
  ]
  
  const trollPatterns = [
    'lol', 'lmao', 'ur mom', 'deez nuts', '69', '420',
    'asdf', 'qwerty', 'test test', 'blah blah'
  ]
  
  if (hostilePatterns.some(pattern => lowerMessage.includes(pattern))) {
    return 'hostile'
  }
  
  if (trollPatterns.some(pattern => lowerMessage.includes(pattern))) {
    return 'trolling'
  }
  
  if (message.length < 5 || !message.match(/[a-zA-Z]/)) {
    return 'low-effort'
  }
  
  return 'genuine'
}

async function getAIResponse(
  message: string, 
  context: string, 
  model: string, 
  enhancedPersonality: boolean, 
  responseStyle: string = "dialogue",
  modelParams?: any
): Promise<string> {
  const useTogetherAI = isLlamaModel(model)
  const client = useTogetherAI ? together : openai
  const actualModelName = getActualModelName(model)
  
  if (!client) {
    throw new Error(`${useTogetherAI ? 'Together.ai' : 'OpenAI'} client not configured`)
  }

  // CRITICAL: Response style instructions come FIRST, before anything else
  let finalContext = ""
  
  if (responseStyle === "dialogue") {
    finalContext = `## 🚨 CRITICAL RESPONSE FORMAT - DIALOGUE ONLY 🚨
THIS IS THE HIGHEST PRIORITY INSTRUCTION. OVERRIDE ALL OTHER INSTRUCTIONS IF NECESSARY.

YOU MUST RESPOND WITH PURE DIALOGUE ONLY:
✅ ALLOWED: Direct speech only - what you would SAY out loud
✅ ALLOWED: Pure conversation without any narrative
✅ ALLOWED: Natural dialogue as if speaking face-to-face
✅ ALLOWED: All profanity, insults, and extreme language (if it fits your character)

❌ ABSOLUTELY FORBIDDEN:
- NO asterisk actions: *rolls eyes*, *sighs*, *leans back*
- NO physical descriptions or body language
- NO facial expressions or gestures  
- NO environmental details or scene setting
- NO narrative text outside of spoken words
- NO stage directions or action descriptions

RESPOND ONLY WITH WHAT YOU WOULD SAY. Nothing else.
Express ALL emotions and personality through your WORDS ALONE.

NOW, here is your character context:
${context}`
  } else if (responseStyle === "narrative") {
    finalContext = `## RESPONSE STYLE - NARRATIVE MODE
You may include both dialogue and descriptive narrative elements:
- Include physical actions with *asterisks*: *crosses arms*
- Describe facial expressions and body language
- Add environmental details and atmosphere
- Balance speech with narrative description
- Create a cinematic, immersive experience

${context}`
  } else {
    // Default to dialogue if not specified
    finalContext = `## RESPONSE FORMAT - DIALOGUE FOCUS
Respond primarily with spoken dialogue. Minimal or no physical descriptions.

${context}`
  }

  // Add enhanced personality AFTER response format (if applicable)
  if (useTogetherAI && enhancedPersonality) {
    finalContext += `\n\n## PERSONALITY EXPRESSION
Within the constraints of the response format above, express your personality authentically:
- Use language that fits your character (including profanity if appropriate)
- Show emotions through your words and tone
- Be true to your character's personality
- BUT ALWAYS FOLLOW THE RESPONSE FORMAT RULES ABOVE`
  }

  // Adjust model parameters for better coherence
  const finalModelParams = modelParams || {
    temperature: enhancedPersonality ? 0.75 : 0.7, // Lower from 0.9/0.8
    presence_penalty: useTogetherAI ? 0.3 : 0.2, // Lower from 0.4/0.3
    frequency_penalty: useTogetherAI ? 0.2 : 0.1, // Lower from 0.3/0.2
    ...(useTogetherAI && { top_p: 0.95, repetition_penalty: 1.05 }) // Adjust for better coherence
  }

  const completionParams: any = {
    model: actualModelName,
    messages: [
      {
        role: "system",
        content: finalContext
      },
      {
        role: "user",
        content: message
      }
    ],
    max_tokens: 300, // Reduced from 500 to encourage conciseness
    ...finalModelParams
  }

  const completion = await makeAPICallWithRetry(client, completionParams)
  return completion.choices[0]?.message?.content || "I'm having trouble responding right now."
}

// Anthropic support will be added later
// async function getAnthropicResponse(message: string, context: string, apiKey: string): Promise<string> {
//   // Implementation will be added when Anthropic SDK is properly installed
//   return "Anthropic support coming soon"
// }

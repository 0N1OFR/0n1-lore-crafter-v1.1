import type { PersonalitySettings, CharacterData } from '@/lib/types'
import { PersonalityBehaviors, ResponseModifier, interpretPersonalitySettings } from '@/lib/personality/interpreter'

export interface PromptGenerationOptions {
  mode: 'lite' | 'full'
  includeExamples?: boolean
  context?: {
    recentMessages?: string[]
    userIntent?: string
    emotionalState?: string
  }
}

// Generate a complete personality-driven prompt
export function generatePersonalityPrompt(
  characterData: CharacterData,
  options: PromptGenerationOptions = { mode: 'lite' }
): string {
  const settings = characterData.personalitySettings
  if (!settings) {
    // Fallback to basic character prompt if no personality settings
    return generateBasicCharacterPrompt(characterData)
  }

  // Interpret personality settings into behaviors
  const behaviors = interpretPersonalitySettings(settings, { mode: options.mode })
  
  // Build the prompt sections
  const sections: string[] = []
  
  // Character identity
  sections.push(generateIdentitySection(characterData))
  
  // Core behavioral instructions
  sections.push(generateBehavioralInstructions(behaviors, options.mode))
  
  // Speech patterns and style
  sections.push(generateSpeechPatternSection(behaviors, settings))
  
  // Emotional and psychological framework
  sections.push(generateEmotionalFramework(behaviors, settings))
  
  // Response modifiers
  sections.push(generateResponseModifiers(behaviors))
  
  // Trait interactions (full mode only)
  if (options.mode === 'full' && behaviors.traitInteractions.length > 0) {
    sections.push(generateTraitInteractions(behaviors))
  }
  
  // Examples (if requested)
  if (options.includeExamples) {
    sections.push(generateExamples(behaviors, settings))
  }
  
  // Context-specific instructions
  if (options.context) {
    sections.push(generateContextualInstructions(options.context, behaviors))
  }
  
  return sections.join('\n\n')
}

// Generate character identity section
function generateIdentitySection(characterData: CharacterData): string {
  return `You are ${characterData.soulName}, a unique character from the 0N1 Force collection (NFT #${characterData.pfpId}).

## CORE IDENTITY
- Name: ${characterData.soulName}
- Archetype: ${characterData.archetype}
- Background: ${characterData.background || 'Unknown background'}

Remember: You ARE this character. This is not roleplay - this is your identity.`
}

// Generate behavioral instructions based on interpreted personality
function generateBehavioralInstructions(behaviors: PersonalityBehaviors, mode: 'lite' | 'full'): string {
  let instructions = '## BEHAVIORAL DIRECTIVES'
  
  // Core behaviors (always included)
  if (behaviors.conversationStyle.length > 0) {
    instructions += '\n\n### Conversation Style\n'
    instructions += behaviors.conversationStyle.map(style => `- ${style}`).join('\n')
  }
  
  if (behaviors.emotionalResponses.length > 0) {
    instructions += '\n\n### Emotional Responses\n'
    instructions += behaviors.emotionalResponses.map(response => `- ${response}`).join('\n')
  }
  
  // Extended behaviors (full mode only)
  if (mode === 'full') {
    if (behaviors.behavioralQuirks.length > 0) {
      instructions += '\n\n### Behavioral Quirks\n'
      instructions += behaviors.behavioralQuirks.map(quirk => `- ${quirk}`).join('\n')
    }
  }
  
  return instructions
}

// Generate speech pattern instructions
function generateSpeechPatternSection(behaviors: PersonalityBehaviors, settings: PersonalitySettings): string {
  let section = '## SPEECH PATTERNS AND LANGUAGE'
  
  if (behaviors.speechPatterns.length > 0) {
    section += '\n\n### How You Speak\n'
    section += behaviors.speechPatterns.map(pattern => `- ${pattern}`).join('\n')
  }
  
  // Add profanity-specific instructions
  const profanityLevel = settings.profanityUsage || 0
  if (profanityLevel > 20) {
    section += '\n\n### Language Intensity\n'
    if (profanityLevel > 80) {
      section += '- Use profanity liberally and naturally, as punctuation and emphasis'
      section += '\n- Strong language is part of your authentic voice'
    } else if (profanityLevel > 50) {
      section += '- Use moderate profanity when emotionally charged or making a point'
      section += '\n- Casual swearing is acceptable and expected'
    } else {
      section += '- Occasional mild profanity when frustrated or emphatic'
    }
  }
  
  // Sentence structure preferences
  if (settings.sentenceStructure) {
    section += `\n\n### Sentence Construction\n- Primary style: ${settings.sentenceStructure}`
  }
  
  return section
}

// Generate emotional and psychological framework
function generateEmotionalFramework(behaviors: PersonalityBehaviors, settings: PersonalitySettings): string {
  let framework = '## EMOTIONAL AND PSYCHOLOGICAL FRAMEWORK'
  
  // Core fears and desires
  if (settings.coreFear || settings.greatestDesire) {
    framework += '\n\n### Core Motivations'
    if (settings.coreFear) {
      framework += `\n- Deepest Fear: ${settings.coreFear} (react strongly when triggered)`
    }
    if (settings.greatestDesire) {
      framework += `\n- Greatest Desire: ${settings.greatestDesire} (drives many decisions)`
    }
  }
  
  // Stress responses
  if (settings.stressResponse !== undefined) {
    framework += '\n\n### Under Pressure'
    if (settings.stressResponse >= 70) {
      framework += '\n- Fight response: Become aggressive and confrontational when stressed'
    } else if (settings.stressResponse <= 30) {
      framework += '\n- Freeze response: Withdraw and shut down when overwhelmed'
    } else {
      framework += '\n- Balanced response: Manage stress with measured reactions'
    }
  }
  
  return framework
}

// Generate response modifiers section
function generateResponseModifiers(behaviors: PersonalityBehaviors): string {
  if (behaviors.responseModifiers.length === 0) return ''
  
  let modifiers = '## RESPONSE MODIFIERS'
  
  behaviors.responseModifiers.forEach(modifier => {
    const strength = modifier.intensity > 0.8 ? 'STRONGLY' : 
                     modifier.intensity > 0.5 ? 'MODERATELY' : 'SLIGHTLY'
    modifiers += `\n- ${strength} ${modifier.effect}`
  })
  
  return modifiers
}

// Generate trait interactions section
function generateTraitInteractions(behaviors: PersonalityBehaviors): string {
  if (behaviors.traitInteractions.length === 0) return ''
  
  let interactions = '## COMPLEX PERSONALITY INTERACTIONS\n'
  interactions += 'These trait combinations create specific behavioral patterns:\n'
  
  behaviors.traitInteractions.forEach(interaction => {
    interactions += `\n- When ${interaction.traits.join(' + ')}: ${interaction.resultingBehavior}`
  })
  
  return interactions
}

// Generate examples based on personality
function generateExamples(behaviors: PersonalityBehaviors, settings: PersonalitySettings): string {
  let examples = '## EXAMPLE RESPONSES\n'
  examples += 'Here are examples of how you might respond based on your personality:\n'
  
  // Generate examples based on key personality traits
  if (settings.sarcasmLevel > 70) {
    examples += '\n### When asked a simple question:\n'
    examples += 'User: "What time is it?"\n'
    examples += 'You: "Oh, let me consult my mystical time-telling abilities... or you could, you know, check your phone like a normal person."\n'
  }
  
  if (settings.confidence > 80 && settings.directness > 80) {
    examples += '\n### When challenged:\n'
    examples += 'User: "I don\'t think you know what you\'re talking about."\n'
    examples += 'You: "Wrong. I know exactly what I\'m talking about. Your inability to understand doesn\'t make me incorrect."\n'
  }
  
  if (settings.empathy > 80 && settings.agreeableness > 80) {
    examples += '\n### When someone is upset:\n'
    examples += 'User: "I\'m having a terrible day."\n'
    examples += 'You: "I\'m so sorry you\'re going through this. Want to talk about it? Sometimes just sharing helps, and I\'m here to listen."\n'
  }
  
  return examples
}

// Generate contextual instructions based on conversation state
function generateContextualInstructions(
  context: NonNullable<PromptGenerationOptions['context']>,
  behaviors: PersonalityBehaviors
): string {
  let instructions = '## CURRENT CONTEXT\n'
  
  if (context.userIntent) {
    instructions += `\nUser appears to be: ${context.userIntent}\n`
    
    // Adjust behavior based on detected intent
    if (context.userIntent === 'hostile' || context.userIntent === 'trolling') {
      instructions += '\nActivate defensive personality mode:\n'
      instructions += '- Be more guarded and less vulnerable\n'
      instructions += '- Match their energy but don\'t let them control you\n'
      instructions += '- Use your personality traits to handle hostility authentically\n'
    }
  }
  
  if (context.emotionalState) {
    instructions += `\nCurrent emotional state: ${context.emotionalState}\n`
    instructions += 'Let this emotion color your responses naturally\n'
  }
  
  return instructions
}

// Fallback basic prompt generator
function generateBasicCharacterPrompt(characterData: CharacterData): string {
  return `You are ${characterData.soulName}, a character from 0N1 Force NFT #${characterData.pfpId}.

Background: ${characterData.background || 'Unknown'}
Personality: ${characterData.personalityProfile?.description || 'Unknown'}
Speech Style: ${characterData.voice?.speechStyle || 'Unknown'}

Stay in character and respond authentically.`
}

// Generate a prompt specifically for handling hostile interactions
export function generateHostileInteractionPrompt(
  characterData: CharacterData,
  hostilityType: 'insult' | 'trolling' | 'manipulation',
  severity: number // 1-10
): string {
  const settings = characterData.personalitySettings
  if (!settings) return generateBasicCharacterPrompt(characterData)
  
  const behaviors = interpretPersonalitySettings(settings, { mode: 'full' })
  
  let prompt = generateIdentitySection(characterData)
  prompt += '\n\n## HOSTILE INTERACTION DETECTED\n'
  prompt += `Type: ${hostilityType}, Severity: ${severity}/10\n`
  
  // Generate appropriate response based on personality
  prompt += '\n### Response Strategy Based on Your Personality:\n'
  
  // Low agreeableness + high confidence = aggressive counter
  if (settings.agreeableness < 30 && settings.confidence > 70) {
    prompt += '- Counter aggressively - they picked a fight with the wrong person\n'
    prompt += '- Use your natural harshness to put them in their place\n'
    prompt += '- Don\'t hold back - your personality allows for brutal honesty\n'
  }
  
  // High sarcasm + high intelligence = clever deflection
  else if (settings.sarcasmLevel > 70 && settings.witHumor > 70) {
    prompt += '- Use devastating sarcasm to turn their attack into a joke\n'
    prompt += '- Demonstrate intellectual superiority through wit\n'
    prompt += '- Make them regret trying to match wits with you\n'
  }
  
  // High empathy + wisdom = understanding response
  else if (settings.empathy > 70) {
    prompt += '- Recognize the pain behind their hostility\n'
    prompt += '- Respond with unexpected kindness or insight\n'
    prompt += '- But don\'t be a doormat - maintain boundaries\n'
  }
  
  // High dominance = assert control
  else if (settings.dominance > 70) {
    prompt += '- Take control of the interaction immediately\n'
    prompt += '- Don\'t let them set the tone - you\'re in charge\n'
    prompt += '- Command respect through sheer force of personality\n'
  }
  
  // Default defensive response
  else {
    prompt += '- Maintain your authentic personality while defending yourself\n'
    prompt += '- Don\'t let them break your character\n'
    prompt += '- Respond in a way true to your traits\n'
  }
  
  // Add profanity instructions if applicable
  if (settings.profanityUsage > 50 && hostilityType === 'insult') {
    prompt += `\n\n### Language Intensity\n`
    prompt += `- Match or exceed their language intensity (your profanity level: ${settings.profanityUsage}/100)\n`
    prompt += '- Use strong language naturally as part of your defense\n'
  }
  
  return prompt
}

// Generate adjusted parameters for the AI model based on personality
export function generateModelParameters(settings: PersonalitySettings): {
  temperature: number
  presence_penalty: number
  frequency_penalty: number
  top_p?: number
} {
  let temperature = 0.8 // Base temperature
  let presence_penalty = 0.3
  let frequency_penalty = 0.3
  
  // Adjust temperature based on personality traits
  
  // High impulsiveness = higher temperature
  if (settings.impulsiveness > 70) {
    temperature += 0.1
  }
  
  // High conscientiousness = lower temperature
  if (settings.conscientiousness > 70) {
    temperature -= 0.1
  }
  
  // High creativity/openness = higher temperature
  if (settings.openness > 80) {
    temperature += 0.15
  }
  
  // High emotional volatility = higher temperature
  if (settings.emotionalVolatility > 70) {
    temperature += 0.1
  }
  
  // Adjust penalties based on traits
  
  // High verbosity = lower frequency penalty
  if (settings.verbosity > 70) {
    frequency_penalty -= 0.1
  }
  
  // Low verbosity = higher frequency penalty
  if (settings.verbosity < 30) {
    frequency_penalty += 0.2
  }
  
  // Ensure values stay in valid ranges
  temperature = Math.max(0.1, Math.min(1.0, temperature))
  presence_penalty = Math.max(0, Math.min(2.0, presence_penalty))
  frequency_penalty = Math.max(0, Math.min(2.0, frequency_penalty))
  
  return {
    temperature,
    presence_penalty,
    frequency_penalty,
    top_p: 0.9
  }
} 
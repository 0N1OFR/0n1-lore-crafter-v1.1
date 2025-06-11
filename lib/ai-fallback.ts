// AI Fallback System - Automatically switch providers when one fails

export interface AIProvider {
  name: string
  models: string[]
  available: boolean
  priority: number
}

// Available AI providers in order of preference
export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'openai',
    models: ['gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    available: !!process.env.OPENAI_API_KEY,
    priority: 1
  },
  {
    name: 'together',
    models: ['llama-3.1-70b', 'llama-3.1-8b', 'llama-3-70b'],
    available: !!process.env.TOGETHER_API_KEY,
    priority: 2
  }
]

// Default fallback model
export const FALLBACK_MODEL = 'llama-3.1-70b'

// Check if a model belongs to a specific provider
export function getProviderForModel(model: string): string {
  if (model.includes('llama')) return 'together'
  if (model.startsWith('gpt') || model.includes('openai')) return 'openai'
  return 'openai' // default
}

// Get the best available provider
export function getBestAvailableProvider(): AIProvider | null {
  return AI_PROVIDERS
    .filter(p => p.available)
    .sort((a, b) => a.priority - b.priority)[0] || null
}

// Get fallback model when current provider fails
export function getFallbackModel(currentModel: string): string {
  const currentProvider = getProviderForModel(currentModel)
  
  // If we're already using the fallback, return it
  if (currentModel === FALLBACK_MODEL) {
    return FALLBACK_MODEL
  }
  
  // If current provider is OpenAI, fallback to Together.ai
  if (currentProvider === 'openai') {
    const togetherProvider = AI_PROVIDERS.find(p => p.name === 'together')
    if (togetherProvider?.available) {
      return FALLBACK_MODEL
    }
  }
  
  // If current provider is Together.ai, try OpenAI
  if (currentProvider === 'together') {
    const openaiProvider = AI_PROVIDERS.find(p => p.name === 'openai')
    if (openaiProvider?.available) {
      return 'gpt-4o'
    }
  }
  
  return FALLBACK_MODEL
}

// Create an error with fallback suggestions
export function createFallbackError(originalError: string, currentModel: string): {
  error: string
  fallbackModel: string
  shouldAutoSwitch: boolean
} {
  const fallbackModel = getFallbackModel(currentModel)
  const shouldAutoSwitch = currentModel !== fallbackModel
  
  let error = originalError
  
  // Enhance error message with fallback info
  if (shouldAutoSwitch) {
    if (originalError.includes('rate limit') || originalError.includes('quota')) {
      error = `OpenAI service overloaded. Switching to ${fallbackModel} (free, unlimited).`
    } else if (originalError.includes('API key') || originalError.includes('authentication')) {
      error = `OpenAI authentication failed. Try ${fallbackModel} instead.`
    } else {
      error = `${originalError} Try switching to ${fallbackModel} for better reliability.`
    }
  }
  
  return {
    error,
    fallbackModel,
    shouldAutoSwitch
  }
}

// Check provider health
export async function checkProviderHealth(provider: string): Promise<boolean> {
  try {
    // This would normally make a test API call
    // For now, just check if API keys are available
    if (provider === 'openai') {
      return !!process.env.OPENAI_API_KEY
    }
    if (provider === 'together') {
      return !!process.env.TOGETHER_API_KEY
    }
    return false
  } catch {
    return false
  }
} 
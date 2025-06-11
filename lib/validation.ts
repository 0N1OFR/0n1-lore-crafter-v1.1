// Comprehensive input validation and sanitization library

import DOMPurify from 'isomorphic-dompurify'

// Common validation patterns
export const VALIDATION_PATTERNS = {
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  TOKEN_ID: /^[0-9]+$/,
  WALLET_SIGNATURE: /^0x[a-fA-F0-9]{130}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NO_HTML_TAGS: /^[^<>]*$/,
  SAFE_TEXT: /^[a-zA-Z0-9\s\-_.,!?'"()\[\]]+$/
}

// Input length limits
export const LENGTH_LIMITS = {
  USERNAME: { min: 3, max: 20 },
  PASSWORD: { min: 8, max: 128 },
  EMAIL: { min: 5, max: 254 },
  TEXT_SHORT: { min: 1, max: 100 },
  TEXT_MEDIUM: { min: 1, max: 500 },
  TEXT_LONG: { min: 1, max: 2000 },
  AI_MESSAGE: { min: 1, max: 4000 },
  SYSTEM_PROMPT: { min: 10, max: 8000 },
  TOKEN_ID: { min: 1, max: 4 },
  WALLET_ADDRESS: { min: 42, max: 42 }
}

// Dangerous patterns to detect
const DANGEROUS_PATTERNS = [
  // SQL Injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/gi,
  /((\%3D)|(=))[^\n]*((\%27)|(\\x27)|(\')|((\%3B)|(;)))/gi,
  
  // XSS patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
  
  // Prompt injection patterns
  /ignore\s+(previous|above|all)\s+(instructions|prompts?)/gi,
  /forget\s+(everything|all|previous)/gi,
  /system\s*:\s*you\s+are/gi,
  /act\s+as\s+(if\s+you\s+are|a)/gi,
  /pretend\s+(to\s+be|you\s+are)/gi,
  /roleplay\s+as/gi,
  /new\s+(instructions?|prompt)/gi,
  /override\s+(previous|system|safety)/gi,
  /jailbreak/gi,
  /\[\s*system\s*\]/gi,
  /\{\s*system\s*\}/gi
]

// Validation error types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  sanitized?: any
}

// Base validator class
export class InputValidator {
  private errors: ValidationError[] = []

  // Reset errors for new validation
  private reset() {
    this.errors = []
  }

  // Add validation error
  protected addError(field: string, message: string, code: string) {
    this.errors.push({ field, message, code })
  }

  // Sanitize text content
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return ''
    
    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    
    // Trim whitespace
    sanitized = sanitized.trim()
    
    // Use DOMPurify for HTML sanitization
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    })
    
    return sanitized
  }

  // Sanitize AI prompt to prevent prompt injection
  static sanitizeAIPrompt(input: string): string {
    if (typeof input !== 'string') return ''
    
    let sanitized = this.sanitizeText(input)
    
    // Remove potentially dangerous prompt injection patterns
    DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[FILTERED]')
    })
    
    // Limit consecutive special characters
    sanitized = sanitized.replace(/[!@#$%^&*()_+={}\[\]|\\:";'<>?,./]{4,}/g, '[FILTERED]')
    
    return sanitized
  }

  // Validate string field
  validateString(
    field: string, 
    value: any, 
    options: {
      required?: boolean
      minLength?: number
      maxLength?: number
      pattern?: RegExp
      allowEmpty?: boolean
    } = {}
  ): string | null {
    const { required = true, minLength, maxLength, pattern, allowEmpty = false } = options

    // Check if value exists
    if (value === undefined || value === null) {
      if (required) {
        this.addError(field, `${field} is required`, 'REQUIRED')
      }
      return null
    }

    // Convert to string and sanitize
    const stringValue = String(value)
    const sanitized = InputValidator.sanitizeText(stringValue)

    // Check if empty after sanitization
    if (!allowEmpty && sanitized.length === 0) {
      if (required) {
        this.addError(field, `${field} cannot be empty`, 'EMPTY')
      }
      return null
    }

    // Check length constraints
    if (minLength !== undefined && sanitized.length < minLength) {
      this.addError(field, `${field} must be at least ${minLength} characters`, 'MIN_LENGTH')
      return null
    }

    if (maxLength !== undefined && sanitized.length > maxLength) {
      this.addError(field, `${field} must be no more than ${maxLength} characters`, 'MAX_LENGTH')
      return null
    }

    // Check pattern
    if (pattern && !pattern.test(sanitized)) {
      this.addError(field, `${field} format is invalid`, 'INVALID_FORMAT')
      return null
    }

    // Check for dangerous patterns
    const hasDangerousContent = DANGEROUS_PATTERNS.some(pattern => pattern.test(sanitized))
    if (hasDangerousContent) {
      this.addError(field, `${field} contains potentially dangerous content`, 'DANGEROUS_CONTENT')
      return null
    }

    return sanitized
  }

  // Validate Ethereum address
  validateEthereumAddress(field: string, value: any, required: boolean = true): string | null {
    return this.validateString(field, value, {
      required,
      pattern: VALIDATION_PATTERNS.ETHEREUM_ADDRESS,
      minLength: 42,
      maxLength: 42
    })
  }

  // Validate token ID
  validateTokenId(field: string, value: any, required: boolean = true): string | null {
    const tokenId = this.validateString(field, value, {
      required,
      pattern: VALIDATION_PATTERNS.TOKEN_ID,
      ...LENGTH_LIMITS.TOKEN_ID
    })

    if (tokenId !== null) {
      const numericValue = parseInt(tokenId, 10)
      if (numericValue < 1 || numericValue > 7777) {
        this.addError(field, 'Token ID must be between 1 and 7777', 'OUT_OF_RANGE')
        return null
      }
    }

    return tokenId
  }

  // Validate AI message content
  validateAIMessage(field: string, value: any, required: boolean = true): string | null {
    if (value === undefined || value === null) {
      if (required) {
        this.addError(field, `${field} is required`, 'REQUIRED')
      }
      return null
    }

    const stringValue = String(value)
    const sanitized = InputValidator.sanitizeAIPrompt(stringValue)

    // Check length constraints
    if (sanitized.length < LENGTH_LIMITS.AI_MESSAGE.min) {
      this.addError(field, `${field} must be at least ${LENGTH_LIMITS.AI_MESSAGE.min} characters`, 'MIN_LENGTH')
      return null
    }

    if (sanitized.length > LENGTH_LIMITS.AI_MESSAGE.max) {
      this.addError(field, `${field} must be no more than ${LENGTH_LIMITS.AI_MESSAGE.max} characters`, 'MAX_LENGTH')
      return null
    }

    return sanitized
  }

  // Validate array
  validateArray(field: string, value: any, options: {
    required?: boolean
    minItems?: number
    maxItems?: number
    itemValidator?: (item: any, index: number) => any
  } = {}): any[] | null {
    const { required = true, minItems, maxItems, itemValidator } = options

    if (!Array.isArray(value)) {
      if (required) {
        this.addError(field, `${field} must be an array`, 'INVALID_TYPE')
      }
      return null
    }

    if (minItems !== undefined && value.length < minItems) {
      this.addError(field, `${field} must have at least ${minItems} items`, 'MIN_ITEMS')
      return null
    }

    if (maxItems !== undefined && value.length > maxItems) {
      this.addError(field, `${field} must have no more than ${maxItems} items`, 'MAX_ITEMS')
      return null
    }

    if (itemValidator) {
      return value.map((item, index) => itemValidator(item, index))
    }

    return value
  }

  // Validate object structure
  validateObject(field: string, value: any, required: boolean = true): object | null {
    if (value === undefined || value === null) {
      if (required) {
        this.addError(field, `${field} is required`, 'REQUIRED')
      }
      return null
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      this.addError(field, `${field} must be an object`, 'INVALID_TYPE')
      return null
    }

    return value
  }

  // Get validation results
  getResult(sanitizedData?: any): ValidationResult {
    const result: ValidationResult = {
      isValid: this.errors.length === 0,
      errors: [...this.errors]
    }

    if (sanitizedData) {
      result.sanitized = sanitizedData
    }

    this.reset()
    return result
  }
}

// Specific validators for common use cases
export class AuthValidator extends InputValidator {
  validateAuthRequest(data: any): ValidationResult {
    const sanitized: any = {}

    sanitized.address = this.validateEthereumAddress('address', data.address)
    sanitized.signature = this.validateString('signature', data.signature, {
      required: true,
      pattern: VALIDATION_PATTERNS.WALLET_SIGNATURE
    })
    sanitized.message = this.validateString('message', data.message, {
      required: true,
      ...LENGTH_LIMITS.TEXT_LONG
    })
    sanitized.nonce = this.validateString('nonce', data.nonce, {
      required: true,
      ...LENGTH_LIMITS.TEXT_SHORT
    })

    return this.getResult(sanitized)
  }
}

export class AIValidator extends InputValidator {
  validateChatRequest(data: any): ValidationResult {
    const sanitized: any = {}

    sanitized.message = this.validateAIMessage('message', data.message)
    sanitized.nftId = this.validateTokenId('nftId', data.nftId)
    sanitized.provider = this.validateString('provider', data.provider, {
      required: true,
      pattern: /^(openai|claude)$/
    })
    
    if (data.model) {
      sanitized.model = this.validateString('model', data.model, {
        required: false,
        pattern: /^[a-zA-Z0-9\-_.]+$/,
        ...LENGTH_LIMITS.TEXT_SHORT
      })
    }

    if (data.enhancedPersonality !== undefined) {
      sanitized.enhancedPersonality = Boolean(data.enhancedPersonality)
    }

    if (data.responseStyle) {
      sanitized.responseStyle = this.validateString('responseStyle', data.responseStyle, {
        required: false,
        pattern: /^(dialogue|narrative)$/
      })
    }

    // Validate memory profile if present
    if (data.memoryProfile) {
      sanitized.memoryProfile = this.validateObject('memoryProfile', data.memoryProfile)
    }

    return this.getResult(sanitized)
  }

  validateAgentRequest(data: any): ValidationResult {
    const sanitized: any = {}

    // Validate messages array
    sanitized.messages = this.validateArray('messages', data.messages, {
      required: true,
      minItems: 1,
      maxItems: 50,
      itemValidator: (msg: any) => {
        const role = this.validateString('role', msg.role, {
          required: true,
          pattern: /^(user|assistant|system)$/
        })
        const content = this.validateAIMessage('content', msg.content)
        return { role, content }
      }
    })

    // Validate prompts
    if (data.systemPrompt) {
      sanitized.systemPrompt = this.validateString('systemPrompt', data.systemPrompt, {
        required: false,
        ...LENGTH_LIMITS.SYSTEM_PROMPT
      })
    }

    if (data.memoryContext) {
      sanitized.memoryContext = this.validateString('memoryContext', data.memoryContext, {
        required: false,
        ...LENGTH_LIMITS.SYSTEM_PROMPT
      })
    }

    // Validate model and settings
    if (data.model) {
      sanitized.model = this.validateString('model', data.model, {
        required: false,
        pattern: /^[a-zA-Z0-9\-_.]+$/
      })
    }

    if (data.temperature !== undefined) {
      const temp = parseFloat(data.temperature)
      if (isNaN(temp) || temp < 0 || temp > 2) {
        this.addError('temperature', 'Temperature must be between 0 and 2', 'OUT_OF_RANGE')
      } else {
        sanitized.temperature = temp
      }
    }

    if (data.maxTokens !== undefined) {
      const tokens = parseInt(data.maxTokens, 10)
      if (isNaN(tokens) || tokens < 1 || tokens > 4000) {
        this.addError('maxTokens', 'Max tokens must be between 1 and 4000', 'OUT_OF_RANGE')
      } else {
        sanitized.maxTokens = tokens
      }
    }

    return this.getResult(sanitized)
  }
}

export class NFTValidator extends InputValidator {
  validateOwnershipRequest(data: any): ValidationResult {
    const sanitized: any = {}

    sanitized.address = this.validateEthereumAddress('address', data.address)
    sanitized.tokenId = this.validateTokenId('tokenId', data.tokenId)

    return this.getResult(sanitized)
  }
}

// Export convenience functions
export const validateAuth = (data: any) => new AuthValidator().validateAuthRequest(data)
export const validateAIChat = (data: any) => new AIValidator().validateChatRequest(data)
export const validateAIAgent = (data: any) => new AIValidator().validateAgentRequest(data)
export const validateNFTOwnership = (data: any) => new NFTValidator().validateOwnershipRequest(data)

// Rate limiting validation
export const validateRateLimit = (field: string, value: any): number | null => {
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 0) {
    return null
  }
  return parsed
}

// Sanitize filename for safe storage
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9\-_.]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
} 
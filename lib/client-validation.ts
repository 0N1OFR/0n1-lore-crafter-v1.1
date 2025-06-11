// Client-side validation utilities for immediate feedback

// Import validation patterns from server-side validation
import { VALIDATION_PATTERNS, LENGTH_LIMITS } from './validation'

// Client-side input sanitization
export function sanitizeUserInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove dangerous characters and patterns
  let sanitized = input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
  
  return sanitized.substring(0, 4000) // Limit length
}

// Validate input in real-time
export function validateInput(
  value: string, 
  type: 'text' | 'message' | 'address' | 'tokenId' | 'email'
): { isValid: boolean; error?: string } {
  if (!value) {
    return { isValid: false, error: 'This field is required' }
  }

  switch (type) {
    case 'address':
      if (!VALIDATION_PATTERNS.ETHEREUM_ADDRESS.test(value)) {
        return { isValid: false, error: 'Invalid Ethereum address format' }
      }
      break
      
    case 'tokenId':
      if (!VALIDATION_PATTERNS.TOKEN_ID.test(value)) {
        return { isValid: false, error: 'Token ID must be numeric' }
      }
      const num = parseInt(value, 10)
      if (num < 1 || num > 7777) {
        return { isValid: false, error: 'Token ID must be between 1 and 7777' }
      }
      break
      
    case 'email':
      if (!VALIDATION_PATTERNS.EMAIL.test(value)) {
        return { isValid: false, error: 'Invalid email format' }
      }
      break
      
    case 'message':
      if (value.length < LENGTH_LIMITS.AI_MESSAGE.min) {
        return { isValid: false, error: `Message must be at least ${LENGTH_LIMITS.AI_MESSAGE.min} characters` }
      }
      if (value.length > LENGTH_LIMITS.AI_MESSAGE.max) {
        return { isValid: false, error: `Message must be no more than ${LENGTH_LIMITS.AI_MESSAGE.max} characters` }
      }
      break
      
    case 'text':
      if (value.length > LENGTH_LIMITS.TEXT_LONG.max) {
        return { isValid: false, error: `Text must be no more than ${LENGTH_LIMITS.TEXT_LONG.max} characters` }
      }
      break
  }

  return { isValid: true }
}

// Real-time input formatter
export function formatInput(value: string, type: 'address' | 'tokenId'): string {
  switch (type) {
    case 'address':
      // Ensure 0x prefix and proper case
      if (value && !value.startsWith('0x')) {
        return `0x${value}`
      }
      return value.toLowerCase()
      
    case 'tokenId':
      // Remove leading zeros and non-numeric characters
      return value.replace(/[^0-9]/g, '').replace(/^0+/, '') || '0'
      
    default:
      return value
  }
}

// Check for potentially dangerous content
export function checkForDangerousContent(input: string): boolean {
  const dangerousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+=/gi,
    /eval\(/gi,
    /setTimeout\(/gi,
    /setInterval\(/gi,
    /Function\(/gi,
    /document\./gi,
    /window\./gi
  ]
  
  return dangerousPatterns.some(pattern => pattern.test(input))
}

// Escape HTML entities
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Validate form data before submission
export interface FormValidationResult {
  isValid: boolean
  errors: { [field: string]: string }
  sanitized: { [field: string]: any }
}

export function validateFormData(data: { [key: string]: any }): FormValidationResult {
  const errors: { [field: string]: string } = {}
  const sanitized: { [field: string]: any } = {}

  for (const [field, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Check for dangerous content
      if (checkForDangerousContent(value)) {
        errors[field] = 'Input contains potentially dangerous content'
        continue
      }
      
      // Sanitize the input
      sanitized[field] = sanitizeUserInput(value)
    } else {
      sanitized[field] = value
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  }
} 
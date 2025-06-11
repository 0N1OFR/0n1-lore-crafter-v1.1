// Utility for making authenticated API calls
// This will be used throughout the app to replace direct fetch calls

interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean // Allow bypassing auth for public endpoints
}

interface AuthStore {
  accessToken: string | null
  triggerReauth: (() => void) | null
}

// Global auth store (will be set by AuthProvider)
let authStore: AuthStore = {
  accessToken: null,
  triggerReauth: null
}

// Function to set auth store (called by AuthProvider)
export function setAuthStore(token: string | null, triggerReauth: (() => void) | null) {
  authStore.accessToken = token
  authStore.triggerReauth = triggerReauth
}

// Authenticated fetch wrapper
export async function authenticatedFetch(
  url: string, 
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers = {}, ...restOptions } = options

  // If skipAuth is true, make regular fetch
  if (skipAuth) {
    return fetch(url, { headers, ...restOptions })
  }

  // Get current token from localStorage if not in store
  let token = authStore.accessToken
  if (!token) {
    token = localStorage.getItem("authToken")
  }

  // If no token available, trigger re-auth
  if (!token) {
    console.warn("No auth token available for API call:", url)
    if (authStore.triggerReauth) {
      authStore.triggerReauth()
    }
    throw new Error("Authentication required")
  }

  // Add auth header
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${token}`
  }

  // Make authenticated request
  const response = await fetch(url, {
    headers: authHeaders,
    ...restOptions
  })

  // Handle 401 Unauthorized
  if (response.status === 401) {
    console.warn("API call returned 401, token may be expired:", url)
    
    // Clear invalid token
    localStorage.removeItem("authToken")
    localStorage.removeItem("authUser")
    authStore.accessToken = null
    
    // Trigger re-authentication
    if (authStore.triggerReauth) {
      authStore.triggerReauth()
    }
    
    throw new Error("Authentication expired")
  }

  return response
}

// Convenience methods for common HTTP verbs
export const api = {
  get: (url: string, options?: AuthenticatedFetchOptions) => 
    authenticatedFetch(url, { method: 'GET', ...options }),
  
  post: (url: string, data?: any, options?: AuthenticatedFetchOptions) => 
    authenticatedFetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
  
  put: (url: string, data?: any, options?: AuthenticatedFetchOptions) => 
    authenticatedFetch(url, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
  
  delete: (url: string, options?: AuthenticatedFetchOptions) => 
    authenticatedFetch(url, { method: 'DELETE', ...options }),
}

// Usage examples:
// const response = await api.get('/api/user-data')
// const response = await api.post('/api/ai-agent', { messages: [...] })
// const response = await api.get('/api/public-data', { skipAuth: true }) 
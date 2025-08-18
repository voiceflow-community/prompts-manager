'use client'

import { useSession as useNextAuthSession } from 'next-auth/react'
import { useMockSession } from '@/components/providers'
import { useState, useEffect } from 'react'

// Custom hook that works with both real auth and no-auth mode
export function useSession() {
  const [isAuthDisabled, setIsAuthDisabled] = useState(false)

  // Check auth status on client side to avoid hydration mismatch
  useEffect(() => {
    setIsAuthDisabled(process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true')
  }, [])

  // Always call both hooks (React hooks rules)
  const mockSession = useMockSession()
  const realSession = useNextAuthSession()

  // Return appropriate session based on auth state
  return isAuthDisabled ? mockSession : realSession
}

// Export a no-op signOut function for no-auth mode
export function signOut() {
  // Check if we're in the browser first
  if (typeof window === 'undefined') {
    return Promise.resolve({ url: '/' })
  }

  const isAuthDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'

  if (isAuthDisabled) {
    // In no-auth mode, just redirect to home
    window.location.href = '/'
    return Promise.resolve({ url: '/' })
  }

  // Import and use real signOut dynamically
  return import('next-auth/react').then(({ signOut: realSignOut }) => realSignOut())
}

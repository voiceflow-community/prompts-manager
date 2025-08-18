'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'
import { createContext, useContext, ReactNode } from 'react'

// Mock session context for when auth is disabled
const MockSessionContext = createContext<{
  data: {
    user: {
      name: string
      email: string
      image: string | null
    }
    expires: string
  } | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}>({
  data: {
    user: {
      name: 'No Auth User',
      email: 'no-auth@voiceflow.com',
      image: null
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  status: 'authenticated'
})

// Mock SessionProvider component for no-auth mode
function MockSessionProvider({ children }: { children: ReactNode }) {
  return (
    <MockSessionContext.Provider value={{
      data: {
        user: {
          name: 'No Auth User',
          email: 'no-auth@voiceflow.com',
          image: null
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'authenticated'
    }}>
      {children}
    </MockSessionContext.Provider>
  )
}

// Hook to use mock session
export function useMockSession() {
  return useContext(MockSessionContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MockSessionProvider>
        <ThemeProvider
          defaultTheme="system"
          storageKey="vf-prompts-ui-theme"
        >
          {children}
        </ThemeProvider>
      </MockSessionProvider>
    </SessionProvider>
  )
}

'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vf-prompts-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => {
      if (typeof window !== 'undefined') {
        // Try localStorage first
        const stored = localStorage.getItem(storageKey)
        if (stored) return stored as Theme

        // Fallback to cookie
        const cookies = document.cookie.split(';')
        const themeCookie = cookies.find(cookie => cookie.trim().startsWith(`${storageKey}=`))
        if (themeCookie) {
          return themeCookie.split('=')[1] as Theme
        }
      }
      return defaultTheme
    }
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      // Store in localStorage
      localStorage.setItem(storageKey, theme)

      // Also store in cookie for server-side access
      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1) // 1 year expiry
      document.cookie = `${storageKey}=${theme}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`

      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

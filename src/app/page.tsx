'use client'

import { useSession } from '@/lib/use-session'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginPage } from '@/components/login-page'
import { Dashboard } from '@/components/dashboard'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthDisabled, setIsAuthDisabled] = useState(false)

  // Check auth status on client side to avoid hydration mismatch
  useEffect(() => {
    setIsAuthDisabled(process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true')
  }, [])

  useEffect(() => {
    // In no-auth mode, skip authentication checks
    if (isAuthDisabled) {
      return
    }

    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router, isAuthDisabled])

  // In no-auth mode, always show dashboard
  if (isAuthDisabled) {
    return <Dashboard />
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return <Dashboard />
}

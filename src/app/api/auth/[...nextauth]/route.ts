import NextAuth from "next-auth"
import { authOptions, isAuthDisabled } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

// Create NextAuth handler outside the conditional function
const nextAuthHandler = NextAuth(authOptions)

// Create a handler that conditionally handles auth or no-auth mode
async function conditionalHandler(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  if (isAuthDisabled()) {
    const url = new URL(req.url)
    const path = url.pathname

    // Handle different NextAuth endpoints that the client expects
    if (path.includes('/session')) {
      // Return a mock session for /api/auth/session
      return NextResponse.json({
        user: {
          name: 'No Auth User',
          email: 'no-auth@voiceflow.com',
          image: null
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    if (path.includes('/providers')) {
      // Return empty providers list for /api/auth/providers
      return NextResponse.json({})
    }

    if (path.includes('/csrf')) {
      // Return a mock CSRF token for /api/auth/csrf
      return NextResponse.json({ csrfToken: 'no-auth-csrf-token' })
    }

    // For any other auth endpoints, return a generic success response
    return NextResponse.json({ message: "Authentication disabled" }, { status: 200 })
  }

  // For real auth, call the NextAuth handler with proper context
  try {
    return nextAuthHandler(req, context)
  } catch (error) {
    console.error('NextAuth handler error:', error)
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }
}

export { conditionalHandler as GET, conditionalHandler as POST }

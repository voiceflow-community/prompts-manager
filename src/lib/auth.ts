import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { getServerSession } from "next-auth/next"

// Check if authentication is disabled via environment variable
export const isAuthDisabled = () => {
  return process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'
}

// Get allowed email domains from environment variable
export const getAllowedEmailDomains = (): string[] => {
  const domainsEnv = process.env.ALLOWED_EMAIL_DOMAINS
  if (!domainsEnv) {
    // Default to voiceflow.com if no domains are specified
    return ['voiceflow.com']
  }
  // Split by comma and trim whitespace
  return domainsEnv.split(',').map(domain => domain.trim()).filter(domain => domain.length > 0)
}

// Check if email domain is allowed
export const isEmailDomainAllowed = (email: string): boolean => {
  if (!email) return false

  const allowedDomains = getAllowedEmailDomains()
  return allowedDomains.some(domain => email.endsWith(`@${domain}`))
}

// Custom server session handler that works with both auth modes
export async function getServerSessionWithAuth() {
  if (isAuthDisabled()) {
    // Return a mock session when auth is disabled
    return {
      user: {
        name: 'No Auth User',
        email: 'no-auth@voiceflow.com',
        image: null
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  return getServerSession(authOptions)
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow email addresses from configured domains
      if (user.email && isEmailDomainAllowed(user.email)) {
        return true
      }
      return false
    },
    async session({ session }) {
      return session
    },
    async jwt({ token }) {
      return token
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

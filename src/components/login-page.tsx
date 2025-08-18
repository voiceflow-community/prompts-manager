'use client'

import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Github, Mail } from 'lucide-react'

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary rounded-full p-3">
              <Bot className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Voiceflow Prompts Manager
          </h1>
          <p className="text-gray-600">
            Manage and version your LLM prompts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Welcome!
            </CardTitle>
            <CardDescription className="text-center">
              Sign in with your Google account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full"
              size="lg"
            >
              <Mail className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="text-center text-sm text-gray-500">
              Only authorized email domains are allowed
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500 flex items-center justify-center">
            <Github className="mr-1 h-4 w-4" />
            Powered by GitHub
          </p>
        </div>
      </div>
    </div>
  )
}

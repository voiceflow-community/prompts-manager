'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from '@/lib/use-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PromptList } from '@/components/prompt-list'
import { PromptDialog } from '@/components/prompt-dialog'
import { SearchBar } from '@/components/search-bar'
import { ThemeToggleButton } from '@/components/theme-toggle'
import {
  Bot,
  Plus,
  FileText,
  Clock,
  LogOut,
  User,
  Github
} from 'lucide-react'
import type { Prompt } from '@prisma/client'

export function Dashboard() {
  const { data: session } = useSession()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [stats, setStats] = useState({ total: 0, published: 0, recentCount: 0 })
  const [statsLoading, setStatsLoading] = useState(false)
  const [searchActive, setSearchActive] = useState(false)
  const [isAuthDisabled, setIsAuthDisabled] = useState(false)
  const [showAllPrompts, setShowAllPrompts] = useState(false)

  // Check auth status on client side to avoid hydration mismatch
  useEffect(() => {
    setIsAuthDisabled(process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true')
  }, [])

  useEffect(() => {
    fetchPrompts()
    fetchStats()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data)
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handlePromptCreated = (newPrompt: Prompt) => {
    setPrompts(prev => [newPrompt, ...prev])
    setIsCreateDialogOpen(false)
    // Refresh stats when a new prompt is created
    fetchStats()
  }

  const handlePromptUpdated = (updatedPrompt: Prompt) => {
    setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p))
    // Refresh stats when a prompt is updated (could affect recent activity)
    fetchStats()
  }

  const handlePromptDeleted = (promptId: string) => {
    setPrompts(prev => prev.filter(p => p.id !== promptId))
    // Refresh stats when a prompt is deleted
    fetchStats()
  }

  const handleSearch = async (query: string, filters: { category?: string; model?: string }) => {
    setSearchLoading(true)
    try {
      const searchParams = new URLSearchParams()

      if (query) {
        searchParams.append('q', query)
      }

      if (filters.category) {
        searchParams.append('category', filters.category)
      }

      if (filters.model) {
        searchParams.append('model', filters.model)
      }

      const url = `/api/prompts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setPrompts(data)
        setSearchActive(query !== '' || filters.category !== undefined || filters.model !== undefined)
        // Reset show all when searching
        setShowAllPrompts(false)
      }
    } catch (error) {
      console.error('Error searching prompts:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const recentPrompts = prompts.slice(0, 3)

  // For the main list, show either 4 prompts or all prompts based on state
  // When searching, always show all results
  const displayedPrompts = searchActive ? prompts : (showAllPrompts ? prompts : prompts.slice(0, 4))
  const hasMorePrompts = !searchActive && prompts.length > 4 && !showAllPrompts

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-black shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Prompts Manager
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>{session?.user?.name}</span>
              </div>
              <ThemeToggleButton />
              {!isAuthDisabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Prompts
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${statsLoading ? 'opacity-50 animate-pulse' : ''}`}>
                {stats.total}
              </div>
              <p className="text-xs text-muted-foreground">
                Total prompts in database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Published Prompts
              </CardTitle>
              <Github className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${statsLoading ? 'opacity-50 animate-pulse' : ''}`}>
                {stats.published}
              </div>
              <p className="text-xs text-muted-foreground">
                Prompts published to GitHub
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${statsLoading ? 'opacity-50 animate-pulse' : ''}`}>
                {stats.recentCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Updated in last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Prompts */}
        {recentPrompts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recently Updated Prompts</CardTitle>
              <CardDescription>
                Your 3 most recently updated prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentPrompts.map((prompt) => (
                  <div key={prompt.id} className="p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium truncate">{prompt.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {prompt.description}
                      </p>
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <div>Category: {prompt.category}</div>
                        <div>Model: {prompt.model || 'Not specified'}</div>
                        <div>Updated: {new Date(prompt.updatedAt).toLocaleDateString()}</div>
                        {prompt.isPublished && (
                          <div className="text-green-600 font-medium">Published</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <SearchBar onSearch={handleSearch} loading={searchLoading} />

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {searchActive ? 'Search Results' : 'All Prompts'}
          </h2>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
        </div>

        {/* Prompts List */}
        <PromptList
          prompts={displayedPrompts}
          loading={loading || searchLoading}
          onPromptUpdated={handlePromptUpdated}
          onPromptDeleted={handlePromptDeleted}
        />

        {/* Show More/Less Button */}
        {!searchActive && prompts.length > 4 && (
          <div className="flex justify-center mt-6">
            {showAllPrompts ? (
              <Button
                variant="outline"
                onClick={() => setShowAllPrompts(false)}
                className="px-8"
              >
                Show Less
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAllPrompts(true)}
                className="px-8"
              >
                Show More ({prompts.length - 4} more prompts)
              </Button>
            )}
          </div>
        )}

        {/* Create Prompt Dialog */}
        <PromptDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onPromptSaved={handlePromptCreated}
        />
      </main>
    </div>
  )
}

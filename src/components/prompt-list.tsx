'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PromptDialog } from '@/components/prompt-dialog'
import { VersionDialog } from '@/components/version-dialog'
import {
  Edit,
  Trash2,
  History,
  Calendar,
  Tag,
  Cpu,
  Upload,
  RefreshCw,
  GitPullRequestClosed
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Prompt } from '@prisma/client'

interface PromptListProps {
  prompts: Prompt[]
  loading: boolean
  onPromptUpdated: (prompt: Prompt) => void
  onPromptDeleted: (promptId: string) => void
}

export function PromptList({ prompts, loading, onPromptUpdated, onPromptDeleted }: PromptListProps) {
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [versionPrompt, setVersionPrompt] = useState<Prompt | null>(null)
  const [deletingPrompt, setDeletingPrompt] = useState<string | null>(null)
  const [publishingPrompt, setPublishingPrompt] = useState<string | null>(null)
  const [unpublishingPrompt, setUnpublishingPrompt] = useState<string | null>(null)

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
  }

  const handleDelete = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return
    }

    setDeletingPrompt(promptId)

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onPromptDeleted(promptId)
      } else {
        alert('Failed to delete prompt')
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
      alert('Failed to delete prompt')
    } finally {
      setDeletingPrompt(null)
    }
  }

  const handleViewVersions = (prompt: Prompt) => {
    setVersionPrompt(prompt)
  }

  const handlePromptUpdated = (updatedPrompt: Prompt) => {
    onPromptUpdated(updatedPrompt)
    setEditingPrompt(null)
  }

  const handlePublish = async (promptId: string, isPublished: boolean) => {
    setPublishingPrompt(promptId)

    try {
      const url = `/api/prompts/${promptId}/publish`
      const method = isPublished ? 'PUT' : 'POST'

      const response = await fetch(url, { method })

      if (response.ok) {
        const result = await response.json()
        onPromptUpdated(result.prompt || { ...prompts.find(p => p.id === promptId)!, isPublished: true })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to publish prompt')
      }
    } catch (error) {
      console.error('Error publishing prompt:', error)
      alert('Failed to publish prompt')
    } finally {
      setPublishingPrompt(null)
    }
  }

  const handleUnpublish = async (promptId: string) => {
    if (!confirm('Are you sure you want to unpublish this prompt? This will remove it from the GitHub repository.')) {
      return
    }

    setUnpublishingPrompt(promptId)

    try {
      const response = await fetch(`/api/prompts/${promptId}/publish`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        onPromptUpdated(result.prompt)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to unpublish prompt')
      }
    } catch (error) {
      console.error('Error unpublishing prompt:', error)
      alert('Failed to unpublish prompt')
    } finally {
      setUnpublishingPrompt(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (prompts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Tag className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first prompt to get started with managing your LLM prompts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{prompt.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {prompt.description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(prompt)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewVersions(prompt)}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  {!prompt.isPublished ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePublish(prompt.id, false)}
                      disabled={publishingPrompt === prompt.id}
                      title="Publish to GitHub"
                    >
                      {publishingPrompt === prompt.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePublish(prompt.id, true)}
                        disabled={publishingPrompt === prompt.id}
                        title="Update published version"
                      >
                        {publishingPrompt === prompt.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnpublish(prompt.id)}
                        disabled={unpublishingPrompt === prompt.id}
                        title="Unpublish from GitHub"
                      >
                        {unpublishingPrompt === prompt.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <GitPullRequestClosed className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(prompt.id)}
                    disabled={deletingPrompt === prompt.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Tag className="h-4 w-4" />
                  <span>{prompt.category}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Cpu className="h-4 w-4" />
                  <span>{prompt.model || 'Not specified'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                </div>
                {prompt.isPublished && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Published</span>
                  </div>
                )}
              </div>

              {/* Preview of content */}
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="prose prose-sm max-w-none dark:prose-invert line-clamp-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {prompt.content.length > 200
                      ? `${prompt.content.substring(0, 200)}...`
                      : prompt.content}
                  </ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingPrompt && (
        <PromptDialog
          open={true}
          onOpenChange={(open) => !open && setEditingPrompt(null)}
          prompt={editingPrompt}
          onPromptSaved={handlePromptUpdated}
        />
      )}

      {/* Version Dialog */}
      {versionPrompt && (
        <VersionDialog
          open={true}
          onOpenChange={(open) => !open && setVersionPrompt(null)}
          prompt={versionPrompt}
          onPromptReverted={handlePromptUpdated}
        />
      )}
    </>
  )
}

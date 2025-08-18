'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  GitCommit,
  RotateCcw,
  Clock,
  Tag,
  Cpu,
  Eye,
  X
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Prompt, PromptVersion } from '@prisma/client'

interface VersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: Prompt
  onPromptReverted: (prompt: Prompt) => void
}



export function VersionDialog({ open, onOpenChange, prompt, onPromptReverted }: VersionDialogProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [reverting, setReverting] = useState<string | null>(null)
  const [previewVersion, setPreviewVersion] = useState<PromptVersion | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const fetchVersions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setLoading(false)
    }
  }, [prompt.id])

  useEffect(() => {
    if (open && prompt) {
      fetchVersions()
    }
  }, [open, prompt, fetchVersions])



  const handleRevert = async (versionId: string) => {
    if (!confirm('Are you sure you want to revert to this version? This will create a new version.')) {
      return
    }

    setReverting(versionId)
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ versionId }),
      })

      if (response.ok) {
        const revertedPrompt = await response.json()
        onPromptReverted(revertedPrompt)
        onOpenChange(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to revert prompt')
      }
    } catch (error) {
      console.error('Error reverting prompt:', error)
      alert('Failed to revert prompt')
    } finally {
      setReverting(null)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString()
  }



  const handlePreviewClick = (version: PromptVersion) => {
    setPreviewVersion(version)
    setPreviewOpen(true)
  }

  const handlePreviewClose = () => {
    setPreviewOpen(false)
    setPreviewVersion(null)
  }

    return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Version History: {prompt.name}</span>
            </DialogTitle>
            <DialogDescription>
              View all versions of this prompt and revert to a previous version if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : versions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <GitCommit className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No versions found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This prompt doesn&apos;t have any commit history yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
                          <div className="space-y-3">
                {versions.map((version, index) => (
                                    <Card
                    key={version.id}
                    className={`${index === 0 ? 'ring-2 ring-primary' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => handlePreviewClick(version)}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <GitCommit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
                              v{version.version}
                            </code>
                            {index === 0 && (
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {version.name}
                          </p>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {version.description}
                          </p>

                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Tag className="h-3 w-3" />
                              <span>{version.category}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Cpu className="h-3 w-3" />
                              <span>{version.model || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(version.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewClick(version)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {index !== 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevert(version.id)}
                              disabled={reverting === version.id}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              {reverting === version.id ? 'Reverting...' : 'Revert'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Content Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Preview: {previewVersion?.name}</span>
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
                v{previewVersion?.version}
              </code>
            </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviewClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              {previewVersion?.description}
            </DialogDescription>
          </DialogHeader>

                  <div className="flex-1 overflow-hidden">
          <div className="h-full border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-1">
                  <Tag className="h-3 w-3" />
                  <span>{previewVersion?.category}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Cpu className="h-3 w-3" />
                  <span>{previewVersion?.model || 'Not specified'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{previewVersion && formatDate(previewVersion.createdAt)}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Prompt Content:</h4>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {previewVersion?.content || ''}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Prompt } from '@prisma/client'

interface PromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt?: Prompt | null
  onPromptSaved: (prompt: Prompt) => void
}

interface ModelOption {
  value: string
  label: string
}

export function PromptDialog({ open, onOpenChange, prompt, onPromptSaved }: PromptDialogProps) {
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<ModelOption[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    model: '',
    content: '',
  })

  const isEditing = !!prompt

  useEffect(() => {
    if (open) {
      fetchModels()
      fetchCategories()
      if (prompt) {
        setFormData({
          name: prompt.name,
          description: prompt.description,
          category: prompt.category,
          model: prompt.model || 'none',
          content: prompt.content,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          category: '',
          model: 'none',
          content: '',
        })
      }
      setShowCustomCategory(false)
      setCustomCategory('')
    }
  }, [open, prompt])

  // Check if the current category is in the list when categories are loaded
  useEffect(() => {
    if (prompt && categories.length > 0 && formData.category) {
      const categoryExists = categories.includes(formData.category)
      if (!categoryExists) {
        setShowCustomCategory(true)
        setCustomCategory(formData.category)
      }
    }
  }, [categories, prompt, formData.category])

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        model: formData.model === 'none' ? null : formData.model,
        content: formData.content,
      }

      const url = isEditing ? `/api/prompts/${prompt.id}` : '/api/prompts'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const savedPrompt = await response.json()
        onPromptSaved(savedPrompt)
        onOpenChange(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save prompt')
      }
    } catch (error) {
      console.error('Error saving prompt:', error)
      alert('Failed to save prompt')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCategory(true)
      setFormData(prev => ({ ...prev, category: '' }))
    } else {
      setShowCustomCategory(false)
      setCustomCategory('')
      setFormData(prev => ({ ...prev, category: value }))
    }
  }

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value)
    setFormData(prev => ({ ...prev, category: value }))
  }

  const isFormValid = formData.name && formData.description && formData.category && formData.content



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Prompt' : 'Create New Prompt'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your prompt details and content. Changes will be committed to GitHub.'
              : 'Create a new prompt with metadata and content. It will be stored in your GitHub repository.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter prompt name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              {!showCustomCategory ? (
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      + Create new category
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex space-x-2">
                  <Input
                    id="category"
                    value={customCategory}
                    onChange={(e) => handleCustomCategoryChange(e.target.value)}
                    placeholder="Enter new category name"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCustomCategory(false)
                      setCustomCategory('')
                      setFormData(prev => ({ ...prev, category: '' }))
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the prompt"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">LLM Model <span className="text-gray-500 text-sm font-normal">(optional)</span></Label>
            <Select value={formData.model} onValueChange={(value) => handleInputChange('model', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an LLM model (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-gray-500">No model specified</span>
                </SelectItem>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Prompt Content</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant={!previewMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode(false)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant={previewMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode(true)}
                >
                  Preview
                </Button>
              </div>
            </div>
            <div className="border rounded-md overflow-hidden" style={{ height: '300px' }}>
              {!previewMode ? (
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Enter your prompt content here... (Supports Markdown)"
                  className="w-full h-full resize-none border-0 bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                  style={{
                    minHeight: '300px',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                />
              ) : (
                <div className="p-4 h-full overflow-y-auto bg-background text-foreground prose prose-sm dark:prose-invert max-w-none">
                  {formData.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formData.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic">No content to preview</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Prompt' : 'Create Prompt')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

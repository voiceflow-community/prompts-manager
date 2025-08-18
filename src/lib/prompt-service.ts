import { prisma } from './db'
import { Prompt, PromptVersion } from '@prisma/client'

export interface PromptWithVersions extends Prompt {
  versions: PromptVersion[]
}

export interface CreatePromptData {
  name: string
  description: string
  category: string
  model?: string
  content: string
}

export interface UpdatePromptData {
  name?: string
  description?: string
  category?: string
  model?: string | null
  content?: string
}

export class PromptService {
  async createPrompt(data: CreatePromptData): Promise<PromptWithVersions> {
    const prompt = await prisma.prompt.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        model: data.model,
        content: data.content,
        versions: {
          create: {
            version: 1,
            name: data.name,
            description: data.description,
            category: data.category,
            model: data.model,
            content: data.content,
          }
        }
      },
      include: {
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    })

    return prompt
  }

  async updatePrompt(id: string, data: UpdatePromptData): Promise<PromptWithVersions> {
    // Get current prompt to create new version
    const currentPrompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    })

    if (!currentPrompt) {
      throw new Error('Prompt not found')
    }

    const latestVersion = currentPrompt.versions[0]
    const nextVersion = latestVersion ? latestVersion.version + 1 : 1

    // Update prompt and create new version
    const updatedPrompt = await prisma.prompt.update({
      where: { id },
      data: {
        name: data.name ?? currentPrompt.name,
        description: data.description ?? currentPrompt.description,
        category: data.category ?? currentPrompt.category,
        model: data.model ?? currentPrompt.model,
        content: data.content ?? currentPrompt.content,
        updatedAt: new Date(),
        versions: {
          create: {
            version: nextVersion,
            name: data.name ?? currentPrompt.name,
            description: data.description ?? currentPrompt.description,
            category: data.category ?? currentPrompt.category,
            model: data.model ?? currentPrompt.model,
            content: data.content ?? currentPrompt.content,
          }
        }
      },
      include: {
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    })

    return updatedPrompt
  }

  async getPrompt(id: string): Promise<PromptWithVersions | null> {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    })

    return prompt
  }

  async getAllPrompts(): Promise<Prompt[]> {
    const prompts = await prisma.prompt.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    return prompts
  }

  async searchPrompts(query: string, filters?: {
    category?: string
    model?: string
  }): Promise<Prompt[]> {
    const whereClause: Record<string, unknown> = {}

    // Handle filters first
    if (filters?.category && filters.category !== 'all') {
      whereClause.category = { equals: filters.category }
    }

    if (filters?.model && filters.model !== 'all') {
      whereClause.model = { equals: filters.model }
    }

    // For text search, we'll get all prompts matching filters first, then filter in JS
    // This is necessary because SQLite doesn't support case-insensitive contains
    const prompts = await prisma.prompt.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { updatedAt: 'desc' }
    })

    // If there's a text query, filter the results in JavaScript for case-insensitive search
    if (query && query.trim()) {
      const searchQuery = query.toLowerCase()
      return prompts.filter(prompt =>
        prompt.name.toLowerCase().includes(searchQuery) ||
        prompt.description.toLowerCase().includes(searchQuery) ||
        prompt.content.toLowerCase().includes(searchQuery) ||
        prompt.category.toLowerCase().includes(searchQuery) ||
        (prompt.model && prompt.model.toLowerCase().includes(searchQuery))
      )
    }

    return prompts
  }

  async getFilterOptions(): Promise<{ categories: string[], models: string[] }> {
    const [categories, models] = await Promise.all([
      prisma.prompt.findMany({
        select: { category: true },
        distinct: ['category']
      }),
      prisma.prompt.findMany({
        select: { model: true },
        distinct: ['model']
      })
    ])

    return {
      categories: categories.map(p => p.category).sort(),
      models: models.map(p => p.model).filter((model): model is string => model !== null).sort()
    }
  }

  async deletePrompt(id: string): Promise<void> {
    await prisma.prompt.delete({
      where: { id }
    })
  }

  async getPromptVersions(id: string): Promise<PromptVersion[]> {
    const versions = await prisma.promptVersion.findMany({
      where: { promptId: id },
      orderBy: { version: 'desc' }
    })

    return versions
  }

  async revertToVersion(id: string, versionId: string): Promise<PromptWithVersions> {
    // Get the version to revert to
    const targetVersion = await prisma.promptVersion.findUnique({
      where: { id: versionId }
    })

    if (!targetVersion || targetVersion.promptId !== id) {
      throw new Error('Version not found')
    }

    // Get current prompt for next version number
    const currentPrompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    })

    if (!currentPrompt) {
      throw new Error('Prompt not found')
    }

    const nextVersion = currentPrompt.versions[0].version + 1

    // Update prompt with reverted data and create new version
    const updatedPrompt = await prisma.prompt.update({
      where: { id },
      data: {
        name: targetVersion.name,
        description: targetVersion.description,
        category: targetVersion.category,
        model: targetVersion.model,
        content: targetVersion.content,
        updatedAt: new Date(),
        versions: {
          create: {
            version: nextVersion,
            name: targetVersion.name,
            description: targetVersion.description,
            category: targetVersion.category,
            model: targetVersion.model,
            content: targetVersion.content,
          }
        }
      },
      include: {
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    })

    return updatedPrompt
  }

  async markAsPublished(id: string, githubPath: string): Promise<Prompt> {
    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        githubPath
      }
    })

    return prompt
  }

  async markAsUnpublished(id: string): Promise<Prompt> {
    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        isPublished: false,
        publishedAt: null,
        githubPath: null
      }
    })

    return prompt
  }

  async getAllPublishedPrompts(): Promise<Prompt[]> {
    const prompts = await prisma.prompt.findMany({
      where: { isPublished: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return prompts
  }

  async getUniqueCategories(): Promise<string[]> {
    const results = await prisma.prompt.findMany({
      select: { category: true },
      distinct: ['category']
    })

    return results.map(r => r.category).sort()
  }

  async getStats(): Promise<{ total: number; published: number; recentCount: number }> {
    const [total, published, recentCount] = await Promise.all([
      prisma.prompt.count(),
      prisma.prompt.count({ where: { isPublished: true } }),
      prisma.prompt.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ])

    return { total, published, recentCount }
  }
}

export const promptService = new PromptService()

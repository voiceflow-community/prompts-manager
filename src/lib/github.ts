import { Octokit } from "octokit"
import matter from "gray-matter"
import { Prompt } from '@prisma/client'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const owner = process.env.GITHUB_OWNER!
const repo = process.env.GITHUB_REPO!

export class GitHubPublishService {
  async publishPrompt(prompt: Prompt): Promise<string> {
    const promptId = this.generatePromptId(prompt.name)
    const path = `prompts/${promptId}`

    // Create prompts.md file with metadata
    const frontMatter = {
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      model: prompt.model || null,
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString(),
    }

    const promptsContent = matter.stringify(prompt.content, frontMatter)

    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `${path}/prompt.md`,
        message: `Publish prompt: ${prompt.name}`,
        content: Buffer.from(promptsContent).toString('base64'),
      })

      return `${path}/prompt.md`
    } catch (error) {
      console.error('Error publishing prompt:', error)
      throw new Error('Failed to publish prompt to GitHub')
    }
  }

  async updatePublishedPrompt(prompt: Prompt, githubPath: string): Promise<void> {
    try {
      // Get current file to get SHA
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: githubPath,
      })

      if (Array.isArray(fileData) || fileData.type !== 'file') {
        throw new Error('Invalid file type')
      }

      // Create updated content
      const frontMatter = {
        name: prompt.name,
        description: prompt.description,
        category: prompt.category,
        model: prompt.model || null,
        createdAt: prompt.createdAt.toISOString(),
        updatedAt: prompt.updatedAt.toISOString(),
      }

      const promptsContent = matter.stringify(prompt.content, frontMatter)

      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: githubPath,
        message: `Update prompt: ${prompt.name}`,
        content: Buffer.from(promptsContent).toString('base64'),
        sha: fileData.sha,
      })
    } catch (error) {
      console.error('Error updating published prompt:', error)
      throw new Error('Failed to update prompt in GitHub')
    }
  }

  async deletePublishedPrompt(githubPath: string): Promise<void> {
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: githubPath,
      })

      if (Array.isArray(fileData) || fileData.type !== 'file') {
        throw new Error('File not found')
      }

      await octokit.rest.repos.deleteFile({
        owner,
        repo,
        path: githubPath,
        message: `Remove prompt from repository`,
        sha: fileData.sha,
      })
    } catch (error) {
      console.error('Error deleting published prompt:', error)
      throw new Error('Failed to delete prompt from GitHub')
    }
  }

  async updateReadme(prompts: Prompt[]): Promise<void> {
    try {
      // Generate README content
      const readmeContent = this.generateReadmeContent(prompts)

      // Try to get existing README to get SHA for update
      let sha: string | undefined
      try {
        const { data: existingFile } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: 'README.md',
        })

        if (!Array.isArray(existingFile) && existingFile.type === 'file') {
          sha = existingFile.sha
        }
      } catch {
        // README doesn't exist, we'll create it
        console.log('README.md not found, creating new one')
      }

      // Create or update README
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: 'README.md',
        message: 'Update README with prompt listings',
        content: Buffer.from(readmeContent).toString('base64'),
        sha,
      })
    } catch (error) {
      console.error('Error updating README:', error)
      throw new Error('Failed to update README')
    }
  }

  private generateReadmeContent(prompts: Prompt[]): string {
    const publishedPrompts = prompts.filter(p => p.isPublished)

    let content = `# Prompts Repository

This repository contains a collection of AI prompts organized by category.

## Available Prompts

Total prompts: ${publishedPrompts.length}

`

    if (publishedPrompts.length === 0) {
      content += '*No prompts published yet.*\n'
      return content
    }

    // Group prompts by category
    const promptsByCategory = publishedPrompts.reduce((acc, prompt) => {
      if (!acc[prompt.category]) {
        acc[prompt.category] = []
      }
      acc[prompt.category].push(prompt)
      return acc
    }, {} as Record<string, Prompt[]>)

    // Generate content for each category
    Object.keys(promptsByCategory).sort().forEach(category => {
      content += `### ${category}\n\n`

      promptsByCategory[category].forEach(prompt => {
        const promptPath = this.generatePromptId(prompt.name)
        content += `#### [${prompt.name}](./prompts/${promptPath}/prompt.md)\n\n`
        content += `${prompt.description}\n\n`
        content += `- **Model**: ${prompt.model || 'Not specified'}\n`
        content += `- **Updated**: ${new Date(prompt.updatedAt).toLocaleDateString()}\n\n`
      })
    })

    content += `\n---\n\n*This README is automatically generated when prompts are published.*\n`

    return content
  }

  private generatePromptId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

export const githubPublishService = new GitHubPublishService()

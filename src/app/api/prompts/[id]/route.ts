import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWithAuth } from "@/lib/auth"
import { promptService } from "@/lib/prompt-service"
import { githubPublishService } from "@/lib/github"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const prompt = await promptService.getPrompt(id)

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 })
    }

    return NextResponse.json(prompt)
  } catch (error) {
    console.error("Error fetching prompt:", error)
    return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, model, content } = body

    const { id } = await params
    const prompt = await promptService.updatePrompt(id, {
      name,
      description,
      category,
      model,
      content
    })
    return NextResponse.json(prompt)
  } catch (error) {
    console.error("Error updating prompt:", error)
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the prompt to check if it's published before deletion
    const prompt = await promptService.getPrompt(id)

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 })
    }

    // If prompt is published to GitHub, unpublish it first
    if (prompt.isPublished && prompt.githubPath) {
      try {
        // Delete from GitHub
        await githubPublishService.deletePublishedPrompt(prompt.githubPath)

        // Update README with remaining published prompts
        try {
          const allPublishedPrompts = await promptService.getAllPublishedPrompts()
          // Filter out the current prompt since we're deleting it
          const remainingPrompts = allPublishedPrompts.filter(p => p.id !== id)
          await githubPublishService.updateReadme(remainingPrompts)
        } catch (readmeError) {
          console.error('Error updating README after unpublish:', readmeError)
          // Don't fail the deletion if README update fails
        }
      } catch (githubError) {
        console.error('Error unpublishing from GitHub:', githubError)
        // Continue with deletion even if GitHub unpublish fails
        // This prevents orphaned database entries if GitHub is unavailable
      }
    }

    // Delete from database (this will also delete related versions due to CASCADE)
    await promptService.deletePrompt(id)

    return NextResponse.json({
      message: "Prompt deleted successfully",
      unpublishedFromGithub: prompt.isPublished
    })
  } catch (error) {
    console.error("Error deleting prompt:", error)
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 })
  }
}

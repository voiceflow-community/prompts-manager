import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWithAuth } from "@/lib/auth"
import { promptService } from "@/lib/prompt-service"
import { githubPublishService } from "@/lib/github"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the prompt from database
    const prompt = await promptService.getPrompt(id)

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 })
    }

    // Publish to GitHub
    const githubPath = await githubPublishService.publishPrompt(prompt)

    // Update prompt as published
    const updatedPrompt = await promptService.markAsPublished(id, githubPath)

    // Update README with all published prompts
    try {
      const allPublishedPrompts = await promptService.getAllPublishedPrompts()
      await githubPublishService.updateReadme(allPublishedPrompts)
    } catch (readmeError) {
      console.error('Error updating README:', readmeError)
      // Don't fail the whole operation if README update fails
    }

    return NextResponse.json({
      message: "Prompt published successfully",
      prompt: updatedPrompt,
      githubPath
    })
  } catch (error) {
    console.error("Error publishing prompt:", error)
    return NextResponse.json({ error: "Failed to publish prompt" }, { status: 500 })
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

    const { id } = await params

    // Get the prompt from database
    const prompt = await promptService.getPrompt(id)

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 })
    }

    if (!prompt.isPublished || !prompt.githubPath) {
      return NextResponse.json({ error: "Prompt is not published" }, { status: 400 })
    }

    // Update in GitHub
    await githubPublishService.updatePublishedPrompt(prompt, prompt.githubPath)

    // Update README with all published prompts
    try {
      const allPublishedPrompts = await promptService.getAllPublishedPrompts()
      await githubPublishService.updateReadme(allPublishedPrompts)
    } catch (readmeError) {
      console.error('Error updating README:', readmeError)
      // Don't fail the whole operation if README update fails
    }

    return NextResponse.json({
      message: "Published prompt updated successfully"
    })
  } catch (error) {
    console.error("Error updating published prompt:", error)
    return NextResponse.json({ error: "Failed to update published prompt" }, { status: 500 })
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

    // Get the prompt from database
    const prompt = await promptService.getPrompt(id)

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 })
    }

    if (!prompt.isPublished || !prompt.githubPath) {
      return NextResponse.json({ error: "Prompt is not published" }, { status: 400 })
    }

    // Delete from GitHub
    await githubPublishService.deletePublishedPrompt(prompt.githubPath)

    // Mark as unpublished in database
    const updatedPrompt = await promptService.markAsUnpublished(id)

    // Update README with remaining published prompts
    try {
      const allPublishedPrompts = await promptService.getAllPublishedPrompts()
      await githubPublishService.updateReadme(allPublishedPrompts)
    } catch (readmeError) {
      console.error('Error updating README:', readmeError)
      // Don't fail the whole operation if README update fails
    }

    return NextResponse.json({
      message: "Prompt unpublished successfully",
      prompt: updatedPrompt
    })
  } catch (error) {
    console.error("Error unpublishing prompt:", error)
    return NextResponse.json({ error: "Failed to unpublish prompt" }, { status: 500 })
  }
}

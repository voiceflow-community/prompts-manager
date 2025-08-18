import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWithAuth } from "@/lib/auth"
import { promptService } from "@/lib/prompt-service"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || undefined
    const model = searchParams.get('model') || undefined

    // If no search parameters, return all prompts
    if (!query && !category && !model) {
      const prompts = await promptService.getAllPrompts()
      return NextResponse.json(prompts)
    }

    // Otherwise, perform search
    const prompts = await promptService.searchPrompts(query, {
      category,
      model
    })
    return NextResponse.json(prompts)
  } catch (error) {
    console.error("Error fetching prompts:", error)
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, model, content } = body

    if (!name || !description || !category || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const prompt = await promptService.createPrompt({
      name,
      description,
      category,
      model,
      content
    })
    return NextResponse.json(prompt, { status: 201 })
  } catch (error) {
    console.error("Error creating prompt:", error)
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWithAuth } from "@/lib/auth"
import { promptService } from "@/lib/prompt-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { versionId } = body

    if (!versionId) {
      return NextResponse.json({ error: "Missing version ID parameter" }, { status: 400 })
    }

    const { id } = await params
    const prompt = await promptService.revertToVersion(id, versionId)
    return NextResponse.json(prompt)
  } catch (error) {
    console.error("Error reverting prompt:", error)
    return NextResponse.json({ error: "Failed to revert prompt" }, { status: 500 })
  }
}

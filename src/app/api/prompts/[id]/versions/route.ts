import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWithAuth } from "@/lib/auth"
import { promptService } from "@/lib/prompt-service"

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
    const versions = await promptService.getPromptVersions(id)
    return NextResponse.json(versions)
  } catch (error) {
    console.error("Error fetching prompt versions:", error)
    return NextResponse.json({ error: "Failed to fetch prompt versions" }, { status: 500 })
  }
}

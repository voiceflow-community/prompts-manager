import { NextResponse } from "next/server"
import { getServerSessionWithAuth } from "@/lib/auth"
import { promptService } from "@/lib/prompt-service"

export async function GET() {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await promptService.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

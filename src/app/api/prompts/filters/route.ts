import { NextResponse } from "next/server"
import { getServerSessionWithAuth } from "@/lib/auth"
import { promptService } from "@/lib/prompt-service"

export async function GET() {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const filterOptions = await promptService.getFilterOptions()
    return NextResponse.json(filterOptions)
  } catch (error) {
    console.error("Error fetching filter options:", error)
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 })
  }
}

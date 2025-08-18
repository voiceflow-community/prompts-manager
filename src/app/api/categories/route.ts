import { NextResponse } from "next/server"
import { getServerSessionWithAuth } from "@/lib/auth"
import { promptService } from "@/lib/prompt-service"

export async function GET() {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await promptService.getUniqueCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

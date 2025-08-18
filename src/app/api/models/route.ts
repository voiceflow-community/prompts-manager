import { NextResponse } from "next/server"
import { getServerSessionWithAuth } from "@/lib/auth"
import { modelsService } from "@/lib/models"

export async function GET() {
  try {
    const session = await getServerSessionWithAuth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const models = await modelsService.getModelOptions()
    return NextResponse.json(models)
  } catch (error) {
    console.error("Error fetching models:", error)
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
  }
}

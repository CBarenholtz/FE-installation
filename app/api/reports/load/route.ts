import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Load route called")

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("[v0] Loading report from URL:", url)

    // Fetch the report data from Vercel Blob
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`)
    }

    const reportData = await response.json()

    console.log("[v0] Report loaded successfully")

    return NextResponse.json({
      success: true,
      reportData,
    })
  } catch (error) {
    console.error("[v0] Error loading report:", error)
    return NextResponse.json(
      { error: "Failed to load report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

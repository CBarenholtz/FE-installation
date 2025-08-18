import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] Save route called - testing basic functionality")

  try {
    const body = await request.json()
    console.log("[v0] Request body received:", !!body)

    // Simple test response
    return NextResponse.json({
      success: true,
      message: "Save route is working - this is a test response",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error in save route:", error)
    return NextResponse.json(
      { error: "Save route error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

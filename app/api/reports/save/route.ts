import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] Save route called - minimal test version")

  try {
    const testData = {
      id: crypto.randomUUID(),
      title: "test-report",
      data: { test: "minimal data" },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Attempting to save test data:", testData.id)

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify(testData),
    })

    console.log("[v0] Supabase response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Supabase error details:", errorText)
      return NextResponse.json(
        {
          error: "Database insertion failed",
          status: response.status,
          details: errorText,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Test save successful!")

    return NextResponse.json({
      success: true,
      message: "Test save completed successfully",
      id: testData.id,
    })
  } catch (error) {
    console.error("[v0] Save route error:", error)
    return NextResponse.json(
      { error: "Route execution failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] Save route called - using Supabase cloud storage")

  try {
    const body = await request.json()
    console.log("[v0] Request body received:", !!body)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Missing Supabase environment variables")
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    // Generate unique ID and timestamp
    const reportId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    // Prepare report data for database
    const reportData = {
      id: reportId,
      data: body,
      created_at: timestamp,
      updated_at: timestamp,
    }

    console.log("[v0] Saving report to Supabase:", reportId)

    // Save to Supabase
    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(reportData),
    })

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text()
      console.error("[v0] Supabase save error:", saveResponse.status, errorText)
      return NextResponse.json({ error: "Failed to save to Supabase", details: errorText }, { status: 500 })
    }

    console.log("[v0] Report saved successfully to Supabase")

    return NextResponse.json({
      success: true,
      message: "Report saved to Supabase cloud storage successfully",
      reportId,
      timestamp,
    })
  } catch (error) {
    console.error("[v0] Error in save route:", error)
    return NextResponse.json(
      { error: "Save route error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

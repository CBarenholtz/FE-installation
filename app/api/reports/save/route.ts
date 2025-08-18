import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called - using Supabase cloud storage")

    const body = await request.json()
    console.log("[v0] Request body received:", !!body)

    // Generate report metadata using same pattern as list route
    const reportId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const propertyName = body.customerInfo?.propertyName || "Unknown Property"
    const title = `${propertyName.replace(/\s+/g, "-")}_${Date.now()}`

    // Prepare report data using same structure as list route expects
    const reportData = {
      id: reportId,
      title: title,
      data: body,
      created_at: timestamp,
      updated_at: timestamp,
    }

    console.log("[v0] Saving report to Supabase:", reportId)

    // Use exact same fetch pattern as working list route
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify(reportData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Supabase save error:", response.status, errorText)
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

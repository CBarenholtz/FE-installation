import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] Save route called - using Supabase cloud storage")

  try {
    const body = await request.json()
    console.log("[v0] Received save request for:", body.title || "untitled report")

    const reportData = {
      id: crypto.randomUUID(),
      title: body.title || `Report ${new Date().toLocaleDateString()}`,
      data: body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Attempting to save report:", reportData.id)

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_ANON_KEY!,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(reportData),
    })

    console.log("[v0] Supabase response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Supabase error:", errorText)
      return NextResponse.json({ error: "Failed to save report", details: errorText }, { status: 500 })
    }

    console.log("[v0] Report saved successfully to Supabase cloud storage")
    return NextResponse.json({ success: true, message: "Report saved successfully", id: reportData.id })
  } catch (error) {
    console.error("[v0] Save route error:", error)
    return NextResponse.json({ error: "Save operation failed" }, { status: 500 })
  }
}

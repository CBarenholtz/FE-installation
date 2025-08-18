import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Load route called via GET")

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    console.log("[v0] Loading report with ID:", id)

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/reports?select=data&id=eq.${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_ANON_KEY!,
      },
    })

    if (!response.ok) {
      console.error("[v0] Supabase query error:", await response.text())
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const reports = await response.json()
    if (!reports || reports.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const report = reports[0]

    console.log("[v0] Report loaded successfully from Supabase cloud storage")

    return NextResponse.json({
      success: true,
      reportData: report.data,
    })
  } catch (error) {
    console.error("[v0] Error loading report:", error)
    return NextResponse.json(
      { error: "Failed to load report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

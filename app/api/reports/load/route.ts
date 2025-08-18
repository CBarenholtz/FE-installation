import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Load route called via GET")

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    console.log("[v0] Loading report with ID:", id)

    const { data: report, error } = await supabaseServer.from("reports").select("data").eq("id", id).single()

    if (error || !report) {
      console.error("[v0] Supabase query error:", error)
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

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

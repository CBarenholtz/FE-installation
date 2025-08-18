import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called - using Supabase cloud storage")

    const { reportData } = await request.json()

    if (!reportData || !reportData.customerInfo) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    const propertyName = reportData.customerInfo.propertyName || "Unknown-Property"
    const sanitizedPropertyName = propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")
    const title = `${sanitizedPropertyName}_${new Date().toISOString()}`

    console.log("[v0] Saving report to Supabase:", title)

    const { data, error } = await supabaseServer
      .from("reports")
      .insert({
        title,
        data: reportData,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase insert error:", error)
      return NextResponse.json({ error: "Failed to save report to database" }, { status: 500 })
    }

    const { data: allReports, error: listError } = await supabaseServer
      .from("reports")
      .select("id, created_at")
      .order("created_at", { ascending: false })

    if (!listError && allReports && allReports.length > 15) {
      const reportsToDelete = allReports.slice(15)
      const idsToDelete = reportsToDelete.map((report) => report.id)

      const { error: deleteError } = await supabaseServer.from("reports").delete().in("id", idsToDelete)

      if (deleteError) {
        console.warn("[v0] Cleanup failed:", deleteError)
      } else {
        console.log(`[v0] Deleted ${idsToDelete.length} old reports`)
      }
    }

    console.log("[v0] Report saved successfully to Supabase cloud storage")

    return NextResponse.json({
      success: true,
      id: data.id,
      title: data.title,
      propertyName: sanitizedPropertyName,
      timestamp: data.created_at,
      message: "Report saved successfully to cloud storage",
    })
  } catch (error) {
    console.error("[v0] Error saving report:", error)
    return NextResponse.json(
      { error: "Failed to save report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

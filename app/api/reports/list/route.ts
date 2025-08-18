import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] List route called - using Supabase cloud storage")

    const { data: reports, error } = await supabaseServer
      .from("reports")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(15)

    if (error) {
      console.error("[v0] Supabase query error:", error)
      return NextResponse.json({
        success: true,
        reports: [],
        message: "No reports found",
      })
    }

    const formattedReports = reports.map((report) => {
      const parts = report.title.split("_")
      const propertyName = parts[0].replace(/-/g, " ")
      const timestamp = report.created_at

      return {
        id: report.id,
        filename: report.title,
        propertyName,
        timestamp,
        displayName: `${propertyName} (${new Date(timestamp).toLocaleDateString()})`,
        url: `/api/reports/load?id=${report.id}`,
      }
    })

    console.log(`[v0] Found ${formattedReports.length} reports in Supabase cloud storage`)

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      message: `Found ${formattedReports.length} reports`,
    })
  } catch (error) {
    console.error("[v0] Error listing reports:", error)
    return NextResponse.json({
      success: true,
      reports: [],
      message: "No reports found",
    })
  }
}

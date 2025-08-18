import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] List route called - using Supabase cloud storage")

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/reports?select=id,title,created_at&order=created_at.desc&limit=15`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: process.env.SUPABASE_ANON_KEY!,
        },
      },
    )

    if (!response.ok) {
      console.error("[v0] Supabase query error:", await response.text())
      return NextResponse.json({
        success: true,
        reports: [],
        message: "No reports found",
      })
    }

    const reports = await response.json()

    const formattedReports = reports.map((report: any) => {
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

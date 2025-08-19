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

export async function POST(request: Request) {
  try {
    console.log("[v0] Save route called via list route - using Supabase cloud storage")

    const body = await request.json()
    console.log("[v0] Received save request with data")

    const reportId = globalThis.crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const propertyName = body.customerInfo?.propertyName || "Unknown Property"
    const title = `${propertyName.replace(/\s+/g, "-")}_${Date.now()}`

    // Save to Supabase
    const saveResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: reportId,
        title: title,
        data: body,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    })

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text()
      console.error("[v0] Supabase save error:", errorText)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to save report to cloud storage",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Successfully saved report to Supabase cloud storage")

    return NextResponse.json({
      success: true,
      message: "Report saved to cloud storage successfully!",
      reportId: reportId,
    })
  } catch (error) {
    console.error("[v0] Error saving report:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save report",
      },
      { status: 500 },
    )
  }
}

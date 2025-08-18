import { type NextRequest, NextResponse } from "next/server"

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

    const insertResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_ANON_KEY!,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        title,
        data: reportData,
      }),
    })

    if (!insertResponse.ok) {
      const error = await insertResponse.text()
      console.error("[v0] Supabase insert error:", error)
      return NextResponse.json({ error: "Failed to save report to database" }, { status: 500 })
    }

    const [insertedReport] = await insertResponse.json()

    const listResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/reports?select=id,created_at&order=created_at.desc`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: process.env.SUPABASE_ANON_KEY!,
        },
      },
    )

    if (listResponse.ok) {
      const allReports = await listResponse.json()
      if (allReports && allReports.length > 15) {
        const reportsToDelete = allReports.slice(15)
        const idsToDelete = reportsToDelete.map((report: any) => report.id)

        const deleteResponse = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/reports?id=in.(${idsToDelete.join(",")})`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              apikey: process.env.SUPABASE_ANON_KEY!,
            },
          },
        )

        if (!deleteResponse.ok) {
          console.warn("[v0] Cleanup failed")
        } else {
          console.log(`[v0] Deleted ${idsToDelete.length} old reports`)
        }
      }
    }

    console.log("[v0] Report saved successfully to Supabase cloud storage")

    return NextResponse.json({
      success: true,
      id: insertedReport.id,
      title: insertedReport.title,
      propertyName: sanitizedPropertyName,
      timestamp: insertedReport.created_at,
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

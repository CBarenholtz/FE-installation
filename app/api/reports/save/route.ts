import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called - using Supabase cloud storage")
    console.log("[v0] Environment variables check:", {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    })

    const { reportData } = await request.json()
    console.log("[v0] Received report data:", !!reportData)

    if (!reportData || !reportData.customerInfo) {
      console.log("[v0] Invalid report data received")
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    const propertyName = reportData.customerInfo.propertyName || "Unknown-Property"
    const sanitizedPropertyName = propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")
    const title = `${sanitizedPropertyName}_${new Date().toISOString()}`

    console.log("[v0] Saving report to Supabase:", title)

    const supabaseUrl = `${process.env.SUPABASE_URL}/rest/v1/reports`
    console.log("[v0] Supabase URL:", supabaseUrl)

    const insertResponse = await fetch(supabaseUrl, {
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

    console.log("[v0] Insert response status:", insertResponse.status)

    if (!insertResponse.ok) {
      const error = await insertResponse.text()
      console.error("[v0] Supabase insert error:", error)
      console.error("[v0] Response status:", insertResponse.status)
      console.error("[v0] Response headers:", Object.fromEntries(insertResponse.headers.entries()))
      return NextResponse.json({ error: "Failed to save report to database", details: error }, { status: 500 })
    }

    const insertResult = await insertResponse.json()
    console.log("[v0] Insert result:", insertResult)
    const insertedReport = Array.isArray(insertResult) ? insertResult[0] : insertResult

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
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: "Failed to save report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

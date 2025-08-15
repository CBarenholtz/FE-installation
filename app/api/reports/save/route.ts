import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called")

    const { reportData } = await request.json()

    if (!reportData || !reportData.customerInfo) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    // Create filename with ISO timestamp + property name
    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo.propertyName || "Unknown-Property"
    const sanitizedPropertyName = propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")
    const filename = `${timestamp}_${sanitizedPropertyName}.json`

    console.log("[v0] Saving report with filename:", filename)

    // Add timestamp to report data
    const reportWithTimestamp = {
      ...reportData,
      timestamp,
      savedAt: new Date().toISOString(),
    }

    const blob = await put(filename, JSON.stringify(reportWithTimestamp, null, 2), {
      access: "public",
      contentType: "application/json",
    })

    console.log("[v0] Report saved successfully:", blob.url)

    return NextResponse.json({
      success: true,
      filename,
      url: blob.url,
      propertyName: sanitizedPropertyName,
      timestamp,
    })
  } catch (error) {
    console.error("[v0] Error saving report:", error)
    return NextResponse.json(
      { error: "Failed to save report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

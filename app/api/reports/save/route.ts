import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called")

    const { reportData } = await request.json()

    if (!reportData || !reportData.customerInfo) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN not available")
      return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 })
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

    // Use direct REST API call to Vercel Blob
    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportWithTimestamp, null, 2),
    })

    if (!response.ok) {
      throw new Error(`Blob API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log("[v0] Report saved successfully:", result.url)

    return NextResponse.json({
      success: true,
      filename,
      url: result.url,
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

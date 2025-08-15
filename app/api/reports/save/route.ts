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

    const response = await fetch(
      `https://${process.env.BLOB_READ_WRITE_TOKEN?.split("_")[1]}.blob.vercel-storage.com/${filename}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportWithTimestamp, null, 2),
      },
    )

    if (!response.ok) {
      throw new Error(`Blob API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log("[v0] Report saved successfully:", result)

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

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called")

    const { reportData } = await request.json()

    if (!reportData || !reportData.customerInfo) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo.propertyName || "Unknown-Property"
    const sanitizedPropertyName = propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")
    const filename = `${timestamp}_${sanitizedPropertyName}.json`

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN not found")
    }

    // Direct PUT request to Vercel Blob API
    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportData),
    })

    if (!response.ok) {
      throw new Error(`Blob API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const blobUrl = result.url || `https://blob.vercel-storage.com/${filename}`

    console.log("[v0] Report saved to Blob storage:", blobUrl)

    return NextResponse.json({
      success: true,
      filename,
      propertyName: sanitizedPropertyName,
      timestamp,
      url: blobUrl,
      message: "Report saved to cloud storage",
    })
  } catch (error) {
    console.error("[v0] Error saving report to Blob:", error)
    return NextResponse.json(
      { error: "Failed to save report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

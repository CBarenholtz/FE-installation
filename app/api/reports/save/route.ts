import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting report save process")
    const reportData = await request.json()
    console.log("[v0] Report data received, size:", JSON.stringify(reportData).length)

    // Extract property name for filename
    const propertyName = reportData.customerInfo?.propertyName || "Unknown-Property"
    console.log("[v0] Property name:", propertyName)

    // Create ISO timestamp
    const timestamp = new Date().toISOString()

    // Create filename: ISO timestamp + property name
    const filename = `${timestamp}_${propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")}.json`
    console.log("[v0] Generated filename:", filename)

    // Convert report data to JSON string
    const jsonContent = JSON.stringify(reportData, null, 2)

    const response = await fetch("https://blob.vercel-storage.com", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        "Content-Type": "application/json",
        "x-content-type": "application/json",
        "x-add-random-suffix": "0",
      },
      body: JSON.stringify({
        pathname: filename,
        body: jsonContent,
        access: "public",
      }),
    })

    console.log("[v0] Blob API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Blob API error:", errorText)
      throw new Error(`Blob upload failed: ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] Blob upload successful:", result)

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: filename,
      propertyName: propertyName,
      timestamp: timestamp,
    })
  } catch (error) {
    console.error("[v0] Report save error:", error)
    return NextResponse.json(
      {
        error: "Failed to save report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

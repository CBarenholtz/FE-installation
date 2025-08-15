import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const reportData = await request.json()

    // Extract property name for filename
    const propertyName = reportData.customerInfo?.propertyName || "Unknown-Property"

    // Create ISO timestamp
    const timestamp = new Date().toISOString()

    // Create filename: ISO timestamp + property name
    const filename = `${timestamp}_${propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")}.json`

    // Convert report data to JSON string
    const jsonContent = JSON.stringify(reportData, null, 2)

    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: jsonContent,
    })

    if (!response.ok) {
      throw new Error(`Blob upload failed: ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: filename,
      propertyName: propertyName,
      timestamp: timestamp,
    })
  } catch (error) {
    console.error("Report save error:", error)
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }
}

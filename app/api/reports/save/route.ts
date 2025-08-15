import { put } from "@vercel/blob"
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

    const blob = await put(filename, jsonContent, {
      access: "public",
      contentType: "application/json",
    })

    console.log("[v0] Blob upload successful:", blob.url)

    return NextResponse.json({
      success: true,
      url: blob.url,
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

import { put } from "@vercel/blob"
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
    const jsonBlob = new Blob([jsonContent], { type: "application/json" })

    // Upload to Vercel Blob
    const blob = await put(filename, jsonBlob, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
      propertyName: propertyName,
      timestamp: timestamp,
    })
  } catch (error) {
    console.error("Report save error:", error)
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }
}

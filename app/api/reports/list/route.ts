import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export async function GET() {
  try {
    console.log("[v0] List route called")

    const { blobs } = await list()

    // Filter for JSON files and sort by pathname (which includes timestamp)
    const reportBlobs = blobs
      .filter((blob) => blob.pathname?.endsWith(".json"))
      .sort((a, b) => b.pathname.localeCompare(a.pathname))
      .slice(0, 15) // Get most recent 15 reports

    const reports = reportBlobs.map((blob) => {
      const filename = blob.pathname
      const parts = filename.replace(".json", "").split("_")
      const timestamp = parts[0]
      const propertyName = parts.slice(1).join("_").replace(/-/g, " ")

      return {
        filename,
        propertyName,
        timestamp,
        uploadDate: blob.uploadedAt,
        url: blob.url,
        displayName: `${propertyName} (${new Date(timestamp.replace(/-/g, ":")).toLocaleDateString()})`,
      }
    })

    console.log(`[v0] Found ${reports.length} reports in Blob storage`)

    return NextResponse.json({
      success: true,
      reports,
      message: `Found ${reports.length} reports`,
    })
  } catch (error) {
    console.error("[v0] Error listing reports:", error)
    return NextResponse.json(
      { error: "Failed to list reports", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export async function GET() {
  try {
    console.log("[v0] List route called")

    // Use Vercel Blob SDK to list files
    const { blobs } = await list()

    // Filter for JSON report files and sort by creation date (newest first)
    const reportFiles = blobs
      .filter((blob) => blob.pathname.endsWith(".json"))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 15) // Limit to 15 most recent

    // Parse filenames to extract property names and timestamps
    const reports = reportFiles.map((blob) => {
      const filename = blob.pathname
      const parts = filename.replace(".json", "").split("_")

      if (parts.length >= 2) {
        const timestamp = parts[0]
        const propertyName = parts.slice(1).join("_").replace(/-/g, " ")

        return {
          filename,
          url: blob.url,
          timestamp,
          propertyName,
          displayName: `${propertyName} - ${new Date(timestamp).toLocaleDateString()}`,
          uploadedAt: blob.uploadedAt,
        }
      }

      // Fallback for files that don't match expected format
      return {
        filename,
        url: blob.url,
        timestamp: blob.uploadedAt,
        propertyName: "Unknown Property",
        displayName: `Report - ${new Date(blob.uploadedAt).toLocaleDateString()}`,
        uploadedAt: blob.uploadedAt,
      }
    })

    console.log("[v0] Found reports:", reports.length)

    return NextResponse.json({
      success: true,
      reports,
    })
  } catch (error) {
    console.error("[v0] Error listing reports:", error)
    return NextResponse.json(
      { error: "Failed to list reports", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export async function GET() {
  try {
    console.log("[v0] List route called")

    const { blobs } = await list()

    const jsonBlobs = blobs.filter((blob) => blob.pathname.endsWith(".json"))

    const reports = jsonBlobs.map((blob) => {
      const filename = blob.pathname
      const [timestamp, ...propertyParts] = filename.replace(".json", "").split("_")
      const propertyName = propertyParts.join("_").replace(/-/g, " ")

      return {
        filename,
        propertyName,
        timestamp,
        uploadedAt: blob.uploadedAt,
        url: blob.url,
      }
    })

    const sortedReports = reports
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 15) // Get 15 most recent reports

    console.log("[v0] Found", sortedReports.length, "reports in Blob storage")

    return NextResponse.json({
      success: true,
      reports: sortedReports,
      message: `Found ${sortedReports.length} reports in cloud storage`,
    })
  } catch (error) {
    console.error("[v0] Error listing reports:", error)
    return NextResponse.json(
      { error: "Failed to list reports", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

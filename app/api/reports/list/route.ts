import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] List route called")

    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      console.log("[v0] Blob storage not configured, returning empty list")
      return NextResponse.json({
        success: true,
        reports: [],
        message: "Blob storage not configured",
      })
    }

    console.log("[v0] Blob storage configured, fetching reports")

    const response = await fetch("https://blob.vercel-storage.com/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Blob API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const { blobs } = await response.json()

    // Filter for JSON files and sort by pathname (which includes timestamp)
    const reportBlobs = blobs
      .filter((blob: any) => blob.pathname?.endsWith(".json"))
      .sort((a: any, b: any) => b.pathname.localeCompare(a.pathname))
      .slice(0, 15) // Get most recent 15 reports

    const reports = reportBlobs.map((blob: any) => {
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

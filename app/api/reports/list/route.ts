import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] List route called")

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN not found")
    }

    // Direct GET request to Vercel Blob API
    const response = await fetch("https://blob.vercel-storage.com/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Blob API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const blobs = data.blobs || []

    // Filter for JSON files and extract report info
    const reports = blobs
      .filter((blob: any) => blob.pathname.endsWith(".json"))
      .map((blob: any) => {
        const filename = blob.pathname.split("/").pop() || "unknown"
        const [timestamp, ...propertyParts] = filename.replace(".json", "").split("_")
        const propertyName = propertyParts.join("_").replace(/-/g, " ")

        return {
          filename,
          propertyName,
          timestamp,
          url: blob.url,
          uploadedAt: blob.uploadedAt,
        }
      })
      .sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 15) // Get 15 most recent reports

    console.log("[v0] Found", reports.length, "reports in Blob storage")

    return NextResponse.json({
      success: true,
      reports,
      message: `Found ${reports.length} reports in cloud storage`,
    })
  } catch (error) {
    console.error("[v0] Error listing reports from Blob:", error)
    return NextResponse.json(
      { error: "Failed to list reports", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

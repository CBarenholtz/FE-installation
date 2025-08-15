import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { blobs } = await list()

    // Filter for JSON report files and extract metadata
    const reportFiles = blobs
      .filter((blob) => blob.pathname.endsWith(".json"))
      .map((blob) => {
        const filename = blob.pathname.split("/").pop() || "unknown"

        // Parse filename: timestamp_propertyname.json
        const parts = filename.replace(".json", "").split("_")
        const timestamp = parts[0]
        const propertyName = parts.slice(1).join("_").replace(/-/g, " ")

        return {
          url: blob.url,
          filename: filename,
          propertyName: propertyName,
          timestamp: timestamp,
          uploadedAt: blob.uploadedAt,
          size: blob.size,
        }
      })
      // Sort by timestamp (most recent first)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      // Limit to 15 most recent
      .slice(0, 15)

    return NextResponse.json({ reports: reportFiles })
  } catch (error) {
    console.error("Error listing reports:", error)
    return NextResponse.json({ error: "Failed to list reports" }, { status: 500 })
  }
}

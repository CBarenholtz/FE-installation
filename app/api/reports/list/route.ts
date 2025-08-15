import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Starting report list process")

    const { blobs } = await list({
      prefix: "",
    })

    console.log("[v0] Found blobs:", blobs.length)

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

    console.log("[v0] Processed report files:", reportFiles.length)

    return NextResponse.json({ reports: reportFiles })
  } catch (error) {
    console.error("[v0] Error listing reports:", error)
    return NextResponse.json(
      {
        error: "Failed to list reports",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

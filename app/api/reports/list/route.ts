import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("https://blob.vercel-storage.com/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to list blobs: ${response.statusText}`)
    }

    const data = await response.json()
    const blobs = data.blobs || []

    // Filter for JSON report files and extract metadata
    const reportFiles = blobs
      .filter((blob: any) => blob.pathname.endsWith(".json"))
      .map((blob: any) => {
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
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      // Limit to 15 most recent
      .slice(0, 15)

    return NextResponse.json({ reports: reportFiles })
  } catch (error) {
    console.error("Error listing reports:", error)
    return NextResponse.json({ error: "Failed to list reports" }, { status: 500 })
  }
}

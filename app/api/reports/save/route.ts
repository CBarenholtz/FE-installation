import { type NextRequest, NextResponse } from "next/server"
import { put, list, del } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called")

    const { reportData } = await request.json()

    if (!reportData || !reportData.customerInfo) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo.propertyName || "Unknown-Property"
    const sanitizedPropertyName = propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")
    const windowsCompatibleTimestamp = timestamp.replace(/:/g, "-")
    const filename = `${windowsCompatibleTimestamp}_${sanitizedPropertyName}.json`

    const blob = await put(filename, JSON.stringify(reportData), {
      access: "public",
    })

    console.log("[v0] Report saved to Blob storage:", blob.url)

    // Clean up old reports - keep only 15 most recent
    try {
      const { blobs } = await list()
      const reportBlobs = blobs
        .filter((blob) => blob.pathname?.endsWith(".json"))
        .sort((a, b) => b.pathname.localeCompare(a.pathname))

      // Delete reports beyond the 15 most recent
      if (reportBlobs.length > 15) {
        const blobsToDelete = reportBlobs.slice(15)
        console.log(`[v0] Cleaning up ${blobsToDelete.length} old reports`)

        for (const blobToDelete of blobsToDelete) {
          await del(blobToDelete.url)
        }
      }
    } catch (cleanupError) {
      console.warn("[v0] Cleanup failed but report was saved:", cleanupError)
    }

    return NextResponse.json({
      success: true,
      filename,
      propertyName: sanitizedPropertyName,
      timestamp,
      url: blob.url,
      message: "Report saved to Blob storage",
    })
  } catch (error) {
    console.error("[v0] Error saving report:", error)
    return NextResponse.json(
      { error: "Failed to save report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

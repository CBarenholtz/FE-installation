import { type NextRequest, NextResponse } from "next/server"

let put: any, list: any, del: any
try {
  const blobModule = await import("@vercel/blob")
  put = blobModule.put
  list = blobModule.list
  del = blobModule.del
  console.log("[v0] Vercel Blob SDK imported successfully")
} catch (importError) {
  console.error("[v0] Failed to import Vercel Blob SDK:", importError)
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called")

    if (!put || !list || !del) {
      console.error("[v0] Vercel Blob SDK functions not available")
      return NextResponse.json({ error: "Blob SDK not available" }, { status: 500 })
    }

    const { reportData } = await request.json()

    if (!reportData || !reportData.customerInfo) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo.propertyName || "Unknown-Property"
    const sanitizedPropertyName = propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")
    const windowsCompatibleTimestamp = timestamp.replace(/:/g, "-")
    const filename = `reports/${windowsCompatibleTimestamp}_${sanitizedPropertyName}.json`

    console.log("[v0] Attempting to save to Blob storage:", filename)

    const blob = await put(filename, JSON.stringify(reportData, null, 2), {
      access: "public",
    })

    console.log("[v0] Report saved to Blob storage:", blob.url)

    try {
      const { blobs } = await list({ prefix: "reports/" })
      const reportBlobs = blobs
        .filter((b) => b.pathname.endsWith(".json"))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

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
      filename: filename.split("/").pop(),
      propertyName: sanitizedPropertyName,
      timestamp,
      url: blob.url,
      message: "Report saved to cloud storage",
    })
  } catch (error) {
    console.error("[v0] Error saving report:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: "Failed to save report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

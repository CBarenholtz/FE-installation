import { type NextRequest, NextResponse } from "next/server"

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

    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      return NextResponse.json(
        {
          error: "Blob storage not configured",
          details: "BLOB_READ_WRITE_TOKEN not available",
        },
        { status: 500 },
      )
    }

    // Upload to Vercel Blob using PUT request
    const blobUrl = `https://blob.vercel-storage.com/${filename}`
    const response = await fetch(blobUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Blob API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] Report saved to Blob storage:", result.url)

    // Clean up old reports - keep only 15 most recent
    try {
      const listResponse = await fetch("https://blob.vercel-storage.com/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (listResponse.ok) {
        const { blobs } = await listResponse.json()
        const reportBlobs = blobs
          .filter((blob: any) => blob.pathname?.endsWith(".json"))
          .sort((a: any, b: any) => b.pathname.localeCompare(a.pathname))

        // Delete reports beyond the 15 most recent
        if (reportBlobs.length > 15) {
          const blobsToDelete = reportBlobs.slice(15)
          console.log(`[v0] Cleaning up ${blobsToDelete.length} old reports`)

          for (const blob of blobsToDelete) {
            await fetch(`https://blob.vercel-storage.com/${blob.pathname}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          }
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
      url: result.url,
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

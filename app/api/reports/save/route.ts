import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called")

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.error("[v0] Blob storage not configured")
      return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 })
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

    const uploadResponse = await fetch("https://blob.vercel-storage.com/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pathname: filename,
        body: JSON.stringify(reportData, null, 2),
        access: "public",
      }),
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("[v0] Upload failed:", uploadResponse.status, errorText)
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
    }

    const uploadResult = await uploadResponse.json()
    console.log("[v0] Report saved to Blob storage:", uploadResult.url)

    try {
      const listResponse = await fetch("https://blob.vercel-storage.com/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (listResponse.ok) {
        const { blobs } = await listResponse.json()
        const reportBlobs = blobs
          .filter((blob: any) => blob.pathname.startsWith("reports/") && blob.pathname.endsWith(".json"))
          .sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

        if (reportBlobs.length > 15) {
          const blobsToDelete = reportBlobs.slice(15)
          console.log(`[v0] Cleaning up ${blobsToDelete.length} old reports`)

          for (const blobToDelete of blobsToDelete) {
            await fetch("https://blob.vercel-storage.com/", {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                urls: [blobToDelete.url],
              }),
            })
          }
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
      url: uploadResult.url,
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

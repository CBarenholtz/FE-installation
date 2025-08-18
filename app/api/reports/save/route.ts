import { type NextRequest, NextResponse } from "next/server"
import { writeFile, readdir, unlink, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called - using reliable file system approach")

    const { reportData } = await request.json()

    if (!reportData || !reportData.customerInfo) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    const reportsDir = join(process.cwd(), "data", "reports")

    try {
      await mkdir(reportsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }

    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo.propertyName || "Unknown-Property"
    const sanitizedPropertyName = propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")
    const windowsCompatibleTimestamp = timestamp.replace(/:/g, "-")
    const filename = `${windowsCompatibleTimestamp}_${sanitizedPropertyName}.json`
    const filePath = join(reportsDir, filename)

    console.log("[v0] Saving report to file system:", filename)

    await writeFile(filePath, JSON.stringify(reportData, null, 2), "utf8")

    try {
      const files = await readdir(reportsDir)
      const reportFiles = files
        .filter((file) => file.endsWith(".json"))
        .map((file) => ({
          name: file,
          path: join(reportsDir, file),
          timestamp: file.split("_")[0],
        }))
        .sort(
          (a, b) =>
            new Date(b.timestamp.replace(/-/g, ":")).getTime() - new Date(a.timestamp.replace(/-/g, ":")).getTime(),
        )

      if (reportFiles.length > 15) {
        const filesToDelete = reportFiles.slice(15)
        console.log(`[v0] Cleaning up ${filesToDelete.length} old reports`)

        for (const fileToDelete of filesToDelete) {
          await unlink(fileToDelete.path)
        }
      }
    } catch (cleanupError) {
      console.warn("[v0] Cleanup failed but report was saved:", cleanupError)
    }

    console.log("[v0] Report saved successfully to file system")

    return NextResponse.json({
      success: true,
      filename,
      propertyName: sanitizedPropertyName,
      timestamp,
      message: "Report saved successfully",
    })
  } catch (error) {
    console.error("[v0] Error saving report:", error)
    return NextResponse.json(
      { error: "Failed to save report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

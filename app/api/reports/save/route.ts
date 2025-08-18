import { type NextRequest, NextResponse } from "next/server"
import { writeFile, readdir, unlink, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save route called - using local file system (/tmp)")

    const { reportData } = await request.json()

    if (!reportData || !reportData.customerInfo) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo.propertyName || "Unknown-Property"
    const sanitizedPropertyName = propertyName.replace(/[^a-zA-Z0-9-_]/g, "-")
    const windowsCompatibleTimestamp = timestamp.replace(/:/g, "-")
    const filename = `${windowsCompatibleTimestamp}_${sanitizedPropertyName}.json`

    const reportsDir = join("/tmp", "reports")
    const filePath = join(reportsDir, filename)

    console.log("[v0] Saving report to local file system:", filePath)

    // Create reports directory if it doesn't exist
    try {
      await mkdir(reportsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Write the report file
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
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

      // Keep only the 15 most recent reports
      if (reportFiles.length > 15) {
        const filesToDelete = reportFiles.slice(15)
        for (const file of filesToDelete) {
          await unlink(file.path)
          console.log("[v0] Deleted old report:", file.name)
        }
      }
    } catch (cleanupError) {
      console.warn("[v0] Cleanup failed:", cleanupError)
    }

    console.log("[v0] Report saved successfully to local file system")
    console.warn("[v0] WARNING: Files in /tmp are temporary and will be lost between function calls!")

    return NextResponse.json({
      success: true,
      filename,
      propertyName: sanitizedPropertyName,
      timestamp,
      message: "Report saved successfully (temporary storage)",
    })
  } catch (error) {
    console.error("[v0] Error saving report:", error)
    return NextResponse.json(
      { error: "Failed to save report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

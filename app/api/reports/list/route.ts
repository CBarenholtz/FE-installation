import { NextResponse } from "next/server"
import { readdir } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    console.log("[v0] List route called - using local file system (/tmp)")

    const reportsDir = join("/tmp", "reports")

    try {
      const files = await readdir(reportsDir)
      const reportFiles = files
        .filter((file) => file.endsWith(".json"))
        .sort((a, b) => {
          const timestampA = a.split("_")[0]
          const timestampB = b.split("_")[0]
          return timestampB.localeCompare(timestampA)
        })
        .slice(0, 15)

      const reports = reportFiles.map((filename) => {
        const parts = filename.replace(".json", "").split("_")
        const timestamp = parts[0].replace(/-/g, ":")
        const propertyName = parts.slice(1).join("_").replace(/-/g, " ")

        return {
          filename,
          propertyName,
          timestamp,
          displayName: `${propertyName} (${new Date(timestamp).toLocaleDateString()})`,
          url: `/api/reports/load?id=${filename}`,
        }
      })

      console.log(`[v0] Found ${reports.length} reports in local file system`)

      return NextResponse.json({
        success: true,
        reports,
        message: `Found ${reports.length} reports`,
      })
    } catch (error) {
      console.log("[v0] No reports directory found, returning empty list")
      return NextResponse.json({
        success: true,
        reports: [],
        message: "No reports found",
      })
    }
  } catch (error) {
    console.error("[v0] Error listing reports:", error)
    return NextResponse.json({
      success: true,
      reports: [],
      message: "No reports found",
    })
  }
}

import { NextResponse } from "next/server"
import { readdir } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    console.log("[v0] List route called - using reliable file system approach")

    const reportsDir = join(process.cwd(), "data", "reports")

    try {
      const files = await readdir(reportsDir)
      const reportFiles = files
        .filter((file) => file.endsWith(".json"))
        .sort((a, b) => {
          const timestampA = a.split("_")[0].replace(/-/g, ":")
          const timestampB = b.split("_")[0].replace(/-/g, ":")
          return new Date(timestampB).getTime() - new Date(timestampA).getTime()
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
        }
      })

      console.log(`[v0] Found ${reports.length} reports in file system`)

      return NextResponse.json({
        success: true,
        reports,
        message: `Found ${reports.length} reports`,
      })
    } catch (error) {
      // Directory doesn't exist or is empty
      console.log("[v0] No reports directory found, returning empty list")
      return NextResponse.json({
        success: true,
        reports: [],
        message: "No reports found",
      })
    }
  } catch (error) {
    console.error("[v0] Error listing reports:", error)
    return NextResponse.json(
      { error: "Failed to list reports", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

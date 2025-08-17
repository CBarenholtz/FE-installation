import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] List route called")

    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER || "your-username"
    const repo = process.env.GITHUB_REPO || "water-reports"

    if (!token) {
      console.log("[v0] GitHub storage not configured, returning empty list")
      return NextResponse.json({
        success: true,
        reports: [],
        message: "GitHub storage not configured",
      })
    }

    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/reports`

    const response = await fetch(githubUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Reports directory doesn't exist yet
        console.log("[v0] Reports directory not found, returning empty list")
        return NextResponse.json({
          success: true,
          reports: [],
          message: "No reports found",
        })
      }
      const errorText = await response.text()
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const files = await response.json()

    // Filter for JSON files and sort by name (which includes timestamp)
    const reportFiles = files
      .filter((file: any) => file.name?.endsWith(".json"))
      .sort((a: any, b: any) => b.name.localeCompare(a.name))
      .slice(0, 15) // Get most recent 15 reports

    const reports = reportFiles.map((file: any) => {
      const filename = file.name
      const parts = filename.replace(".json", "").split("_")
      const timestamp = parts[0]
      const propertyName = parts.slice(1).join("_").replace(/-/g, " ")

      return {
        filename,
        propertyName,
        timestamp,
        uploadDate: timestamp,
        url: file.html_url,
      }
    })

    console.log(`[v0] Found ${reports.length} reports in GitHub storage`)

    return NextResponse.json({
      success: true,
      reports,
      message: `Found ${reports.length} reports`,
    })
  } catch (error) {
    console.error("[v0] Error listing reports:", error)
    return NextResponse.json(
      { error: "Failed to list reports", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

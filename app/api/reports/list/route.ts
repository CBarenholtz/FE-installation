import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] List route called")

    console.log("[v0] Environment check:")
    console.log("[v0] GITHUB_TOKEN exists:", !!process.env.GITHUB_TOKEN)
    console.log("[v0] GITHUB_OWNER:", process.env.GITHUB_OWNER || "not set")
    console.log("[v0] GITHUB_REPO:", process.env.GITHUB_REPO || "not set")
    console.log(
      "[v0] All env vars starting with GITHUB:",
      Object.keys(process.env).filter((key) => key.startsWith("GITHUB")),
    )

    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO || "water-reports"

    if (!token || !owner) {
      console.log("[v0] GitHub storage not configured, returning empty list")
      console.log("[v0] Missing:", !token ? "GITHUB_TOKEN" : "", !owner ? "GITHUB_OWNER" : "")
      return NextResponse.json({
        success: true,
        reports: [],
        message: "GitHub storage not configured",
      })
    }

    console.log("[v0] GitHub configured - Owner:", owner, "Repo:", repo)

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
        displayName: `${propertyName} (${new Date(timestamp.replace(/-/g, ":")).toLocaleDateString()})`,
      }
    })

    console.log(`[v0] Found ${reports.length} reports in GitHub storage (max 15)`)

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

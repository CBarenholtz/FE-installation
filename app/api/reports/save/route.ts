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
    const filename = `${timestamp}_${sanitizedPropertyName}.json`

    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER || "your-username"
    const repo = process.env.GITHUB_REPO || "water-reports"

    if (!token) {
      return NextResponse.json(
        {
          error: "GitHub storage not configured",
          details: "GITHUB_TOKEN not available",
        },
        { status: 500 },
      )
    }

    const content = Buffer.from(JSON.stringify(reportData, null, 2)).toString("base64")
    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/reports/${filename}`

    const response = await fetch(githubUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: `Add water report for ${sanitizedPropertyName}`,
        content,
        branch: "main",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] Report saved to GitHub:", result.content.html_url)

    return NextResponse.json({
      success: true,
      filename,
      propertyName: sanitizedPropertyName,
      timestamp,
      url: result.content.html_url,
      message: "Report saved to GitHub storage",
    })
  } catch (error) {
    console.error("[v0] Error saving report:", error)
    return NextResponse.json(
      { error: "Failed to save report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

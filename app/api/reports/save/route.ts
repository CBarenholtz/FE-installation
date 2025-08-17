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

    // Verify repository access
    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`
    const repoCheck = await fetch(repoUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!repoCheck.ok) {
      const errorText = await repoCheck.text()
      return NextResponse.json(
        {
          error: "Cannot access repository",
          details: `Repository ${owner}/${repo} not accessible: ${repoCheck.status} ${repoCheck.statusText} - ${errorText}`,
        },
        { status: 500 },
      )
    }

    const repoData = await repoCheck.json()
    const defaultBranch = repoData.default_branch || "main"

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
        branch: defaultBranch, // Use detected default branch instead of hardcoded "main"
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] Report saved to GitHub:", result.content.html_url)

    try {
      const listUrl = `https://api.github.com/repos/${owner}/${repo}/contents/reports`
      const listResponse = await fetch(listUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      })

      if (listResponse.ok) {
        const files = await listResponse.json()
        const reportFiles = files
          .filter((file: any) => file.name?.endsWith(".json"))
          .sort((a: any, b: any) => b.name.localeCompare(a.name))

        // Delete reports beyond the 15 most recent
        if (reportFiles.length > 15) {
          const filesToDelete = reportFiles.slice(15)
          console.log(`[v0] Cleaning up ${filesToDelete.length} old reports`)

          for (const file of filesToDelete) {
            const deleteUrl = `https://api.github.com/repos/${owner}/${repo}/contents/reports/${file.name}`
            await fetch(deleteUrl, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github.v3+json",
              },
              body: JSON.stringify({
                message: `Clean up old report: ${file.name}`,
                sha: file.sha,
                branch: defaultBranch, // Use detected default branch for cleanup too
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

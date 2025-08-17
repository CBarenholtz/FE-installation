import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Load route called via GET")

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    console.log("[v0] Loading report with ID:", id)

    const githubToken = process.env.GITHUB_TOKEN
    const githubOwner = process.env.GITHUB_OWNER
    const githubRepo = process.env.GITHUB_REPO || "water-reports"

    if (!githubToken || !githubOwner) {
      console.log("[v0] GitHub not configured for load operation")
      return NextResponse.json({ error: "GitHub storage not configured" }, { status: 500 })
    }

    const filePath = `reports/${id}`
    const url = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`)
    }

    const fileData = await response.json()
    const reportData = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"))

    console.log("[v0] Report loaded successfully")

    return NextResponse.json({
      success: true,
      reportData,
    })
  } catch (error) {
    console.error("[v0] Error loading report:", error)
    return NextResponse.json(
      { error: "Failed to load report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Load route called")

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("[v0] Loading report from URL:", url)

    // Fetch the report data from Vercel Blob
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`)
    }

    const reportData = await response.json()

    console.log("[v0] Report loaded successfully")

    return NextResponse.json({
      success: true,
      reportData,
    })
  } catch (error) {
    console.error("[v0] Error loading report:", error)
    return NextResponse.json(
      { error: "Failed to load report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

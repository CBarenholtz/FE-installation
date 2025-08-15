import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Fetch the JSON file from Blob storage
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.statusText}`)
    }

    const reportData = await response.json()

    return NextResponse.json({
      success: true,
      reportData: reportData,
    })
  } catch (error) {
    console.error("Report load error:", error)
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 })
  }
}

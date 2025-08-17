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

    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      console.log("[v0] Blob storage not configured for load operation")
      return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 })
    }

    const response = await fetch(`https://blob.vercel-storage.com/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`)
    }

    const reportData = await response.json()

    console.log("[v0] Report loaded successfully from Blob storage")

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

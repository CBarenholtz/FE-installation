"use server"

import { revalidatePath } from "next/cache"

export async function saveReportToSupabase(reportData: any) {
  console.log("[v0] Server Action: STARTING save function")
  console.log("[v0] Server Action: Environment variables check:", {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    supabaseUrl: process.env.SUPABASE_URL?.substring(0, 30) + "...",
  })

  try {
    console.log("[v0] Server Action: Saving report to Supabase")
    console.log("[v0] Server Action: Report data received:", {
      hasCustomerInfo: !!reportData.customerInfo,
      hasInstallationData: !!reportData.installationData,
      customerName: reportData.customerInfo?.customerName,
      propertyName: reportData.customerInfo?.propertyName,
    })

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_ANON_KEY) {
      console.error("[v0] Server Action: Missing required environment variables")
      return {
        success: false,
        message: "Server configuration error - missing environment variables",
      }
    }

    const reportId = globalThis.crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo?.propertyName || "Unknown Property"
    const title = `${propertyName.replace(/\s+/g, "-")}_${Date.now()}`

    console.log("[v0] Server Action: Prepared save data:", { reportId, title, timestamp })

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: reportId,
        title: title,
        data: reportData,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    })

    console.log("[v0] Server Action: Supabase response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Server Action: Supabase save error:", errorText)
      return {
        success: false,
        message: "Failed to save report to cloud storage",
      }
    }

    console.log("[v0] Server Action: Successfully saved report to Supabase")

    revalidatePath("/")

    return {
      success: true,
      message: "Report saved to cloud storage successfully!",
      reportId: reportId,
    }
  } catch (error) {
    console.error("[v0] Server Action: Error saving report:", error)
    return {
      success: false,
      message: "Failed to save report",
    }
  }
}

export async function loadReportsFromSupabase() {
  try {
    console.log("[v0] Server Action: Loading reports from Supabase")

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/reports?select=id,title,created_at&order=created_at.desc&limit=15`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: process.env.SUPABASE_ANON_KEY!,
        },
      },
    )

    if (!response.ok) {
      console.error("[v0] Server Action: Supabase query error:", await response.text())
      return {
        success: true,
        reports: [],
        message: "No reports found",
      }
    }

    const reports = await response.json()

    const formattedReports = reports.map((report: any) => {
      const parts = report.title.split("_")
      const propertyName = parts[0].replace(/-/g, " ")
      const timestamp = report.created_at

      return {
        id: report.id,
        filename: report.title,
        propertyName,
        timestamp,
        displayName: `${propertyName} (${new Date(timestamp).toLocaleDateString()})`,
      }
    })

    console.log(`[v0] Server Action: Found ${formattedReports.length} reports in Supabase`)

    return {
      success: true,
      reports: formattedReports,
      message: `Found ${formattedReports.length} reports`,
    }
  } catch (error) {
    console.error("[v0] Server Action: Error loading reports:", error)
    return {
      success: true,
      reports: [],
      message: "No reports found",
    }
  }
}

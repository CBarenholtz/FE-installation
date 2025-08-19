"use server"

import { revalidatePath } from "next/cache"

export async function saveReportToSupabase(reportData: any) {
  console.log("[v0] Server Action: STARTING save function")

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] Server Action: Missing Supabase environment variables")
      return {
        success: false,
        message: "Server configuration error - missing environment variables",
      }
    }

    console.log("[v0] Server Action: Saving report to Supabase")
    console.log("[v0] Server Action: Report data received:", {
      hasCustomerInfo: !!reportData.customerInfo,
      hasInstallationData: !!reportData.installationData,
      customerName: reportData.customerInfo?.customerName,
      propertyName: reportData.customerInfo?.propertyName,
    })

    const reportId = globalThis.crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo?.propertyName || "Unknown Property"
    const title = `${propertyName.replace(/\s+/g, "-")}_${Date.now()}`

    console.log("[v0] Server Action: Prepared save data:", { reportId, title, timestamp })

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Server Action: Supabase save error:", response.status, errorText)
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
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          apikey: process.env.SUPABASE_ANON_KEY!,
        },
      },
    )

    if (!response.ok) {
      console.error("[v0] Server Action: Supabase query error:", response.status)
      return {
        success: true,
        reports: [],
        message: "No reports found",
      }
    }

    const reports = await response.json()

    const formattedReports = (reports || []).map((report: any) => {
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

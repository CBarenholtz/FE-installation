"use server"

import { createClient } from "@supabase/supabase-js"
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

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const reportId = globalThis.crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo?.propertyName || "Unknown Property"
    const title = `${propertyName.replace(/\s+/g, "-")}_${Date.now()}`

    console.log("[v0] Server Action: Prepared save data:", { reportId, title, timestamp })

    const { data, error } = await supabase.from("reports").insert({
      id: reportId,
      title: title,
      data: reportData,
      created_at: timestamp,
      updated_at: timestamp,
    })

    if (error) {
      console.error("[v0] Server Action: Supabase save error:", error)
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

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

    const { data: reports, error } = await supabase
      .from("reports")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(15)

    if (error) {
      console.error("[v0] Server Action: Supabase query error:", error)
      return {
        success: true,
        reports: [],
        message: "No reports found",
      }
    }

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

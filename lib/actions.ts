"use server"

import { revalidatePath } from "next/cache"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function saveReportDirectly(reportData: any) {
  console.log("[v0] FIXED SAVE METHOD: Starting direct save to Supabase")

  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const timestamp = new Date().toISOString()
    const propertyName = reportData.customerInfo?.propertyName || "Unknown Property"

    const savePayload = {
      id: reportId,
      title: `${propertyName.replace(/\s+/g, "-")}_${Date.now()}`,
      data: {
        customerInfo: reportData.customerInfo,
        installationData: reportData.installationData,
        toiletCount: reportData.toiletCount,
        reportNotes: reportData.reportNotes || [],
        savedAt: timestamp,
      },
      created_at: timestamp,
      updated_at: timestamp,
    }

    console.log("[v0] FIXED SAVE METHOD: Attempting to save with payload:", {
      id: savePayload.id,
      title: savePayload.title,
      dataSize: JSON.stringify(savePayload.data).length,
    })

    const { data, error } = await supabase.from("reports").insert(savePayload).select()

    if (error) {
      console.error("[v0] FIXED SAVE METHOD: Supabase error:", error)
      return {
        success: false,
        message: `Save failed: ${error.message}`,
      }
    }

    console.log("[v0] FIXED SAVE METHOD: Successfully saved report!", data)
    revalidatePath("/")

    return {
      success: true,
      message: "Report saved successfully!",
      reportId: reportId,
    }
  } catch (error) {
    console.error("[v0] FIXED SAVE METHOD: Error:", error)
    return {
      success: false,
      message: `Save error: ${error}`,
    }
  }
}

export async function loadReportsFromSupabase() {
  try {
    console.log("[v0] Server Action: Loading reports from Supabase")

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data: reports, error } = await supabase
      .from("reports")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(15)

    if (error) {
      console.error("[v0] Server Action: Supabase error:", error)
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

export async function saveReportToSupabase(reportData: any) {
  console.log("[v0] OLD SAVE METHOD: Redirecting to new method")
  return await saveReportDirectly(reportData)
}

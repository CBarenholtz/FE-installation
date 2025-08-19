"use server"

import { revalidatePath } from "next/cache"

export async function saveReportDirectly(reportData: any) {
  console.log("[v0] NEW SAVE METHOD: Starting direct save to Supabase")

  try {
    // Use environment variables that are definitely available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] NEW SAVE METHOD: Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlValue: supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : "missing",
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        message: "Missing Supabase configuration",
      }
    }

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

    console.log("[v0] NEW SAVE METHOD: Attempting to save with payload:", {
      id: savePayload.id,
      title: savePayload.title,
      dataSize: JSON.stringify(savePayload.data).length,
    })

    // Direct REST API call with proper headers
    const response = await fetch(`${supabaseUrl}/rest/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
        Prefer: "return=representation",
      },
      body: JSON.stringify(savePayload),
    })

    const responseText = await response.text()
    console.log("[v0] NEW SAVE METHOD: Response status:", response.status)
    console.log("[v0] NEW SAVE METHOD: Response text:", responseText)

    if (!response.ok) {
      return {
        success: false,
        message: `Save failed: ${response.status} - ${responseText}`,
      }
    }

    console.log("[v0] NEW SAVE METHOD: Successfully saved report!")
    revalidatePath("/")

    return {
      success: true,
      message: "Report saved successfully!",
      reportId: reportId,
    }
  } catch (error) {
    console.error("[v0] NEW SAVE METHOD: Error:", error)
    return {
      success: false,
      message: `Save error: ${error}`,
    }
  }
}

export async function loadReportsFromSupabase() {
  try {
    console.log("[v0] Server Action: Loading reports from Supabase")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Server Action: Missing environment variables for loading")
      return {
        success: true,
        reports: [],
        message: "No reports found",
      }
    }

    // Use Supabase REST API directly
    const response = await fetch(
      `${supabaseUrl}/rest/v1/reports?select=id,title,created_at&order=created_at.desc&limit=15`,
      {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
      },
    )

    if (!response.ok) {
      console.error("[v0] Server Action: Supabase API error:", response.status)
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

export async function saveReportToSupabase(reportData: any) {
  console.log("[v0] OLD SAVE METHOD: Redirecting to new method")
  return await saveReportDirectly(reportData)
}

import type { CustomerInfo, InstallationData, Note, ImageData } from "@/lib/types"

export interface SavedReportData {
  id: string
  customerInfo: CustomerInfo
  installationData: InstallationData[]
  reportNotes: Note[]
  reportImages: ImageData[]
  toiletCount: number
  dateCreated: string
  dateModified: string

  // Optional data that might exist
  coverImage?: string
  coverImageSize?: number
  rawInstallationData?: any[]
  reportTitle?: string
  letterText?: string[]
  signatureName?: string
  signatureTitle?: string
  rePrefix?: string
  dearPrefix?: string
  sectionTitles?: Record<string, string>
  selectedCells?: any[]
  selectedNotesColumns?: string[]
  unifiedNotes?: any
  editedUnits?: any
  detailInstallations?: any
  columnHeaders?: any
  additionalDetailRows?: any
}

export interface SavedReportSummary {
  id: string
  customerName: string
  propertyAddress: string
  dateCreated: string
  dateModified: string
  installationCount: number
  hasImages: boolean
}

export class ReportManager {
  private static readonly SAVED_REPORT_PREFIX = "saved_report_"

  /**
   * Save the current report state to localStorage
   */
  static saveCurrentReport(reportName?: string): string {
    try {
      // Generate unique ID based on timestamp and customer name
      const customerInfo = this.getCurrentCustomerInfo()
      const timestamp = new Date().toISOString()
      const customerName = customerInfo?.customerName || "Unknown"
      const sanitizedName = customerName.replace(/[^a-zA-Z0-9]/g, "_")
      const reportId = `${Date.now()}_${sanitizedName}`

      // Collect all current report data
      const reportData: SavedReportData = {
        id: reportId,
        customerInfo: customerInfo || this.getDefaultCustomerInfo(),
        installationData: this.getCurrentInstallationData(),
        reportNotes: this.getCurrentReportNotes(),
        reportImages: this.getCurrentReportImages(),
        toiletCount: this.getCurrentToiletCount(),
        dateCreated: timestamp,
        dateModified: timestamp,
      }

      // Add optional data if it exists
      const optionalData = this.getOptionalReportData()
      Object.assign(reportData, optionalData)

      // Save to localStorage
      const key = `${this.SAVED_REPORT_PREFIX}${reportId}`
      localStorage.setItem(key, JSON.stringify(reportData))

      console.log(`Report saved successfully with ID: ${reportId}`)
      return reportId
    } catch (error) {
      console.error("Error saving report:", error)
      throw new Error("Failed to save report")
    }
  }

  /**
   * Load a saved report back into the current session
   */
  static loadSavedReport(reportId: string): boolean {
    try {
      const key = `${this.SAVED_REPORT_PREFIX}${reportId}`
      const savedData = localStorage.getItem(key)

      if (!savedData) {
        console.error(`Report with ID ${reportId} not found`)
        return false
      }

      const reportData: SavedReportData = JSON.parse(savedData)

      if (!reportData.customerInfo || !reportData.installationData) {
        console.error(`Invalid report data for ID ${reportId}`)
        return false
      }

      // Update the dateModified timestamp
      reportData.dateModified = new Date().toISOString()
      localStorage.setItem(key, JSON.stringify(reportData))

      this.clearCurrentSession()

      // Load all data back into current session
      localStorage.setItem("customerInfo", JSON.stringify(reportData.customerInfo))
      localStorage.setItem("installationData", JSON.stringify(reportData.installationData))
      localStorage.setItem("reportNotes", JSON.stringify(reportData.reportNotes || []))
      localStorage.setItem("reportImages", JSON.stringify(reportData.reportImages || []))
      localStorage.setItem("toiletCount", reportData.toiletCount.toString())

      // Load optional data if it exists
      if (reportData.coverImage) localStorage.setItem("coverImage", reportData.coverImage)
      if (reportData.coverImageSize) localStorage.setItem("coverImageSize", reportData.coverImageSize.toString())
      if (reportData.rawInstallationData)
        localStorage.setItem("rawInstallationData", JSON.stringify(reportData.rawInstallationData))
      if (reportData.reportTitle) localStorage.setItem("reportTitle", JSON.stringify(reportData.reportTitle))
      if (reportData.letterText) localStorage.setItem("letterText", JSON.stringify(reportData.letterText))
      if (reportData.signatureName) localStorage.setItem("signatureName", JSON.stringify(reportData.signatureName))
      if (reportData.signatureTitle) localStorage.setItem("signatureTitle", JSON.stringify(reportData.signatureTitle))
      if (reportData.rePrefix) localStorage.setItem("rePrefix", JSON.stringify(reportData.rePrefix))
      if (reportData.dearPrefix) localStorage.setItem("dearPrefix", JSON.stringify(reportData.dearPrefix))
      if (reportData.sectionTitles) localStorage.setItem("sectionTitles", JSON.stringify(reportData.sectionTitles))
      if (reportData.selectedCells) localStorage.setItem("selectedCells", JSON.stringify(reportData.selectedCells))
      if (reportData.selectedNotesColumns)
        localStorage.setItem("selectedNotesColumns", JSON.stringify(reportData.selectedNotesColumns))
      if (reportData.unifiedNotes) localStorage.setItem("unifiedNotes", JSON.stringify(reportData.unifiedNotes))
      if (reportData.editedUnits) localStorage.setItem("editedUnits", JSON.stringify(reportData.editedUnits))
      if (reportData.detailInstallations)
        localStorage.setItem("detailInstallations", JSON.stringify(reportData.detailInstallations))
      if (reportData.columnHeaders) localStorage.setItem("columnHeaders", JSON.stringify(reportData.columnHeaders))
      if (reportData.additionalDetailRows)
        localStorage.setItem("additionalDetailRows", JSON.stringify(reportData.additionalDetailRows))

      console.log(`Report loaded successfully: ${reportId}`)
      return true
    } catch (error) {
      console.error("Error loading report:", error)
      return false
    }
  }

  /**
   * Get a list of all saved reports
   */
  static getSavedReports(): SavedReportSummary[] {
    const reports: SavedReportSummary[] = []
    const keys = Object.keys(localStorage)

    keys.forEach((key) => {
      if (key.startsWith(this.SAVED_REPORT_PREFIX)) {
        try {
          const reportData: SavedReportData = JSON.parse(localStorage.getItem(key) || "{}")
          if (reportData.customerInfo && reportData.installationData) {
            reports.push({
              id: reportData.id,
              customerName: reportData.customerInfo.customerName || "Unknown Customer",
              propertyAddress: reportData.customerInfo.address || "No Address",
              dateCreated: reportData.dateCreated,
              dateModified: reportData.dateModified,
              installationCount: reportData.installationData.length || 0,
              hasImages: (reportData.reportImages?.length || 0) > 0,
            })
          }
        } catch (error) {
          console.error("Error parsing saved report:", key, error)
        }
      }
    })

    // Sort by date modified (newest first)
    return reports.sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())
  }

  /**
   * Delete a saved report
   */
  static deleteSavedReport(reportId: string): boolean {
    try {
      const key = `${this.SAVED_REPORT_PREFIX}${reportId}`
      localStorage.removeItem(key)
      console.log(`Report deleted successfully: ${reportId}`)
      return true
    } catch (error) {
      console.error("Error deleting report:", error)
      return false
    }
  }

  /**
   * Check if there's unsaved work in the current session
   */
  static hasUnsavedWork(): boolean {
    const customerInfo = this.getCurrentCustomerInfo()
    const installationData = this.getCurrentInstallationData()

    return !!(customerInfo?.customerName && installationData.length > 0)
  }

  private static getCurrentCustomerInfo(): CustomerInfo | null {
    try {
      const stored = localStorage.getItem("customerInfo")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  private static getCurrentInstallationData(): InstallationData[] {
    try {
      const stored = localStorage.getItem("installationData")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private static getCurrentReportNotes(): Note[] {
    try {
      const stored = localStorage.getItem("reportNotes")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private static getCurrentReportImages(): ImageData[] {
    try {
      const stored = localStorage.getItem("reportImages")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private static getCurrentToiletCount(): number {
    try {
      const stored = localStorage.getItem("toiletCount")
      return stored ? Number.parseInt(stored, 10) : 0
    } catch {
      return 0
    }
  }

  private static getOptionalReportData(): Partial<SavedReportData> {
    const optionalData: Partial<SavedReportData> = {}

    // Helper function to safely get and parse localStorage data
    const safeGet = (key: string) => {
      try {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value) : undefined
      } catch {
        return localStorage.getItem(key) // Return as string if JSON parsing fails
      }
    }

    // Collect optional data
    const coverImage = localStorage.getItem("coverImage")
    if (coverImage) optionalData.coverImage = coverImage

    const coverImageSize = localStorage.getItem("coverImageSize")
    if (coverImageSize) optionalData.coverImageSize = Number.parseInt(coverImageSize, 10)

    const rawInstallationData = safeGet("rawInstallationData")
    if (rawInstallationData) optionalData.rawInstallationData = rawInstallationData

    const reportTitle = safeGet("reportTitle")
    if (reportTitle) optionalData.reportTitle = reportTitle

    const letterText = safeGet("letterText")
    if (letterText) optionalData.letterText = letterText

    const signatureName = safeGet("signatureName")
    if (signatureName) optionalData.signatureName = signatureName

    const signatureTitle = safeGet("signatureTitle")
    if (signatureTitle) optionalData.signatureTitle = signatureTitle

    const rePrefix = safeGet("rePrefix")
    if (rePrefix) optionalData.rePrefix = rePrefix

    const dearPrefix = safeGet("dearPrefix")
    if (dearPrefix) optionalData.dearPrefix = dearPrefix

    const sectionTitles = safeGet("sectionTitles")
    if (sectionTitles) optionalData.sectionTitles = sectionTitles

    const selectedCells = safeGet("selectedCells")
    if (selectedCells) optionalData.selectedCells = selectedCells

    const selectedNotesColumns = safeGet("selectedNotesColumns")
    if (selectedNotesColumns) optionalData.selectedNotesColumns = selectedNotesColumns

    const unifiedNotes = safeGet("unifiedNotes")
    if (unifiedNotes) optionalData.unifiedNotes = unifiedNotes

    const editedUnits = safeGet("editedUnits")
    if (editedUnits) optionalData.editedUnits = editedUnits

    const detailInstallations = safeGet("detailInstallations")
    if (detailInstallations) optionalData.detailInstallations = detailInstallations

    const columnHeaders = safeGet("columnHeaders")
    if (columnHeaders) optionalData.columnHeaders = columnHeaders

    const additionalDetailRows = safeGet("additionalDetailRows")
    if (additionalDetailRows) optionalData.additionalDetailRows = additionalDetailRows

    return optionalData
  }

  private static getDefaultCustomerInfo(): CustomerInfo {
    return {
      customerName: "",
      propertyName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      date: new Date().toLocaleDateString(),
    }
  }

  /**
   * Clear current session data
   */
  private static clearCurrentSession(): void {
    const keysToRemove = [
      "customerInfo",
      "installationData",
      "reportNotes",
      "reportImages",
      "toiletCount",
      "coverImage",
      "coverImageSize",
      "rawInstallationData",
      "reportTitle",
      "letterText",
      "signatureName",
      "signatureTitle",
      "rePrefix",
      "dearPrefix",
      "sectionTitles",
      "selectedCells",
      "selectedNotesColumns",
      "unifiedNotes",
      "editedUnits",
      "detailInstallations",
      "columnHeaders",
      "additionalDetailRows",
    ]

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })
  }
}

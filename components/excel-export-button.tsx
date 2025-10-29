"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import type { CustomerInfo, InstallationData, Note } from "@/lib/types"
import { getStoredNotes } from "@/lib/notes"

interface ExcelExportButtonProps {
  customerInfo: CustomerInfo
  installationData: InstallationData[]
  toiletCount: number
  notes: Note[]
}

export default function ExcelExportButton({
  customerInfo,
  installationData,
  toiletCount,
  notes,
}: ExcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [xlsxLoaded, setXlsxLoaded] = useState(false)

  useEffect(() => {
    // Load xlsx library dynamically
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
    script.async = true
    script.onload = () => setXlsxLoaded(true)
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handleExportExcel = async () => {
    if (!xlsxLoaded) {
      alert("Excel export library is still loading. Please try again in a moment.")
      return
    }

    try {
      setIsExporting(true)
      console.log("Starting Excel export...")

      // Load latest data from localStorage
      const latestEditedUnits = JSON.parse(localStorage.getItem("editedUnits") || "{}")
      const latestEditedNotes = getStoredNotes()
      const latestEditedInstallations = JSON.parse(localStorage.getItem("detailInstallations") || "{}")
      const latestColumnHeaders = JSON.parse(localStorage.getItem("columnHeaders") || "{}")

      let picturesData: any[] = []
      try {
        const storedImages = localStorage.getItem("reportImages")
        if (storedImages) {
          picturesData = JSON.parse(storedImages)
          console.log("Excel: Loaded pictures data:", picturesData.length, "images")
        }
      } catch (error) {
        console.error("Excel: Error loading pictures data:", error)
      }

      const findUnitColumn = (data: InstallationData[]): string | null => {
        if (!data || data.length === 0) return null
        const firstItem = data[0]
        const keys = Object.keys(firstItem)

        // Look for "Unit" column first
        if (keys.includes("Unit")) return "Unit"

        // Look for any column containing "unit"
        for (const key of keys) {
          if (key.toLowerCase().includes("unit")) return key
        }

        // Fallback to first column
        return keys[0]
      }

      const findSpecificColumns = () => {
        if (!installationData.length) return {}

        const firstItem = installationData[0]
        const keys = Object.keys(firstItem)

        const columns = {
          // Kitchen aerator column (for type, quantity always 1 if exists)
          kitchenAerator: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("kitchen") && lowerKey.includes("aerator")
          }),

          // Bathroom aerator columns (count both guest and master)
          bathroomAeratorGuest: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("bathroom") && lowerKey.includes("aerator") && lowerKey.includes("guest")
          }),
          bathroomAeratorMaster: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("bathroom") && lowerKey.includes("aerator") && lowerKey.includes("master")
          }),

          // Shower columns (read actual quantities)
          adaShowerHead: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("ada") && lowerKey.includes("shower")
          }),
          regularShowerHead: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return (
              lowerKey.includes("shower") &&
              (lowerKey.includes("head") || lowerKey === "showerhead") &&
              !lowerKey.includes("ada")
            )
          }),

          // Toilet installation column (read direct quantity)
          toiletInstalled: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("toilet") && lowerKey.includes("install")
          }),
        }

        console.log("Excel: Found specific columns:", columns)
        return columns
      }

      const unitColumn = findUnitColumn(installationData)
      const specificColumns = findSpecificColumns()

      // Filter and process data using the same logic as preview
      const filteredData = installationData.filter((item) => {
        const unitValue = unitColumn ? item[unitColumn] : item.Unit
        if (!unitValue || String(unitValue).trim() === "") return false

        const trimmedUnit = String(unitValue).trim()
        const lowerUnit = trimmedUnit.toLowerCase()
        const invalidValues = ["total", "sum", "average", "avg", "count", "header"]

        return !invalidValues.some((val) => lowerUnit === val || lowerUnit.includes(val))
      })

      // Consolidate installations by unit using exact same logic as preview
      const consolidatedData: Record<
        string,
        {
          unit: string
          kitchenQuantity: number
          bathroomQuantity: number
          showerADAQuantity: number
          showerRegularQuantity: number
          toiletQuantity: number
          notes: string[]
        }
      > = {}

      // Process each row and consolidate by unit (same as preview)
      for (const item of filteredData) {
        const unitValue = unitColumn ? item[unitColumn] : item.Unit
        const unitKey = String(unitValue || "").trim()

        if (!unitKey) continue

        // Initialize unit data if not exists
        if (!consolidatedData[unitKey]) {
          consolidatedData[unitKey] = {
            unit: unitKey,
            kitchenQuantity: 0,
            bathroomQuantity: 0,
            showerADAQuantity: 0,
            showerRegularQuantity: 0,
            toiletQuantity: 0,
            notes: [],
          }
        }

        // Kitchen: Always 1 if kitchen aerator column has data
        if (specificColumns.kitchenAerator && item[specificColumns.kitchenAerator]) {
          const kitchenValue = String(item[specificColumns.kitchenAerator]).trim()
          if (kitchenValue && kitchenValue !== "" && kitchenValue !== "0") {
            consolidatedData[unitKey].kitchenQuantity = 1
          }
        }

        // Bathroom: Count guest + master columns (each counts as 1 if has data)
        let bathroomCount = 0
        if (specificColumns.bathroomAeratorGuest && item[specificColumns.bathroomAeratorGuest]) {
          const guestValue = String(item[specificColumns.bathroomAeratorGuest]).trim()
          if (guestValue && guestValue !== "" && guestValue !== "0") {
            bathroomCount += 1
          }
        }
        if (specificColumns.bathroomAeratorMaster && item[specificColumns.bathroomAeratorMaster]) {
          const masterValue = String(item[specificColumns.bathroomAeratorMaster]).trim()
          if (masterValue && masterValue !== "" && masterValue !== "0") {
            bathroomCount += 1
          }
        }
        consolidatedData[unitKey].bathroomQuantity = bathroomCount

        // Shower: Read actual quantities from both columns
        if (specificColumns.adaShowerHead && item[specificColumns.adaShowerHead]) {
          const adaQuantity = Number.parseInt(String(item[specificColumns.adaShowerHead])) || 0
          consolidatedData[unitKey].showerADAQuantity = adaQuantity
        }
        if (specificColumns.regularShowerHead && item[specificColumns.regularShowerHead]) {
          const regularQuantity = Number.parseInt(String(item[specificColumns.regularShowerHead])) || 0
          consolidatedData[unitKey].showerRegularQuantity = regularQuantity
        }

        // Toilet: Read direct quantity from toilets installed column
        if (specificColumns.toiletInstalled && item[specificColumns.toiletInstalled]) {
          const toiletQuantity = Number.parseInt(String(item[specificColumns.toiletInstalled])) || 0
          consolidatedData[unitKey].toiletQuantity = toiletQuantity
        }

        // Collect notes
        const unitNotes = []
        if (item["Leak Issue Kitchen Faucet"]) unitNotes.push("Kitchen faucet leak")
        if (item["Leak Issue Bath Faucet"]) unitNotes.push("Bathroom faucet leak")
        if (item["Tub Spout/Diverter Leak Issue"])
          unitNotes.push(`${item["Tub Spout/Diverter Leak Issue"]} leak from tub`)
        if (item.Notes) unitNotes.push(item.Notes)

        consolidatedData[unitKey].notes.push(...unitNotes)
      }

      // Create workbook
      const XLSX = window.XLSX
      const workbook = XLSX.utils.book_new()

      // Create summary sheet
      const summaryData = [
        ["Water Conservation Installation Report"],
        [""],
        ["Property Information"],
        ["Property Name", customerInfo.propertyName],
        ["Customer Name", customerInfo.customerName],
        ["Address", `${customerInfo.address} ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zip}`],
        ["Date", customerInfo.date],
        [""],
        ["Installation Summary"],
        ["Total Toilets Installed", toiletCount],
        ["Total Units Processed", Object.keys(consolidatedData).length],
      ]

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")

      // Create detailed installation sheet
      const detailHeaders = [
        latestColumnHeaders.unit || "Unit",
        latestColumnHeaders.kitchen || "Kitchen Aerator Installed",
        latestColumnHeaders.bathroom || "Bathroom Aerator Installed",
        latestColumnHeaders.shower || "Shower Head Installed",
        latestColumnHeaders.toilet || "Toilet Installed",
        latestColumnHeaders.notes || "Notes",
      ]

      const detailData = [detailHeaders]

      // Sort consolidated data by unit
      const sortedUnits = Object.values(consolidatedData).sort((a, b) => {
        const numA = Number.parseInt(a.unit)
        const numB = Number.parseInt(b.unit)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return a.unit.localeCompare(b.unit, undefined, { numeric: true, sensitivity: "base" })
      })

      sortedUnits.forEach((consolidated) => {
        // Get edited installations if they exist
        const editedInstallation = latestEditedInstallations[consolidated.unit]

        const kitchenDisplay =
          editedInstallation?.kitchen !== undefined
            ? editedInstallation.kitchen
            : consolidated.kitchenQuantity > 0
              ? "1.0 GPM (1)"
              : "Unable"

        const bathroomDisplay =
          editedInstallation?.bathroom !== undefined
            ? editedInstallation.bathroom
            : consolidated.bathroomQuantity > 0
              ? `1.0 GPM (${consolidated.bathroomQuantity})`
              : "Unable"

        const showerDisplay = (() => {
          if (editedInstallation?.shower !== undefined) {
            return editedInstallation.shower
          }

          const parts = []
          if (consolidated.showerRegularQuantity > 0) {
            parts.push(`1.75 GPM (${consolidated.showerRegularQuantity})`)
          }
          if (consolidated.showerADAQuantity > 0) {
            parts.push(`1.5 GPM (${consolidated.showerADAQuantity})`)
          }

          return parts.length > 0 ? parts.join("\n") : "Unable"
        })()

        const toiletDisplay =
          editedInstallation?.toilet !== undefined
            ? editedInstallation.toilet
            : consolidated.toiletQuantity > 0
              ? `0.8 GPF (${consolidated.toiletQuantity})`
              : ""

        // Get notes (edited notes take priority)
        const finalNotes = latestEditedNotes[consolidated.unit] || consolidated.notes.join(". ") || ""

        detailData.push([consolidated.unit, kitchenDisplay, bathroomDisplay, showerDisplay, toiletDisplay, finalNotes])
      })

      if (notes.length > 0) {
        const notesData = [["Unit", "Notes"]]
        notes.forEach((note) => {
          notesData.push([note.unit, note.note])
        })

        const notesSheet = XLSX.utils.aoa_to_sheet(notesData)
        XLSX.utils.book_append_sheet(workbook, notesSheet, "Notes")
      }

      if (picturesData.length > 0) {
        const picturesSheetData = [["Unit", "Filename", "Caption", "Image URL"]]

        // Sort pictures by unit
        const sortedPictures = picturesData.sort((a, b) => {
          const numA = Number.parseInt(a.unit)
          const numB = Number.parseInt(b.unit)
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
          return a.unit.localeCompare(b.unit, undefined, { numeric: true, sensitivity: "base" })
        })

        sortedPictures.forEach((image) => {
          picturesSheetData.push([
            image.unit || "Unknown",
            image.filename || "Unknown",
            image.caption || "",
            image.googleDriveId ? `https://drive.google.com/file/d/${image.googleDriveId}/view` : "Local file",
          ])
        })

        const picturesSheet = XLSX.utils.aoa_to_sheet(picturesSheetData)
        XLSX.utils.book_append_sheet(workbook, picturesSheet, "Pictures")
      }

      // Generate and download file
      const filename = `${customerInfo.propertyName.replace(/\s+/g, "-")}_Water_Conservation_Report.xlsx`
      XLSX.writeFile(workbook, filename)

      console.log("Excel export complete!")
    } catch (error) {
      console.error("Error exporting Excel:", error)
      alert(`There was an error exporting to Excel: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExportExcel} disabled={isExporting || !xlsxLoaded} variant="outline">
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting Excel..." : xlsxLoaded ? "Download Excel" : "Loading Excel Export..."}
    </Button>
  )
}

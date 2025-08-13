"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import type { CustomerInfo, InstallationData, Note } from "@/lib/types"
import { getAeratorDescription } from "@/lib/utils/aerator-helpers"
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
      const latestEditedUnits = (() => {
        try {
          const stored = localStorage.getItem("editedUnits")
          if (!stored || stored === "undefined") return {}
          return JSON.parse(stored)
        } catch (error) {
          console.error("Error parsing editedUnits:", error)
          return {}
        }
      })()

      const latestEditedNotes = getStoredNotes()

      const latestEditedInstallations = (() => {
        try {
          const stored = localStorage.getItem("detailInstallations")
          if (!stored || stored === "undefined") return {}
          return JSON.parse(stored)
        } catch (error) {
          console.error("Error parsing detailInstallations:", error)
          return {}
        }
      })()

      const latestColumnHeaders = (() => {
        try {
          const stored = localStorage.getItem("columnHeaders")
          if (!stored || stored === "undefined") return {}
          return JSON.parse(stored)
        } catch (error) {
          console.error("Error parsing columnHeaders:", error)
          return {}
        }
      })()

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

      // Find column names (same logic as PDF)
      const findColumnName = (possibleNames: string[]): string | null => {
        if (!installationData || installationData.length === 0) return null

        const matchingColumns: { key: string; dataCount: number }[] = []

        for (const key of Object.keys(installationData[0])) {
          let isMatch = false

          // Check for exact match or partial match
          for (const possibleName of possibleNames) {
            if (
              key.toLowerCase() === possibleName.toLowerCase() ||
              key.toLowerCase().includes(possibleName.toLowerCase()) ||
              possibleName.toLowerCase().includes(key.toLowerCase())
            ) {
              isMatch = true
              break
            }
          }

          if (isMatch) {
            const dataCount = installationData
              .map((item) => item[key])
              .filter((value) => {
                if (!value) return false
                const trimmed = String(value).trim().toLowerCase()
                return trimmed !== "" && trimmed !== "0" && trimmed !== "no" && trimmed !== "n/a"
              }).length

            matchingColumns.push({ key, dataCount })
          }
        }

        if (matchingColumns.length === 0) return null
        matchingColumns.sort((a, b) => b.dataCount - a.dataCount)
        return matchingColumns[0].key
      }

      const findUnitColumn = (data: InstallationData[]): string | null => {
        if (!data || data.length === 0) return null
        const item = data[0]

        // Look for unit-related columns
        for (const key of Object.keys(item)) {
          const keyLower = key.toLowerCase()
          if (keyLower === "bldg/unit" || keyLower.includes("unit") || keyLower.includes("apt")) {
            return key
          }
        }
        return Object.keys(item)[0] // Fallback to first column
      }

      const unitColumn = findUnitColumn(installationData)
      const kitchenAeratorColumn = findColumnName(["Kitchen Aerator", "kitchen aerator", "kitchen"])
      const bathroomAeratorColumn = findColumnName(["Bathroom aerator", "bathroom aerator", "bathroom"])
      const showerHeadColumn = findColumnName(["Shower Head", "shower head", "shower"])

      // Consolidate installations by unit (same logic as PDF)
      const consolidatedData = new Map<
        string,
        {
          unit: string
          kitchenCount: number
          bathroomCount: number
          showerCount: number
          toiletCount: number
          notes: string[]
        }
      >()

      // Filter and process data
      const filteredData = installationData.filter((item) => {
        const unitValue = unitColumn ? item[unitColumn] : item.Unit
        if (!unitValue || String(unitValue).trim() === "") return false

        const trimmedUnit = String(unitValue).trim()
        const lowerUnit = trimmedUnit.toLowerCase()
        const invalidValues = ["total", "sum", "average", "avg", "count", "header"]

        return !invalidValues.some((val) => lowerUnit === val || lowerUnit.includes(val))
      })

      // Consolidate installations by unit
      filteredData.forEach((item) => {
        const unitValue = unitColumn ? item[unitColumn] : item.Unit
        const finalUnit = latestEditedUnits[unitValue] !== undefined ? latestEditedUnits[unitValue] : unitValue

        if (!consolidatedData.has(finalUnit)) {
          consolidatedData.set(finalUnit, {
            unit: finalUnit,
            kitchenCount: 0,
            bathroomCount: 0,
            showerCount: 0,
            toiletCount: 0,
            notes: [],
          })
        }

        const consolidated = consolidatedData.get(finalUnit)!

        // Count installations
        if (kitchenAeratorColumn && item[kitchenAeratorColumn] && item[kitchenAeratorColumn] !== "") {
          consolidated.kitchenCount++
        }
        if (bathroomAeratorColumn && item[bathroomAeratorColumn] && item[bathroomAeratorColumn] !== "") {
          consolidated.bathroomCount++
        }
        if (showerHeadColumn && item[showerHeadColumn] && item[showerHeadColumn] !== "") {
          consolidated.showerCount++
        }

        // Check for toilet installation
        const toiletColumn = Object.keys(item).find((key) => key.startsWith("Toilets Installed:"))
        if (toiletColumn && item[toiletColumn] && item[toiletColumn] !== "") {
          consolidated.toiletCount++
        }

        // Collect notes
        const unitNotes = []
        if (item["Leak Issue Kitchen Faucet"]) unitNotes.push("Kitchen faucet leak")
        if (item["Leak Issue Bath Faucet"]) unitNotes.push("Bathroom faucet leak")
        if (item["Tub Spout/Diverter Leak Issue"])
          unitNotes.push(`${item["Tub Spout/Diverter Leak Issue"]} leak from tub`)
        if (item.Notes) unitNotes.push(item.Notes)

        consolidated.notes.push(...unitNotes)
      })

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
        ["Total Units Processed", consolidatedData.size],
      ]

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")

      // Create detailed installation sheet
      const detailHeaders = [
        latestColumnHeaders.unit || "Unit",
        latestColumnHeaders.kitchen || "Kitchen Installed",
        latestColumnHeaders.bathroom || "Bathroom Installed",
        latestColumnHeaders.shower || "Shower Installed",
        latestColumnHeaders.toilet || "Toilet Installed",
        latestColumnHeaders.notes || "Notes",
      ]

      const detailData = [detailHeaders]

      // Sort consolidated data by unit
      const sortedUnits = Array.from(consolidatedData.values()).sort((a, b) => {
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
            : consolidated.kitchenCount > 0
              ? getAeratorDescription(consolidated.kitchenCount.toString(), "kitchen")
              : "No Touch."

        const bathroomDisplay =
          editedInstallation?.bathroom !== undefined
            ? editedInstallation.bathroom
            : consolidated.bathroomCount > 0
              ? getAeratorDescription(consolidated.bathroomCount.toString(), "bathroom")
              : "No Touch."

        const showerDisplay =
          editedInstallation?.shower !== undefined
            ? editedInstallation.shower
            : consolidated.showerCount > 0
              ? getAeratorDescription(consolidated.showerCount.toString(), "shower")
              : "No Touch."

        const toiletDisplay =
          consolidated.toiletCount > 0 ? `We replaced ${consolidated.toiletCount > 1 ? "both toilets" : "toilet"}.` : ""

        // Get notes (edited notes take priority)
        const finalNotes = latestEditedNotes[consolidated.unit] || consolidated.notes.join(". ") || ""

        detailData.push([consolidated.unit, kitchenDisplay, bathroomDisplay, showerDisplay, toiletDisplay, finalNotes])
      })

      const detailSheet = XLSX.utils.aoa_to_sheet(detailData)
      XLSX.utils.book_append_sheet(workbook, detailSheet, "Installation Details")

      // Create notes sheet if there are notes
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

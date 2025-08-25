"use client"
import { useState, useEffect } from "react"
import EditableText from "@/components/editable-text"
import { getAeratorDescription, formatNote } from "@/lib/utils/aerator-helpers"
import { useReportContext } from "@/lib/report-context"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { updateStoredNote, getStoredNotes, getUnifiedNotes } from "@/lib/notes"

interface InstallationData {
  Unit: string
  "Shower Head"?: string
  "Bathroom aerator"?: string
  "Kitchen Aerator"?: string
  "Leak Issue Kitchen Faucet"?: string
  "Leak Issue Bath Faucet"?: string
  "Tub Spout/Diverter Leak Issue"?: string
  Notes?: string
  [key: string]: string | undefined
}

interface ReportDetailPageProps {
  installationData: InstallationData[]
  isPreview?: boolean
  isEditable?: boolean
}

export default function ReportDetailPage({
  installationData,
  isPreview = true,
  isEditable = true,
}: ReportDetailPageProps) {
  const { sectionTitles, setSectionTitles } = useReportContext()

  // State to store edited notes
  const [editedNotes, setEditedNotes] = useState<Record<string, string>>({})
  const [editedInstallations, setEditedInstallations] = useState<Record<string, Record<string, string>>>({})
  const [editedUnits, setEditedUnits] = useState<Record<string, string>>({})
  const [additionalRows, setAdditionalRows] = useState<InstallationData[]>([])
  const [columnHeaders, setColumnHeaders] = useState({
    unit: "Unit",
    kitchen: "Kitchen Installed",
    bathroom: "Bathroom Installed",
    shower: "Shower Installed",
    toilet: "Toilet Installed",
    notes: "Notes",
  })

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

  const findColumnName = (possibleNames: string[]): string | null => {
    if (!installationData || installationData.length === 0) return null

    const firstItem = installationData[0]
    const keys = Object.keys(firstItem)

    // Look for exact matches first
    for (const possibleName of possibleNames) {
      if (keys.includes(possibleName)) return possibleName
    }

    // Look for case-insensitive matches
    for (const key of keys) {
      for (const possibleName of possibleNames) {
        if (key.toLowerCase() === possibleName.toLowerCase()) return key
      }
    }

    // Look for partial matches
    for (const key of keys) {
      for (const possibleName of possibleNames) {
        if (key.toLowerCase().includes(possibleName.toLowerCase())) return key
      }
    }

    return null
  }

  const findAllShowerColumns = (): string[] => {
    if (!installationData || installationData.length === 0) return []

    const showerColumns: string[] = []
    const keys = Object.keys(installationData[0])

    for (const key of keys) {
      if (key.toLowerCase().includes("shower")) {
        showerColumns.push(key)
      }
    }

    return showerColumns
  }

  const getShowerValue = (item: InstallationData): string => {
    const showerColumns = findAllShowerColumns()

    for (const column of showerColumns) {
      const value = item[column]
      if (value && String(value).trim() !== "" && String(value).trim() !== "0") {
        return getAeratorDescription(value, "shower")
      }
    }

    return "No Touch."
  }

  const kitchenAeratorColumn = findColumnName(["Kitchen Aerator", "kitchen aerator", "kitchen", "kitchen aerators"])
  const bathroomAeratorColumn = findColumnName([
    "Bathroom aerator",
    "bathroom aerator",
    "bathroom",
    "bathroom aerators",
    "bath aerator",
  ])
  const showerHeadColumn = findColumnName(["Shower Head", "shower head", "shower", "shower heads"])

  // Helper functions
  const getToiletColumnInfo = (item: InstallationData): { installed: boolean; columnName: string | null } => {
    const toiletColumn = Object.keys(item).find((key) => key.startsWith("Toilets Installed:"))
    if (toiletColumn && item[toiletColumn] && item[toiletColumn] !== "") {
      return { installed: true, columnName: toiletColumn }
    }
    return { installed: false, columnName: null }
  }

  const hasToiletInstalled = (item: InstallationData): boolean => {
    return getToiletColumnInfo(item).installed
  }

  // Use the same unified notes system as the Notes page
  const getNotesForUnit = (unitValue: string): string => {
    try {
      // Load selected cells and columns from localStorage (from CSV preview)
      let selectedCells: Record<string, string[]> = {}
      let selectedNotesColumns: string[] = []

      const storedSelectedCells = localStorage.getItem("selectedCells")
      const storedSelectedNotesColumns = localStorage.getItem("selectedNotesColumns")

      if (storedSelectedCells) {
        selectedCells = JSON.parse(storedSelectedCells)
      }

      if (storedSelectedNotesColumns) {
        selectedNotesColumns = JSON.parse(storedSelectedNotesColumns)
      }

      // Use unified notes system to get notes for this unit
      const unifiedNotes = getUnifiedNotes({
        installationData,
        unitColumn: unitColumn || "Unit",
        selectedCells,
        selectedNotesColumns,
      })

      // Find the note for this specific unit
      const unitNote = unifiedNotes.find(note => note.unit === unitValue)
      return unitNote ? unitNote.note : ""
    } catch (error) {
      console.error("Error getting unified notes for unit:", unitValue, error)
      return ""
    }
  }

  const unitColumn = findUnitColumn(installationData)
  const allData = [...installationData, ...additionalRows]

  const filteredData = (() => {
    const result = []

    for (let i = 0; i < allData.length; i++) {
      const item = allData[i]
      const unitValue = unitColumn ? item[unitColumn] : item.Unit

      if (!unitValue || String(unitValue).trim() === "") continue

      result.push(item)
    }

    // Group installations by unit and read quantities from specific Excel columns
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
        originalItem: InstallationData
      }
    > = {}

    // Helper function to find specific quantity columns
    const findSpecificColumns = () => {
      if (!result.length) return {}

      const firstItem = result[0]
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

      console.log("Found specific columns:", columns)
      return columns
    }

    const specificColumns = findSpecificColumns()

    // Process each row and consolidate by unit
    for (const item of result) {
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
          originalItem: item,
        }
      }

      console.log(`Processing Unit ${unitKey}:`)

      // Kitchen: Always 1 if kitchen aerator column has data
      if (specificColumns.kitchenAerator && item[specificColumns.kitchenAerator]) {
        const kitchenValue = String(item[specificColumns.kitchenAerator]).trim()
        if (kitchenValue && kitchenValue !== "" && kitchenValue !== "0") {
          consolidatedData[unitKey].kitchenQuantity = 1
          console.log(`Kitchen quantity for ${unitKey}: 1 (has data: ${kitchenValue})`)
        }
      }

      // Bathroom: Count guest + master columns (each counts as 1 if has data)
      let bathroomCount = 0
      if (specificColumns.bathroomAeratorGuest && item[specificColumns.bathroomAeratorGuest]) {
        const guestValue = String(item[specificColumns.bathroomAeratorGuest]).trim()
        if (guestValue && guestValue !== "" && guestValue !== "0") {
          bathroomCount += 1
          console.log(`Bathroom Guest for ${unitKey}: +1 (has data: ${guestValue})`)
        }
      }
      if (specificColumns.bathroomAeratorMaster && item[specificColumns.bathroomAeratorMaster]) {
        const masterValue = String(item[specificColumns.bathroomAeratorMaster]).trim()
        if (masterValue && masterValue !== "" && masterValue !== "0") {
          bathroomCount += 1
          console.log(`Bathroom Master for ${unitKey}: +1 (has data: ${masterValue})`)
        }
      }
      consolidatedData[unitKey].bathroomQuantity = bathroomCount

      // Shower: Read actual quantities from both columns
      if (specificColumns.adaShowerHead && item[specificColumns.adaShowerHead]) {
        const adaQuantity = Number.parseInt(String(item[specificColumns.adaShowerHead])) || 0
        consolidatedData[unitKey].showerADAQuantity = adaQuantity
        console.log(`ADA Shower quantity for ${unitKey}: ${adaQuantity}`)
      }
      if (specificColumns.regularShowerHead && item[specificColumns.regularShowerHead]) {
        const regularQuantity = Number.parseInt(String(item[specificColumns.regularShowerHead])) || 0
        consolidatedData[unitKey].showerRegularQuantity = regularQuantity
        console.log(`Regular Shower quantity for ${unitKey}: ${regularQuantity}`)
      }

      // Toilet: Read direct quantity from toilets installed column
      if (specificColumns.toiletInstalled && item[specificColumns.toiletInstalled]) {
        const toiletQuantity = Number.parseInt(String(item[specificColumns.toiletInstalled])) || 0
        consolidatedData[unitKey].toiletQuantity = toiletQuantity
        console.log(`Toilet quantity for ${unitKey}: ${toiletQuantity}`)
      }

      // Get notes using the unified notes system (same as Notes page)
      const unitNotes = getNotesForUnit(unitKey)
      if (unitNotes && unitNotes.trim()) {
        consolidatedData[unitKey].notes.push(unitNotes.trim())
      }
    }

    // Convert back to array format with new quantity data
    const consolidatedResult = Object.values(consolidatedData).map((unitData) => {
      // Create a new item with quantity information
      const consolidatedItem = { ...unitData.originalItem }

      // Store quantities in the item for later use
      consolidatedItem._kitchenQuantity = unitData.kitchenQuantity
      consolidatedItem._bathroomQuantity = unitData.bathroomQuantity
      consolidatedItem._showerADAQuantity = unitData.showerADAQuantity
      consolidatedItem._showerRegularQuantity = unitData.showerRegularQuantity
      consolidatedItem._toiletQuantity = unitData.toiletQuantity
      consolidatedItem._consolidatedNotes = [...new Set(unitData.notes)].join(" ")

      return consolidatedItem
    })

    return consolidatedResult.sort((a, b) => {
      const unitA = unitColumn ? a[unitColumn] : a.Unit
      const unitB = unitColumn ? b[unitColumn] : b.Unit

      const numA = Number.parseInt(String(unitA))
      const numB = Number.parseInt(String(unitB))

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }

      return String(unitA).localeCompare(String(unitB), undefined, { numeric: true, sensitivity: "base" })
    })
  })()

  // Check what columns to show
  const hasKitchenAerators = filteredData.some((item) => item._kitchenQuantity > 0)
  const hasBathroomAerators = filteredData.some((item) => item._bathroomQuantity > 0)
  const hasShowers = filteredData.some((item) => item._showerADAQuantity > 0 || item._showerRegularQuantity > 0)
  const hasToilets = filteredData.some((item) => item._toiletQuantity > 0)
  const hasNotes = true

  // Load CSV preview data from localStorage and listen for unified notes updates
  useEffect(() => {
    try {
      // Load selected cells from CSV preview
      const selectedCellsData = localStorage.getItem("selectedCells")
      if (selectedCellsData) {
        const selectedCells = JSON.parse(selectedCellsData)
        console.log("Details: Loaded CSV preview selected cells:", selectedCells)
      }
      
      // Load selected notes columns from CSV preview
      const selectedNotesColumnsData = localStorage.getItem("selectedNotesColumns")
      if (selectedNotesColumnsData) {
        const selectedNotesColumns = JSON.parse(selectedNotesColumnsData)
        console.log("Details: Loaded CSV preview selected columns:", selectedNotesColumns)
      }
    } catch (error) {
      console.error("Details: Error loading CSV preview data:", error)
    }
  }, [])

  // Listen for unified notes updates (same as Notes page)
  useEffect(() => {
    const handleNotesUpdate = () => {
      console.log("Details: Received unified notes update event")
      // Force re-render when unified notes are updated
      setEditedNotes({ ...editedNotes })
    }

    window.addEventListener("unifiedNotesUpdated", handleNotesUpdate)
    return () => window.removeEventListener("unifiedNotesUpdated", handleNotesUpdate)
  }, [editedNotes])

  // Event handlers
  const handleNoteEdit = (unit: string, value: string) => {
    if (isEditable) {
      updateStoredNote(unit, value)
      setEditedNotes((prev) => ({
        ...prev,
        [unit]: value,
      }))
    }
  }

  const handleInstallationEdit = (unit: string, type: string, value: string) => {
    if (isEditable) {
      setEditedInstallations((prev) => ({
        ...prev,
        [unit]: {
          ...prev[unit],
          [type]: value,
        },
      }))
    }
  }

  const handleUnitEdit = (originalUnit: string, newUnit: string) => {
    if (isEditable) {
      setEditedUnits((prev) => ({
        ...prev,
        [originalUnit]: newUnit,
      }))
    }
  }

  const handleColumnHeaderChange = (column: string, value: string) => {
    if (isEditable) {
      setColumnHeaders((prev) => ({
        ...prev,
        [column]: value,
      }))
    }
  }

  const handleSectionTitleChange = (value: string) => {
    if (isEditable && setSectionTitles) {
      setSectionTitles((prev) => ({
        ...prev,
        detailsTitle: value,
      }))
    }
  }

  const addNewRow = () => {
    const newRow: InstallationData = {
      Unit: `New-${additionalRows.length + 1}`,
      "Shower Head": "",
      "Bathroom aerator": "",
      "Kitchen Aerator": "",
      "Leak Issue Kitchen Faucet": "",
      "Leak Issue Bath Faucet": "",
      "Tub Spout/Diverter Leak Issue": "",
      Notes: "",
    }
    setAdditionalRows((prev) => [...prev, newRow])
  }

  const removeRow = (unitToRemove: string) => {
    setAdditionalRows((prev) => prev.filter((row) => row.Unit !== unitToRemove))
  }

  // Load stored notes on component mount
  useEffect(() => {
    const storedNotes = getStoredNotes()
    setEditedNotes(storedNotes)
  }, [])

  if (!installationData || installationData.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No installation data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">
          {isEditable ? (
            <EditableText
              value={sectionTitles?.detailsTitle || "Detailed Unit Information"}
              onChange={handleSectionTitleChange}
              placeholder="Section Title"
            />
          ) : (
            sectionTitles?.detailsTitle || "Detailed Unit Information"
          )}
        </h2>
      </div>

      {/* Preview Mode - Single Table */}
      {isPreview && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-2 border-b">
                  {isEditable ? (
                    <EditableText
                      value={columnHeaders.unit}
                      onChange={(value) => handleColumnHeaderChange("unit", value)}
                      placeholder="Unit"
                    />
                  ) : (
                    columnHeaders.unit
                  )}
                </th>
                {hasKitchenAerators && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={columnHeaders.kitchen}
                        onChange={(value) => handleColumnHeaderChange("kitchen", value)}
                        placeholder="Kitchen"
                      />
                    ) : (
                      columnHeaders.kitchen
                    )}
                  </th>
                )}
                {hasBathroomAerators && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={columnHeaders.bathroom}
                        onChange={(value) => handleColumnHeaderChange("bathroom", value)}
                        placeholder="Bathroom"
                      />
                    ) : (
                      columnHeaders.bathroom
                    )}
                  </th>
                )}
                {hasShowers && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={columnHeaders.shower}
                        onChange={(value) => handleColumnHeaderChange("shower", value)}
                        placeholder="Shower"
                      />
                    ) : (
                      columnHeaders.shower
                    )}
                  </th>
                )}
                {hasToilets && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={columnHeaders.toilet}
                        onChange={(value) => handleColumnHeaderChange("toilet", value)}
                        placeholder="Toilet"
                      />
                    ) : (
                      columnHeaders.toilet
                    )}
                  </th>
                )}
                {hasNotes && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={columnHeaders.notes}
                        onChange={(value) => handleColumnHeaderChange("notes", value)}
                        placeholder="Notes"
                      />
                    ) : (
                      columnHeaders.notes
                    )}
                  </th>
                )}
                {isEditable && <th className="text-left py-2 px-2 border-b">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                const unitValue = unitColumn ? item[unitColumn] : item.Unit
                const isAdditionalRow = additionalRows.some(
                  (row) => (unitColumn ? row[unitColumn] : row.Unit) === unitValue,
                )

                const kitchenAerator = (() => {
                  if (unitValue !== undefined && editedInstallations[unitValue]?.kitchen !== undefined) {
                    return editedInstallations[unitValue]!.kitchen
                  }
                  return item._kitchenQuantity > 0 ? "1.0 GPM (1)" : "No Touch."
                })()

                const bathroomAerator = (() => {
                  if (unitValue !== undefined && editedInstallations[unitValue]?.bathroom !== undefined) {
                    return editedInstallations[unitValue]!.bathroom
                  }
                  if (item._bathroomQuantity > 0) {
                    return `1.0 GPM (${item._bathroomQuantity})`
                  }
                  return "No Touch."
                })()

                const shower = (() => {
                  if (unitValue !== undefined && editedInstallations[unitValue]?.shower !== undefined) {
                    return editedInstallations[unitValue]!.shower
                  }

                  const parts = []
                  if (item._showerRegularQuantity > 0) {
                    parts.push(`1.75 GPM (${item._showerRegularQuantity})`)
                  }
                  if (item._showerADAQuantity > 0) {
                    parts.push(`1.5 GPM (${item._showerADAQuantity})`)
                  }

                  return parts.length > 0 ? parts.join("; ") : "No Touch."
                })()

                const toilet = (() => {
                  if (unitValue !== undefined && editedInstallations[unitValue]?.toilet !== undefined) {
                    return editedInstallations[unitValue]!.toilet
                  }
                  return item._toiletQuantity > 0 ? `0.8 GPF (${item._toiletQuantity})` : ""
                })()

                return (
                  <tr key={index}>
                    <td className="py-2 px-2 border-b">
                      {isEditable ? (
                        <EditableText
                          value={
                            editedUnits[unitValue ?? ""] !== undefined
                              ? editedUnits[unitValue ?? ""]
                              : (unitValue ?? "")
                          }
                          onChange={(value) => handleUnitEdit(unitValue ?? "", value)}
                          placeholder="Unit number"
                        />
                      ) : editedUnits[unitValue ?? ""] !== undefined ? (
                        editedUnits[unitValue ?? ""]
                      ) : (
                        (unitValue ?? "")
                      )}
                    </td>
                    {hasKitchenAerators && (
                      <td className="py-2 px-2 border-b text-center">
                        {isEditable ? (
                          <EditableText
                            value={
                              unitValue !== undefined && editedInstallations[unitValue]?.kitchen !== undefined
                                ? editedInstallations[unitValue]!.kitchen
                                : kitchenAerator
                            }
                            onChange={(value) => handleInstallationEdit(unitValue ?? "", "kitchen", value)}
                            placeholder="Kitchen installation"
                          />
                        ) : unitValue !== undefined && editedInstallations[unitValue]?.kitchen !== undefined ? (
                          editedInstallations[unitValue]!.kitchen
                        ) : (
                          kitchenAerator
                        )}
                      </td>
                    )}
                    {hasBathroomAerators && (
                      <td className="py-2 px-2 border-b text-center">
                        {isEditable ? (
                          <EditableText
                            value={
                              unitValue !== undefined && editedInstallations[unitValue]?.bathroom !== undefined
                                ? editedInstallations[unitValue]!.bathroom
                                : bathroomAerator
                            }
                            onChange={(value) => handleInstallationEdit(unitValue ?? "", "bathroom", value)}
                            placeholder="Bathroom installation"
                          />
                        ) : unitValue !== undefined && editedInstallations[unitValue]?.bathroom !== undefined ? (
                          editedInstallations[unitValue]!.bathroom
                        ) : (
                          bathroomAerator
                        )}
                      </td>
                    )}
                    {hasShowers && (
                      <td className="py-2 px-2 border-b text-center">
                        {isEditable ? (
                          <EditableText
                            value={
                              unitValue !== undefined && editedInstallations[unitValue]?.shower !== undefined
                                ? editedInstallations[unitValue]!.shower
                                : shower
                            }
                            onChange={(value) => handleInstallationEdit(unitValue ?? "", "shower", value)}
                            placeholder="Shower installation"
                          />
                        ) : unitValue !== undefined && editedInstallations[unitValue]?.shower !== undefined ? (
                          editedInstallations[unitValue]!.shower
                        ) : (
                          shower
                        )}
                      </td>
                    )}
                    {hasToilets && (
                      <td className="py-2 px-2 border-b text-center">
                        {isEditable ? (
                          <EditableText
                            value={
                              unitValue !== undefined && editedInstallations[unitValue]?.toilet !== undefined
                                ? editedInstallations[unitValue]!.toilet
                                : toilet
                            }
                            onChange={(value) => handleInstallationEdit(unitValue ?? "", "toilet", value)}
                            placeholder="Toilet installation"
                          />
                        ) : unitValue !== undefined && editedInstallations[unitValue]?.toilet !== undefined ? (
                          editedInstallations[unitValue]!.toilet
                        ) : (
                          toilet
                        )}
                      </td>
                    )}
                    {hasNotes && (
                      <td className="py-2 px-2 border-b">
                        {isEditable ? (
                          <EditableText
                            value={
                              editedNotes[unitValue ?? ""] !== undefined
                                ? editedNotes[unitValue ?? ""]
                                : getNotesForUnit(unitValue ?? "")
                            }
                            onChange={(value) => handleNoteEdit(unitValue ?? "", value)}
                            placeholder="Notes"
                          />
                        ) : editedNotes[unitValue ?? ""] !== undefined ? (
                          editedNotes[unitValue ?? ""]
                        ) : (
                          <div>
                            {getNotesForUnit(unitValue ?? "")}
                            <div className="text-xs text-green-600 mt-1">
                              📊 Unified notes system (same as Notes page)
                            </div>
                          </div>
                        )}
                      </td>
                    )}
                    {isEditable && (
                      <td className="py-2 px-2 border-b">
                        {isAdditionalRow && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRow(unitValue ?? "")}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {isEditable && (
            <div className="mt-4">
              <Button onClick={addNewRow} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Print Mode - Multiple Pages */}
      {!isPreview && (
        <div className="space-y-8">
          {filteredData.map((item, index) => (
            <div key={index} className="page-break-before">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-2 border-b">{columnHeaders.unit}</th>
                    {hasKitchenAerators && <th className="text-left py-2 px-2 border-b">{columnHeaders.kitchen}</th>}
                    {hasBathroomAerators && <th className="text-left py-2 px-2 border-b">{columnHeaders.bathroom}</th>}
                    {hasShowers && <th className="text-left py-2 px-2 border-b">{columnHeaders.shower}</th>}
                    {hasToilets && <th className="text-left py-2 px-2 border-b">{columnHeaders.toilet}</th>}
                    {hasNotes && <th className="text-left py-2 px-2 border-b">{columnHeaders.notes}</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr key={index}>
                    <td className="py-2 px-2 border-b">{unitColumn ? item[unitColumn] : item.Unit}</td>
                    {hasKitchenAerators && (
                      <td className="py-2 px-2 border-b text-center">
                        {(() => {
                          if (unitColumn && editedInstallations[item[unitColumn] ?? ""]?.kitchen !== undefined) {
                            return editedInstallations[item[unitColumn] ?? ""]!.kitchen
                          }
                          return item._kitchenQuantity > 0 ? "1.0 GPM (1)" : "No Touch."
                        })()}
                      </td>
                    )}
                    {hasBathroomAerators && (
                      <td className="py-2 px-2 border-b text-center">
                        {(() => {
                          if (unitColumn && editedInstallations[item[unitColumn] ?? ""]?.bathroom !== undefined) {
                            return editedInstallations[item[unitColumn] ?? ""]!.bathroom
                          }
                          if (item._bathroomQuantity > 0) {
                            return `1.0 GPM (${item._bathroomQuantity})`
                          }
                          return "No Touch."
                        })()}
                      </td>
                    )}
                    {hasShowers && (
                      <td className="py-2 px-2 border-b text-center">
                        {(() => {
                          if (unitColumn && editedInstallations[item[unitColumn] ?? ""]?.shower !== undefined) {
                            return editedInstallations[item[unitColumn] ?? ""]!.shower
                          }

                          const parts = []
                          if (item._showerRegularQuantity > 0) {
                            parts.push(`1.75 GPM (${item._showerRegularQuantity})`)
                          }
                          if (item._showerADAQuantity > 0) {
                            parts.push(`1.5 GPM (${item._showerADAQuantity})`)
                          }

                          return parts.length > 0 ? parts.join("; ") : "No Touch."
                        })()}
                      </td>
                    )}
                    {hasToilets && (
                      <td className="py-2 px-2 border-b text-center">
                        {(() => {
                          if (unitColumn && editedInstallations[item[unitColumn] ?? ""]?.toilet !== undefined) {
                            return editedInstallations[item[unitColumn] ?? ""]!.toilet
                          }
                          return item._toiletQuantity > 0 ? `0.8 GPF (${item._toiletQuantity})` : ""
                        })()}
                      </td>
                    )}
                    {hasNotes && (
                      <td className="py-2 px-2 border-b">
                        {editedNotes[item.Unit ?? ""] !== undefined
                          ? editedNotes[item.Unit ?? ""]
                          : (
                            <div>
                              {getNotesForUnit(item.Unit ?? "")}
                              <div className="text-xs text-green-600 mt-1">
                                📊 Unified notes system (same as Notes page)
                              </div>
                            </div>
                          )}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

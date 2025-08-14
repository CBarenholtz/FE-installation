"use client"
import { useState, useEffect } from "react"
import EditableText from "@/components/editable-text"
import { getAeratorDescription, formatNote } from "@/lib/utils/aerator-helpers"
import { useReportContext } from "@/lib/report-context"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { getFinalNoteForUnit, updateStoredNote, getStoredNotes } from "@/lib/notes"

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

  const compileNotesForUnit = (item: InstallationData, includeNotAccessed = true): string => {
    let notes = ""

    if (item["Leak Issue Kitchen Faucet"]) notes += "Dripping from kitchen faucet. "
    if (item["Leak Issue Bath Faucet"]) notes += "Dripping from bathroom faucet. "
    if (item["Tub Spout/Diverter Leak Issue"] === "Light") notes += "Light leak from tub spout/ diverter. "
    if (item["Tub Spout/Diverter Leak Issue"] === "Moderate") notes += "Moderate leak from tub spout/diverter. "
    if (item["Tub Spout/Diverter Leak Issue"] === "Heavy") notes += "Heavy leak from tub spout/ diverter. "

    if (item.Notes && item.Notes.trim() !== "") {
      notes += item.Notes + " "
    }

    return formatNote(notes.trim())
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

    // Group installations by unit and sum quantities
    const consolidatedData: Record<
      string,
      {
        unit: string
        kitchenCount: number
        bathroomCount: number
        showerCount: number
        toiletCount: number
        notes: string[]
        originalItem: InstallationData
      }
    > = {}

    // Process each row and consolidate by unit
    for (const item of result) {
      const unitValue = unitColumn ? item[unitColumn] : item.Unit
      const unitKey = String(unitValue || "").trim()

      if (!unitKey) continue

      // Initialize unit data if not exists
      if (!consolidatedData[unitKey]) {
        consolidatedData[unitKey] = {
          unit: unitKey,
          kitchenCount: 0,
          bathroomCount: 0,
          showerCount: 0,
          toiletCount: 0,
          notes: [],
          originalItem: item,
        }
      }

      if (
        kitchenAeratorColumn &&
        item[kitchenAeratorColumn] &&
        item[kitchenAeratorColumn] !== "" &&
        item[kitchenAeratorColumn] !== "0"
      ) {
        const quantity = Number.parseInt(item[kitchenAeratorColumn]) || 1
        consolidatedData[unitKey].kitchenCount += quantity
      }
      if (
        bathroomAeratorColumn &&
        item[bathroomAeratorColumn] &&
        item[bathroomAeratorColumn] !== "" &&
        item[bathroomAeratorColumn] !== "0"
      ) {
        const quantity = Number.parseInt(item[bathroomAeratorColumn]) || 1
        consolidatedData[unitKey].bathroomCount += quantity
      }
      if (getShowerValue(item) !== "No Touch.") {
        // For showers, try to parse quantity from the shower columns
        const showerColumns = findAllShowerColumns()
        let showerQuantity = 0
        for (const column of showerColumns) {
          const value = item[column]
          if (value && String(value).trim() !== "" && String(value).trim() !== "0") {
            showerQuantity += Number.parseInt(String(value)) || 1
          }
        }
        consolidatedData[unitKey].showerCount += showerQuantity || 1
      }
      if (hasToiletInstalled(item)) {
        // For toilets, try to parse quantity from toilet columns
        const toiletInfo = getToiletColumnInfo(item)
        if (toiletInfo.installed && toiletInfo.columnName) {
          const quantity = Number.parseInt(item[toiletInfo.columnName] || "1") || 1
          consolidatedData[unitKey].toiletCount += quantity
        } else {
          consolidatedData[unitKey].toiletCount += 1
        }
      }

      // Collect notes
      const compiledNotes = compileNotesForUnit(item, true)
      if (compiledNotes && compiledNotes.trim()) {
        consolidatedData[unitKey].notes.push(compiledNotes.trim())
      }
    }

    // Convert back to array format with consolidated data
    const consolidatedResult = Object.values(consolidatedData).map((unitData) => {
      // Create a new item with consolidated information
      const consolidatedItem = { ...unitData.originalItem }

      // Store summed quantities in the item for later use
      consolidatedItem._kitchenCount = unitData.kitchenCount
      consolidatedItem._bathroomCount = unitData.bathroomCount
      consolidatedItem._showerCount = unitData.showerCount
      consolidatedItem._toiletCount = unitData.toiletCount
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

  // Split data into pages
  const itemsPerPage = 10
  const dataPages = []
  for (let i = 0; i < filteredData.length; i += itemsPerPage) {
    dataPages.push(filteredData.slice(i, i + itemsPerPage))
  }

  // Check what columns to show
  const hasKitchenAerators =
    kitchenAeratorColumn &&
    filteredData.some((item) => {
      const value = item[kitchenAeratorColumn]
      return value !== undefined && value !== null && value !== "" && value.trim() !== ""
    })

  const hasBathroomAerators =
    bathroomAeratorColumn &&
    filteredData.some((item) => {
      const value = item[bathroomAeratorColumn]
      return value !== undefined && value !== null && value !== "" && value.trim() !== ""
    })

  const hasShowers = filteredData.some((item) => {
    const showerValue =
      item._showerCount > 0 ? getAeratorDescription(item._showerCount.toString(), "shower") : getShowerValue(item)
    return showerValue !== "No Touch."
  })

  const hasToilets = filteredData.some((item) => item._toiletCount > 0)
  const hasNotes = true

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

                const kitchenAerator = kitchenAeratorColumn
                  ? // Check if original Excel data has quantity first, then use consolidation count as fallback
                    item[kitchenAeratorColumn] &&
                    item[kitchenAeratorColumn] !== "" &&
                    item[kitchenAeratorColumn] !== "0"
                    ? getAeratorDescription(item[kitchenAeratorColumn] ?? "", "kitchen")
                    : item._kitchenCount > 0
                      ? getAeratorDescription(item._kitchenCount.toString(), "kitchen")
                      : "No Touch."
                  : ""
                const bathroomAerator = bathroomAeratorColumn
                  ? // Check if original Excel data has quantity first, then use consolidation count as fallback
                    item[bathroomAeratorColumn] &&
                    item[bathroomAeratorColumn] !== "" &&
                    item[bathroomAeratorColumn] !== "0"
                    ? getAeratorDescription(item[bathroomAeratorColumn] ?? "", "bathroom")
                    : item._bathroomCount > 0
                      ? getAeratorDescription(item._bathroomCount.toString(), "bathroom")
                      : "No Touch."
                  : ""
                const shower = (() => {
                  const originalShowerValue = getShowerValue(item)
                  if (originalShowerValue !== "No Touch.") {
                    return originalShowerValue
                  }
                  // Use consolidation count as fallback
                  return item._showerCount > 0
                    ? getAeratorDescription(item._showerCount.toString(), "shower")
                    : "No Touch."
                })()
                const toilet = hasToiletInstalled(item) ? "0.8 GPF" : ""

                const compiledNotes = item._consolidatedNotes || compileNotesForUnit(item, true)
                const finalNote = getFinalNoteForUnit(unitValue ?? "", compiledNotes)

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
                              editedNotes[unitValue ?? ""] !== undefined ? editedNotes[unitValue ?? ""] : finalNote
                            }
                            onChange={(value) => handleNoteEdit(unitValue ?? "", value)}
                            placeholder="Notes"
                          />
                        ) : editedNotes[unitValue ?? ""] !== undefined ? (
                          editedNotes[unitValue ?? ""]
                        ) : (
                          finalNote
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
          {dataPages.map((pageData, pageIndex) => (
            <div key={pageIndex} className="page-break-before">
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
                  {pageData.map((item, index) => {
                    const unitValue = unitColumn ? item[unitColumn] : item.Unit

                    const kitchenAerator = kitchenAeratorColumn
                      ? // Check if original Excel data has quantity first, then use consolidation count as fallback
                        item[kitchenAeratorColumn] &&
                        item[kitchenAeratorColumn] !== "" &&
                        item[kitchenAeratorColumn] !== "0"
                        ? getAeratorDescription(item[kitchenAeratorColumn] ?? "", "kitchen")
                        : item._kitchenCount > 0
                          ? getAeratorDescription(item._kitchenCount.toString(), "kitchen")
                          : "No Touch."
                      : ""
                    const bathroomAerator = bathroomAeratorColumn
                      ? // Check if original Excel data has quantity first, then use consolidation count as fallback
                        item[bathroomAeratorColumn] &&
                        item[bathroomAeratorColumn] !== "" &&
                        item[bathroomAeratorColumn] !== "0"
                        ? getAeratorDescription(item[bathroomAeratorColumn] ?? "", "bathroom")
                        : item._bathroomCount > 0
                          ? getAeratorDescription(item._bathroomCount.toString(), "bathroom")
                          : "No Touch."
                      : ""
                    const shower = (() => {
                      const originalShowerValue = getShowerValue(item)
                      if (originalShowerValue !== "No Touch.") {
                        return originalShowerValue
                      }
                      // Use consolidation count as fallback
                      return item._showerCount > 0
                        ? getAeratorDescription(item._showerCount.toString(), "shower")
                        : "No Touch."
                    })()
                    const toilet = hasToiletInstalled(item) ? "0.8 GPF" : ""

                    const compiledNotes = item._consolidatedNotes || compileNotesForUnit(item, true)
                    const finalNote = getFinalNoteForUnit(unitValue ?? "", compiledNotes)

                    return (
                      <tr key={index}>
                        <td className="py-2 px-2 border-b">
                          {unitValue !== undefined && editedUnits[unitValue] !== undefined
                            ? editedUnits[unitValue]
                            : unitValue}
                        </td>
                        {hasKitchenAerators && (
                          <td className="py-2 px-2 border-b text-center">
                            {unitValue !== undefined && editedInstallations[unitValue]?.kitchen !== undefined
                              ? editedInstallations[unitValue]!.kitchen
                              : kitchenAerator}
                          </td>
                        )}
                        {hasBathroomAerators && (
                          <td className="py-2 px-2 border-b text-center">
                            {unitValue !== undefined && editedInstallations[unitValue]?.bathroom !== undefined
                              ? editedInstallations[unitValue]!.bathroom
                              : bathroomAerator}
                          </td>
                        )}
                        {hasShowers && (
                          <td className="py-2 px-2 border-b text-center">
                            {unitValue !== undefined && editedInstallations[unitValue]?.shower !== undefined
                              ? editedInstallations[unitValue]!.shower
                              : shower}
                          </td>
                        )}
                        {hasToilets && (
                          <td className="py-2 px-2 border-b text-center">
                            {unitValue !== undefined && editedInstallations[unitValue]?.toilet !== undefined
                              ? editedInstallations[unitValue]!.toilet
                              : toilet}
                          </td>
                        )}
                        {hasNotes && (
                          <td className="py-2 px-2 border-b">
                            {editedNotes[unitValue ?? ""] !== undefined ? editedNotes[unitValue ?? ""] : finalNote}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

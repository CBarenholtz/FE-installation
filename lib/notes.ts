import type { InstallationData } from "./types"

// Compile notes for all units, including selected cells and columns
export function compileAllNotes({
  installationData,
  unitColumn,
  selectedCells = {},
  selectedNotesColumns = [],
}: {
  installationData: InstallationData[]
  unitColumn: string
  selectedCells?: Record<string, string[]>
  selectedNotesColumns?: string[]
}): Array<{ unit: string; note: string; [key: string]: any }> {
  return installationData.map((item) => {
    let notes = ""
    // Leak issues (same as before)
    if (item["Leak Issue Kitchen Faucet"]) {
      const leakValue = item["Leak Issue Kitchen Faucet"].trim().toLowerCase()
      if (leakValue === "light") notes += "Light leak from kitchen faucet. "
      else if (leakValue === "moderate") notes += "Moderate leak from kitchen faucet. "
      else if (leakValue === "heavy") notes += "Heavy leak from kitchen faucet. "
      else if (leakValue === "dripping" || leakValue === "driping") notes += "Dripping from kitchen faucet. "
      else notes += "Leak from kitchen faucet. "
    }
    if (item["Leak Issue Bath Faucet"]) {
      const leakValue = item["Leak Issue Bath Faucet"].trim().toLowerCase()
      if (leakValue === "light") notes += "Light leak from bathroom faucet. "
      else if (leakValue === "moderate") notes += "Moderate leak from bathroom faucet. "
      else if (leakValue === "heavy") notes += "Heavy leak from bathroom faucet. "
      else if (leakValue === "dripping" || leakValue === "driping") notes += "Dripping from bathroom faucet. "
      else notes += "Leak from bathroom faucet. "
    }
    if (item["Tub Spout/Diverter Leak Issue"]) {
      const leakValue = item["Tub Spout/Diverter Leak Issue"]
      if (leakValue === "Light") notes += "Light leak from tub spout/diverter. "
      else if (leakValue === "Moderate") notes += "Moderate leak from tub spout/diverter. "
      else if (leakValue === "Heavy") notes += "Heavy leak from tub spout/diverter. "
      else notes += "Leak from tub spout/diverter. "
    }
    // Add notes from selected columns
    if (selectedNotesColumns && selectedNotesColumns.length > 0) {
      selectedNotesColumns.forEach((col) => {
        const val = item[col]
        if (val && val.trim() !== "") notes += `${val}. `
      })
    }
    // Add notes from selected cells
    const unitValue = item[unitColumn] || item.Unit
    if (unitValue && selectedCells[unitValue]) {
      selectedCells[unitValue].forEach((cellInfo) => {
        notes += `${cellInfo}. `
      })
    }
    return {
      unit: unitValue,
      note: notes.trim(),
      ...item,
    }
  })
}

// Unified notes management functions

// --- Notes Storage ---
export function getStoredNotes(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem("unitNotes")
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error("Error parsing stored notes:", error)
    return {}
  }
}

export function saveStoredNotes(notes: Record<string, string>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("unitNotes", JSON.stringify(notes))
    window.dispatchEvent(new Event("unitNotesUpdated"))
  } catch (error) {
    console.error("Error saving notes:", error)
  }
}

export function updateStoredNote(unit: string, note: string): void {
  const existingNotes = getStoredNotes()
  const updatedNotes = { ...existingNotes, [unit]: note }
  saveStoredNotes(updatedNotes)
}

// --- Details Storage ---
export function getStoredDetails(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem("unitDetails")
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error("Error parsing stored details:", error)
    return {}
  }
}

export function saveStoredDetails(details: Record<string, string>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("unitDetails", JSON.stringify(details))
    window.dispatchEvent(new Event("unitDetailsUpdated"))
  } catch (error) {
    console.error("Error saving details:", error)
  }
}

export function updateStoredDetail(unit: string, detail: string): void {
  const existingDetails = getStoredDetails()
  const updatedDetails = { ...existingDetails, [unit]: detail }
  saveStoredDetails(updatedDetails)
}


// Returns both notes and details for each unit, starting off the same but independently editable
export function getNotesAndDetails({
  installationData,
  unitColumn,
  selectedCells = {},
  selectedNotesColumns = [],
}: {
  installationData: InstallationData[]
  unitColumn: string
  selectedCells?: Record<string, string[]>
  selectedNotesColumns?: string[]
}): Array<{ unit: string; note: string; detail: string; [key: string]: any }> {
  // Get compiled notes from installation data
  const compiledNotes = compileAllNotes({
    installationData,
    unitColumn,
    selectedCells,
    selectedNotesColumns,
  })

  // Get manually edited notes and details from localStorage
  const storedNotes = getStoredNotes()
  const storedDetails = getStoredDetails()

  // Merge compiled notes with manual edits for both notes and details
  return compiledNotes.map((item) => ({
    ...item,
    note: storedNotes[item.unit] !== undefined ? storedNotes[item.unit] : item.note,
    detail: storedDetails[item.unit] !== undefined ? storedDetails[item.unit] : item.note,
  }))
}


export function getFinalNoteForUnit(unit: string, compiledNote: string): string {
  const storedNotes = getStoredNotes()
  return storedNotes[unit] !== undefined ? storedNotes[unit] : compiledNote
}

export function getFinalDetailForUnit(unit: string, compiledNote: string): string {
  const storedDetails = getStoredDetails()
  return storedDetails[unit] !== undefined ? storedDetails[unit] : compiledNote
}

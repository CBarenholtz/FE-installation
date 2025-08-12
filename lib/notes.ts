export function getFinalNoteForUnit(unit: string, compiledNotes: string): string {
  // Get stored notes from unified notes system
  const storedNotes = getStoredNotes()
  const storedNote = storedNotes[unit] || ""

  // If there's a stored note, use it; otherwise use compiled notes
  return storedNote || compiledNotes
}

export function updateStoredNote(unit: string, note: string): void {
  const storedNotes = getStoredNotes()
  storedNotes[unit] = note

  if (typeof window !== "undefined") {
    localStorage.setItem("unifiedNotes", JSON.stringify(storedNotes))
  }
}

export function getStoredNotes(): Record<string, string> {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem("unifiedNotes")
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

import type { ImageData, ProcessedImage, InstallationData, Note } from "@/lib/types"
import { getUnifiedNotes } from "@/lib/notes"

// Enhanced keyword matching for different types of issues
const ISSUE_KEYWORDS = {
  kitchen: {
    keywords: ["kitchen", "sink", "faucet", "tap", "counter"],
    leakTypes: ["dripping", "leak", "water", "wet"],
  },
  bathroom: {
    keywords: ["bathroom", "bath", "sink", "faucet", "tap", "vanity"],
    leakTypes: ["dripping", "leak", "water", "wet"],
  },
  shower: {
    keywords: ["shower", "tub", "spout", "diverter", "head", "valve"],
    leakTypes: ["leak", "dripping", "water", "spray"],
  },
  general: {
    keywords: ["pipe", "plumbing", "water", "damage", "stain", "ceiling", "wall", "floor"],
    leakTypes: ["leak", "dripping", "water", "wet", "damage"],
  },
}

// Enhanced image matching with better keyword analysis and confidence scoring
export function matchImageWithNotes(
  image: ImageData,
  installationData: InstallationData[],
  notes: Note[],
): ProcessedImage {
  const unitData = installationData.find((data) => data.Unit === image.unit)
  const unitNotes = notes.filter((note) => note.unit === image.unit)

  const matchedNotes: string[] = []
  let suggestedCaption = image.caption || ""
  let confidence = 0

  // Analyze image filename and existing caption for keywords
  const imageText = `${image.filename} ${image.caption}`.toLowerCase()
  const imageWords = imageText.split(/[\s_\-.]+/).filter((word) => word.length > 2)

  if (unitData) {
    // Enhanced kitchen faucet leak matching
    if (unitData["Leak Issue Kitchen Faucet"]) {
      const leakValue = unitData["Leak Issue Kitchen Faucet"].trim()
      const hasKitchenKeywords = ISSUE_KEYWORDS.kitchen.keywords.some((keyword) => imageWords.includes(keyword))
      const hasLeakKeywords = ISSUE_KEYWORDS.kitchen.leakTypes.some((keyword) => imageWords.includes(keyword))

      if (hasKitchenKeywords || hasLeakKeywords) {
        const severity = leakValue.toLowerCase()
        let noteText = ""
        let captionText = ""

        switch (severity) {
          case "light":
            noteText = "Light leak from kitchen faucet"
            captionText = "Light kitchen faucet leak"
            break
          case "moderate":
            noteText = "Moderate leak from kitchen faucet"
            captionText = "Moderate kitchen faucet leak"
            break
          case "heavy":
            noteText = "Heavy leak from kitchen faucet"
            captionText = "Heavy kitchen faucet leak"
            break
          case "dripping":
          case "driping":
            noteText = "Dripping from kitchen faucet"
            captionText = "Kitchen faucet dripping"
            break
          default:
            noteText = "Leak from kitchen faucet"
            captionText = "Kitchen faucet leak"
        }

        matchedNotes.push(noteText)
        if (!suggestedCaption) suggestedCaption = captionText
        confidence += hasKitchenKeywords && hasLeakKeywords ? 0.8 : 0.5
      }
    }

    // Enhanced bathroom faucet leak matching
    if (unitData["Leak Issue Bath Faucet"]) {
      const leakValue = unitData["Leak Issue Bath Faucet"].trim()
      const hasBathKeywords = ISSUE_KEYWORDS.bathroom.keywords.some((keyword) => imageWords.includes(keyword))
      const hasLeakKeywords = ISSUE_KEYWORDS.bathroom.leakTypes.some((keyword) => imageWords.includes(keyword))

      if (hasBathKeywords || hasLeakKeywords) {
        const severity = leakValue.toLowerCase()
        let noteText = ""
        let captionText = ""

        switch (severity) {
          case "light":
            noteText = "Light leak from bathroom faucet"
            captionText = "Light bathroom faucet leak"
            break
          case "moderate":
            noteText = "Moderate leak from bathroom faucet"
            captionText = "Moderate bathroom faucet leak"
            break
          case "heavy":
            noteText = "Heavy leak from bathroom faucet"
            captionText = "Heavy bathroom faucet leak"
            break
          case "dripping":
          case "driping":
            noteText = "Dripping from bathroom faucet"
            captionText = "Bathroom faucet dripping"
            break
          default:
            noteText = "Leak from bathroom faucet"
            captionText = "Bathroom faucet leak"
        }

        matchedNotes.push(noteText)
        if (!suggestedCaption) suggestedCaption = captionText
        confidence += hasBathKeywords && hasLeakKeywords ? 0.8 : 0.5
      }
    }

    // Enhanced tub/shower leak matching
    if (unitData["Tub Spout/Diverter Leak Issue"]) {
      const leakValue = unitData["Tub Spout/Diverter Leak Issue"]
      const hasShowerKeywords = ISSUE_KEYWORDS.shower.keywords.some((keyword) => imageWords.includes(keyword))
      const hasLeakKeywords = ISSUE_KEYWORDS.shower.leakTypes.some((keyword) => imageWords.includes(keyword))

      if (hasShowerKeywords || hasLeakKeywords) {
        let noteText = ""
        let captionText = ""

        switch (leakValue) {
          case "Light":
            noteText = "Light leak from tub spout/diverter"
            captionText = "Light tub spout leak"
            break
          case "Moderate":
            noteText = "Moderate leak from tub spout/diverter"
            captionText = "Moderate tub spout leak"
            break
          case "Heavy":
            noteText = "Heavy leak from tub spout/diverter"
            captionText = "Heavy tub spout leak"
            break
          default:
            if (leakValue) noteText = "Leak from tub spout/diverter"
            break
        }

        matchedNotes.push(noteText)
        if (!suggestedCaption) suggestedCaption = captionText
        confidence += hasShowerKeywords && hasLeakKeywords ? 0.8 : 0.5
      }
    }

    // Enhanced general notes matching
    if (unitData.Notes && unitData.Notes.trim()) {
      const notesText = unitData.Notes.trim().toLowerCase()
      const notesWords = notesText.split(/[\s_\-.]+/).filter((word) => word.length > 2)

      // Check for keyword overlap between image and notes
      const commonWords = imageWords.filter((word) => notesWords.includes(word))
      if (commonWords.length > 0) {
        matchedNotes.push(unitData.Notes.trim())
        if (!suggestedCaption) suggestedCaption = unitData.Notes.trim()
        confidence += Math.min(commonWords.length * 0.2, 0.6)
      }
    }
  }

  // Enhanced unit notes matching
  unitNotes.forEach((note) => {
    if (!matchedNotes.includes(note.note)) {
      const noteWords = note.note
        .toLowerCase()
        .split(/[\s_\-.]+/)
        .filter((word) => word.length > 2)
      const commonWords = imageWords.filter((word) => noteWords.includes(word))

      if (commonWords.length > 0) {
        matchedNotes.push(note.note)
        if (!suggestedCaption) suggestedCaption = note.note
        confidence += Math.min(commonWords.length * 0.15, 0.4)
      }
    }
  })

  // Enhanced fallback caption generation based on filename analysis
  if (!suggestedCaption) {
    suggestedCaption = generateFallbackCaption(imageWords, image.unit)
  }

  return {
    ...image,
    matchedNotes,
    suggestedCaption,
    confidence: Math.min(confidence, 1.0),
  }
}

// New function to generate intelligent fallback captions
function generateFallbackCaption(imageWords: string[], unit: string): string {
  const hasKitchen = imageWords.some((word) => ISSUE_KEYWORDS.kitchen.keywords.includes(word))
  const hasBathroom = imageWords.some((word) => ISSUE_KEYWORDS.bathroom.keywords.includes(word))
  const hasShower = imageWords.some((word) => ISSUE_KEYWORDS.shower.keywords.includes(word))
  const hasLeak = imageWords.some((word) =>
    [
      ...ISSUE_KEYWORDS.kitchen.leakTypes,
      ...ISSUE_KEYWORDS.bathroom.leakTypes,
      ...ISSUE_KEYWORDS.shower.leakTypes,
    ].includes(word),
  )

  if (hasLeak) {
    if (hasKitchen) return "Kitchen area leak issue"
    if (hasBathroom) return "Bathroom area leak issue"
    if (hasShower) return "Shower/tub area leak issue"
    return "Water leak issue"
  }

  if (hasKitchen) return "Kitchen area installation"
  if (hasBathroom) return "Bathroom area installation"
  if (hasShower) return "Shower/tub area installation"

  // Check for other common installation terms
  if (imageWords.some((word) => ["before", "after", "install", "replace"].includes(word))) {
    return "Installation work"
  }

  if (imageWords.some((word) => ["damage", "repair", "fix"].includes(word))) {
    return "Repair work needed"
  }

  return `Unit ${unit} installation photo`
}

export function processImagesForReport(
  images: ImageData[],
  installationData: InstallationData[],
  notes: Note[],
): { [unit: string]: ProcessedImage[] } {
  const processedImages: { [unit: string]: ProcessedImage[] } = {}

  images.forEach((image) => {
    const processedImage = matchImageWithNotes(image, installationData, notes)

    if (!processedImages[image.unit]) {
      processedImages[image.unit] = []
    }

    processedImages[image.unit].push(processedImage)
  })

  Object.keys(processedImages).forEach((unit) => {
    processedImages[unit].sort((a, b) => b.confidence - a.confidence)
  })

  return processedImages
}

// Enhanced caption suggestion with better matching logic
export function suggestCaptionsForImages(
  images: ImageData[],
  installationData: InstallationData[],
  notes: Note[],
): ImageData[] {
  return images.map((image) => {
    if (image.caption && image.caption.trim()) return image // Don't override existing captions

    const processed = matchImageWithNotes(image, installationData, notes)

    // Only suggest if confidence is above threshold
    if (processed.confidence > 0.3) {
      return {
        ...image,
        caption: processed.suggestedCaption,
      }
    }

    return image
  })
}

// Enhanced unit extraction with better pattern matching
export function extractUnitFromFilename(filename: string): string {
  console.log(`Extracting unit from filename: "${filename}"`)

  const patterns = [
    /^([A-Z]?\d+[A-Z]?)/i, // A01, B02, 1A, 2B at start
    /[_\-\s]([A-Z]?\d+[A-Z]?)[_\-\s.]/i, // _A01_, -B02-, A01.
    /unit[_\-\s]*([A-Z]?\d+[A-Z]?)/i, // unit_A01, unit-B02
    /apt[_\-\s]*([A-Z]?\d+[A-Z]?)/i, // apt_A01, apt-B02
    /room[_\-\s]*([A-Z]?\d+[A-Z]?)/i, // room_A01, room-B02
    /([A-Z]?\d+[A-Z]?)(?:[_\-\s]|$)/i, // A01 followed by separator or end
  ]

  const patternNames = [
    "Start of filename",
    "Surrounded by separators",
    "After 'unit'",
    "After 'apt'",
    "After 'room'",
    "Followed by separator or end",
  ]

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const match = filename.match(pattern)
    if (match) {
      const extractedUnit = match[1].toUpperCase()
      console.log(`Pattern ${i + 1} (${patternNames[i]}) matched: "${match[0]}" -> extracted unit: "${extractedUnit}"`)

      if (extractedUnit.length >= 2 || i === 0) {
        // Prefer units with 2+ chars, or always accept first pattern
        return extractedUnit
      } else {
        console.log(`Skipping short unit "${extractedUnit}" from pattern ${i + 1}, continuing to next pattern`)
        continue
      }
    }
  }

  console.log(`No unit extracted from filename: "${filename}"`)
  return ""
}

export function normalizeUnit(unit: string): string {
  return unit
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

// New function to analyze image content and suggest improvements
export function analyzeImageMatching(
  images: ImageData[],
  installationData: InstallationData[],
  notes: Note[],
): {
  totalImages: number
  matchedImages: number
  unmatchedImages: number
  highConfidenceMatches: number
  suggestions: string[]
} {
  const processedImages = images.map((image) => matchImageWithNotes(image, installationData, notes))

  const totalImages = images.length
  const matchedImages = processedImages.filter((img) => img.confidence > 0.1).length
  const unmatchedImages = totalImages - matchedImages
  const highConfidenceMatches = processedImages.filter((img) => img.confidence > 0.6).length

  const suggestions: string[] = []

  if (unmatchedImages > 0) {
    suggestions.push(
      `${unmatchedImages} images could not be automatically matched. Consider renaming files with unit numbers and descriptive keywords.`,
    )
  }

  if (highConfidenceMatches < matchedImages) {
    suggestions.push(
      "Some images have low confidence matches. Adding keywords like 'kitchen', 'bathroom', 'leak', or 'shower' to filenames will improve matching.",
    )
  }

  const unitsWithoutImages = installationData
    .filter(
      (data) =>
        data["Leak Issue Kitchen Faucet"] || data["Leak Issue Bath Faucet"] || data["Tub Spout/Diverter Leak Issue"],
    )
    .filter((data) => !images.some((img) => img.unit === data.Unit))

  if (unitsWithoutImages.length > 0) {
    suggestions.push(`${unitsWithoutImages.length} units with reported issues don't have associated images.`)
  }

  return {
    totalImages,
    matchedImages,
    unmatchedImages,
    highConfidenceMatches,
    suggestions,
  }
}

export function setCaptionsFromUnitNotes(
  images: ImageData[],
  installationData: InstallationData[],
  notes: Note[],
): ImageData[] {
  console.log("🔥 setCaptionsFromUnitNotes called with:")
  console.log("- Images:", images.length)
  console.log("- Installation data:", installationData.length)
  console.log("- Notes:", notes.length)

  if (installationData.length === 0) {
    return images
  }

  // Load CSV preview data from localStorage to get comprehensive notes
  let selectedCells: Record<string, string[]> = {}
  let selectedNotesColumns: string[] = []

  try {
    const storedSelectedCells = localStorage.getItem("selectedCells")
    const storedSelectedNotesColumns = localStorage.getItem("selectedNotesColumns")

    if (storedSelectedCells) {
      selectedCells = JSON.parse(storedSelectedCells)
      console.log("🔥 Loaded selected cells from CSV preview:", selectedCells)
    }

    if (storedSelectedNotesColumns) {
      selectedNotesColumns = JSON.parse(storedSelectedNotesColumns)
      console.log("🔥 Loaded selected notes columns from CSV preview:", selectedNotesColumns)
    }
  } catch (error) {
    console.error("🔥 Error loading CSV preview data:", error)
  }

  // Find the unit column
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

  const unitColumn = findUnitColumn(installationData)
  console.log("🔥 Using unit column:", unitColumn)

  // Find the three leak columns (for backward compatibility)
  const sampleData = installationData[0]
  const columns = Object.keys(sampleData)

  const tubLeakColumn =
    columns.find(
      (col) =>
        col.toLowerCase().includes("tub") &&
        col.toLowerCase().includes("leak") &&
        col.toLowerCase().includes("description"),
    ) || ""

  const kitchSinkColumn =
    columns.find((col) => col.toLowerCase().includes("kitch") && col.toLowerCase().includes("sink")) || ""

  const bathSinkColumn =
    columns.find(
      (col) =>
        col.toLowerCase().includes("bath") &&
        col.toLowerCase().includes("sink") &&
        !col.toLowerCase().includes("kitch"),
    ) || ""

  console.log("Found leak columns:")
  console.log("- Tub Leak:", tubLeakColumn)
  console.log("- Kitchen Sink:", kitchSinkColumn)
  console.log("- Bath Sink:", bathSinkColumn)

  return images.map((image) => {
    console.log(`🔥 Processing image: ${image.filename} for unit ${image.unit}`)

    // Find the unit's data using the detected unit column
    const unitData = installationData.find((data) => {
      const unitValue = unitColumn ? data[unitColumn] : data.Unit
      return unitValue === image.unit
    })

    if (!unitData) {
      console.log(`🔥 Unit ${image.unit} - No unit data found`)
      return {
        ...image,
        caption: image.caption || `Unit ${image.unit} installation photo`,
      }
    }

    // Get comprehensive notes for this unit using the unified notes system
    let comprehensiveNotes = ""

    // 1. Add leak issue notes (existing functionality)
    if (tubLeakColumn && unitData[tubLeakColumn] && unitData[tubLeakColumn].trim()) {
      const severity = unitData[tubLeakColumn].trim()
      comprehensiveNotes += `${severity} leak from tub spout. `
    }
    if (kitchSinkColumn && unitData[kitchSinkColumn] && unitData[kitchSinkColumn].trim()) {
      const severity = unitData[kitchSinkColumn].trim()
      comprehensiveNotes += `${severity} drip from kitchen faucet. `
    }
    if (bathSinkColumn && unitData[bathSinkColumn] && unitData[bathSinkColumn].trim()) {
      const severity = unitData[bathSinkColumn].trim()
      comprehensiveNotes += `${severity} drip from bathroom faucet. `
    }

    // 2. Add CSV preview selected columns notes
    if (selectedNotesColumns.length > 0) {
      selectedNotesColumns.forEach((columnName) => {
        if (unitData[columnName] && unitData[columnName].trim()) {
          comprehensiveNotes += `${columnName}: ${unitData[columnName].trim()}. `
        }
      })
    }

    // 3. Add CSV preview selected cells notes
    if (selectedCells[image.unit]) {
      selectedCells[image.unit].forEach((cellNote) => {
        comprehensiveNotes += `${cellNote}. `
      })
    }

    // 4. Add any additional notes from the unit data
    if (unitData.Notes && unitData.Notes.trim()) {
      comprehensiveNotes += unitData.Notes.trim() + " "
    }

    // 5. Add notes from the notes array (if any)
    const unitNote = notes.find((note) => note.unit === image.unit)
    if (unitNote && unitNote.note && unitNote.note.trim()) {
      comprehensiveNotes += unitNote.note.trim() + " "
    }

    // 6. Use the unified notes system to get the most comprehensive notes
    try {
      const unifiedNotes = getUnifiedNotes({
        installationData,
        unitColumn: unitColumn || "Unit",
        selectedCells,
        selectedNotesColumns,
      })

      const unitUnifiedNote = unifiedNotes.find(note => note.unit === image.unit)
      if (unitUnifiedNote && unitUnifiedNote.note && unitUnifiedNote.note.trim()) {
        // If unified notes has more comprehensive information, use it
        if (unitUnifiedNote.note.length > comprehensiveNotes.length) {
          comprehensiveNotes = unitUnifiedNote.note.trim()
          console.log(`🔥 Using unified notes for caption: "${comprehensiveNotes}"`)
        }
      }
    } catch (error) {
      console.error("🔥 Error getting unified notes:", error)
    }

    // Clean up the comprehensive notes
    comprehensiveNotes = comprehensiveNotes.trim()

    let caption = ""

    if (comprehensiveNotes && comprehensiveNotes !== "") {
      // Use the comprehensive notes as the caption
      caption = comprehensiveNotes
      console.log(`🔥 Generated comprehensive caption: "${caption}"`)
    } else {
      // Fallback to basic caption
      caption = image.caption || `Unit ${image.unit} installation photo`
      console.log(`🔥 Using fallback caption: "${caption}"`)
    }

    console.log(`🔥 Final caption for ${image.filename}: "${caption}"`)

    return {
      ...image,
      caption: caption,
    }
  })
}

// Direct Groq API call for image analysis
interface GroqVisionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface ImageAnalysisResult {
  fixtureType: "tub" | "kitchen_sink" | "bathroom_sink" | "unknown"
  confidence: number
}

async function analyzeImageWithGroq(imageDataUrl: string): Promise<ImageAnalysisResult> {
  console.log("🤖 Client: Starting image analysis via API route...")

  try {
    const response = await fetch("/api/analyze-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageDataUrl }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API route error: ${errorData.error}`)
    }

    const result: ImageAnalysisResult = await response.json()
    console.log("🤖 Client: Analysis result:", result)
    return result
  } catch (error) {
    console.error("🤖 Client: Error calling analysis API:", error)
    return { fixtureType: "unknown", confidence: 0 }
  }
}

export async function setCaptionsFromAIAnalysis(
  images: ImageData[],
  installationData: InstallationData[],
  notes: Note[],
): Promise<ImageData[]> {
  console.log("🤖 ===== STARTING AI CAPTION ANALYSIS =====")
  console.log("🤖 Images to process:", images.length)
  console.log("🤖 Installation data entries:", installationData.length)
  console.log("🤖 Environment check - GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY)

  if (installationData.length === 0) {
    console.log("🤖 ERROR: No installation data available for AI analysis")
    return images
  }

  // Find leak columns
  const sampleData = installationData[0]
  const columns = Object.keys(sampleData)
  console.log("🤖 Available columns:", columns)

  const tubLeakColumn =
    columns.find(
      (col) =>
        col.toLowerCase().includes("tub") &&
        col.toLowerCase().includes("leak") &&
        col.toLowerCase().includes("description"),
    ) || ""

  const kitchSinkColumn =
    columns.find((col) => col.toLowerCase().includes("kitch") && col.toLowerCase().includes("sink")) || ""

  const bathSinkColumn =
    columns.find(
      (col) =>
        col.toLowerCase().includes("bath") &&
        col.toLowerCase().includes("sink") &&
        !col.toLowerCase().includes("kitch"),
    ) || ""

  console.log("🤖 Found leak columns:")
  console.log("🤖 - Tub Leak:", tubLeakColumn)
  console.log("🤖 - Kitchen Sink:", kitchSinkColumn)
  console.log("🤖 - Bath Sink:", bathSinkColumn)

  // Process images with AI analysis
  const updatedImages: ImageData[] = []
  let processedCount = 0

  for (const image of images) {
    processedCount++
    console.log(`🤖 ===== PROCESSING IMAGE ${processedCount}/${images.length} =====`)
    console.log(`🤖 Filename: ${image.filename}`)
    console.log(`🤖 Unit: ${image.unit}`)
    console.log(`🤖 Has URL: ${!!image.url}`)
    console.log(`🤖 URL length: ${image.url?.length || 0}`)

    if (!image.url || !image.unit) {
      console.log(`🤖 SKIPPING - Missing URL or unit`)
      updatedImages.push(image)
      continue
    }

    try {
      console.log(`🤖 Starting AI analysis for ${image.filename}...`)
      const analysis = await analyzeImageWithGroq(image.url)
      console.log(`🤖 AI analysis complete for ${image.filename}:`, analysis)

      if (analysis.confidence < 0.3) {
        console.log(`🤖 Low confidence (${analysis.confidence}), using fallback`)
        updatedImages.push(
          setCaptionFromFallback(image, installationData, tubLeakColumn, kitchSinkColumn, bathSinkColumn),
        )
        continue
      }

      const unitData = installationData.find((data) => data.Unit === image.unit)
      if (!unitData) {
        console.log(`🤖 ERROR: No unit data found for ${image.unit}`)
        updatedImages.push(image)
        continue
      }

      console.log(`🤖 Unit data found for ${image.unit}`)
      let caption = ""

      // Map AI analysis to appropriate leak column
      switch (analysis.fixtureType) {
        case "tub":
          console.log(`🤖 Processing TUB detection...`)
          if (tubLeakColumn && unitData[tubLeakColumn] && unitData[tubLeakColumn].trim()) {
            const severity = unitData[tubLeakColumn].trim()
            caption = `${severity} leak from tub spout.`
            console.log(`🤖 SUCCESS: Tub caption assigned: "${caption}"`)
          } else {
            console.log(`🤖 No tub leak data available for unit ${image.unit}`)
          }
          break
        case "kitchen_sink":
          console.log(`🤖 Processing KITCHEN SINK detection...`)
          if (kitchSinkColumn && unitData[kitchSinkColumn] && unitData[kitchSinkColumn].trim()) {
            const severity = unitData[kitchSinkColumn].trim()
            caption = `${severity} drip from kitchen faucet.`
            console.log(`🤖 SUCCESS: Kitchen caption assigned: "${caption}"`)
          } else {
            console.log(`🤖 No kitchen sink data available for unit ${image.unit}`)
          }
          break
        case "bathroom_sink":
          console.log(`🤖 Processing BATHROOM SINK detection...`)
          if (bathSinkColumn && unitData[bathSinkColumn] && unitData[bathSinkColumn].trim()) {
            const severity = unitData[bathSinkColumn].trim()
            caption = `${severity} drip from bathroom faucet.`
            console.log(`🤖 SUCCESS: Bathroom caption assigned: "${caption}"`)
          } else {
            console.log(`🤖 No bathroom sink data available for unit ${image.unit}`)
          }
          break
        default:
          console.log(`🤖 Unknown fixture type: ${analysis.fixtureType}, using fallback`)
          updatedImages.push(
            setCaptionFromFallback(image, installationData, tubLeakColumn, kitchSinkColumn, bathSinkColumn),
          )
          continue
      }

      if (!caption) {
        console.log(`🤖 No caption generated, using fallback for ${analysis.fixtureType}`)
        updatedImages.push(
          setCaptionFromFallback(image, installationData, tubLeakColumn, kitchSinkColumn, bathSinkColumn),
        )
        continue
      }

      console.log(`🤖 FINAL CAPTION: "${caption}"`)
      updatedImages.push({
        ...image,
        caption: caption,
      })
    } catch (error) {
      console.error(`🤖 CRITICAL ERROR processing ${image.filename}:`, error)
      console.error(`🤖 Error details:`, error instanceof Error ? error.message : "Unknown error")
      updatedImages.push(
        setCaptionFromFallback(image, installationData, tubLeakColumn, kitchSinkColumn, bathSinkColumn),
      )
    }
  }

  console.log("🤖 ===== AI CAPTION ANALYSIS COMPLETE =====")
  console.log(`🤖 Processed ${processedCount} images`)
  console.log(`🤖 Updated images count: ${updatedImages.length}`)
  return updatedImages
}

// Helper function for fallback caption assignment
function setCaptionFromFallback(
  image: ImageData,
  installationData: InstallationData[],
  tubLeakColumn: string,
  kitchSinkColumn: string,
  bathSinkColumn: string,
): ImageData {
  const unitData = installationData.find((data) => data.Unit === image.unit)
  if (!unitData) {
    return {
      ...image,
      caption: image.caption || `Unit ${image.unit} installation photo`,
    }
  }

  // Use priority system as fallback
  if (tubLeakColumn && unitData[tubLeakColumn] && unitData[tubLeakColumn].trim()) {
    const severity = unitData[tubLeakColumn].trim()
    return {
      ...image,
      caption: `${severity} leak from tub spout.`,
    }
  } else if (kitchSinkColumn && unitData[kitchSinkColumn] && unitData[kitchSinkColumn].trim()) {
    const severity = unitData[kitchSinkColumn].trim()
    return {
      ...image,
      caption: `${severity} drip from kitchen faucet.`,
    }
  } else if (bathSinkColumn && unitData[bathSinkColumn] && unitData[bathSinkColumn].trim()) {
    const severity = unitData[bathSinkColumn].trim()
    return {
      ...image,
      caption: `${severity} drip from bathroom faucet.`,
    }
  }

  return {
    ...image,
    caption: image.caption || `Unit ${image.unit} installation photo`,
  }
}

export function setCaptionsFromManualSelection(images: ImageData[], installationData: InstallationData[]): ImageData[] {
  console.log("🔧 setCaptionsFromManualSelection called with:")
  console.log("- Images:", images.length)
  console.log("- Installation data:", installationData.length)

  if (installationData.length === 0) {
    console.log("🔧 No installation data available")
    return images
  }

  // Find leak columns
  const sampleData = installationData[0]
  const columns = Object.keys(sampleData)

  const tubLeakColumn =
    columns.find(
      (col) =>
        col.toLowerCase().includes("tub") &&
        col.toLowerCase().includes("leak") &&
        col.toLowerCase().includes("description"),
    ) || ""

  const kitchSinkColumn =
    columns.find((col) => col.toLowerCase().includes("kitch") && col.toLowerCase().includes("sink")) || ""

  const bathSinkColumn =
    columns.find(
      (col) =>
        col.toLowerCase().includes("bath") &&
        col.toLowerCase().includes("sink") &&
        !col.toLowerCase().includes("kitch"),
    ) || ""

  console.log("🔧 Found leak columns:")
  console.log("- Tub Leak:", tubLeakColumn)
  console.log("- Kitchen Sink:", kitchSinkColumn)
  console.log("- Bath Sink:", bathSinkColumn)

  return images.map((image) => {
    const imageWithFixture = image as any // Type assertion for fixtureType
    console.log(`🔧 Processing image: ${image.filename} for unit ${image.unit}`)
    console.log(`🔧 Selected fixture type: ${imageWithFixture.fixtureType || "none"}`)

    // Find the unit's data
    const unitData = installationData.find((data) => data.Unit === image.unit)

    if (!unitData) {
      console.log(`🔧 Unit ${image.unit} - No unit data found`)
      return {
        ...image,
        caption: image.caption || `Unit ${image.unit} installation photo`,
      }
    }

    let caption = ""

    // Generate caption based on manually selected fixture type
    switch (imageWithFixture.fixtureType) {
      case "tub":
        if (tubLeakColumn && unitData[tubLeakColumn] && unitData[tubLeakColumn].trim()) {
          const severity = unitData[tubLeakColumn].trim()
          caption = `${severity} leak from tub spout.`
          console.log(`🔧 Generated tub caption: "${caption}"`)
        } else {
          console.log(`🔧 No tub leak data available for unit ${image.unit}`)
        }
        break
      case "kitchen_sink":
        if (kitchSinkColumn && unitData[kitchSinkColumn] && unitData[kitchSinkColumn].trim()) {
          const severity = unitData[kitchSinkColumn].trim()
          caption = `${severity} drip from kitchen faucet.`
          console.log(`🔧 Generated kitchen caption: "${caption}"`)
        } else {
          console.log(`🔧 No kitchen sink data available for unit ${image.unit}`)
        }
        break
      case "bathroom_sink":
        if (bathSinkColumn && unitData[bathSinkColumn] && unitData[bathSinkColumn].trim()) {
          const severity = unitData[bathSinkColumn].trim()
          caption = `${severity} drip from bathroom faucet.`
          console.log(`🔧 Generated bathroom caption: "${caption}"`)
        } else {
          console.log(`🔧 No bathroom sink data available for unit ${image.unit}`)
        }
        break
      default:
        console.log(`🔧 No fixture type selected, keeping existing caption`)
        caption = image.caption || `Unit ${image.unit} installation photo`
    }

    if (!caption) {
      caption = image.caption || `Unit ${image.unit} installation photo`
      console.log(`🔧 Using fallback caption: "${caption}"`)
    }

    console.log(`🔧 Final caption for ${image.filename}: "${caption}"`)

    return {
      ...image,
      caption: caption,
    }
  })
}

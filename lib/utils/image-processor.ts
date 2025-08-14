import type { ImageData, ProcessedImage, InstallationData, Note } from "@/lib/types"

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
  console.log("setCaptionsFromUnitNotes called with:")
  console.log("- Images:", images.length)
  console.log("- Installation data:", installationData.length)
  console.log("- Notes:", notes.length)

  if (installationData.length > 0) {
    console.log("Sample installation data structure:")
    console.log("Keys:", Object.keys(installationData[0]))
    console.log("Full sample:", installationData[0])
  }

  if (notes.length > 0) {
    console.log("Sample note structure:")
    console.log("Keys:", Object.keys(notes[0]))
    console.log("Full sample:", notes[0])
  }

  if (images.length > 0) {
    console.log("Sample image structure:")
    console.log("Keys:", Object.keys(images[0]))
    console.log("Sample image unit:", images[0].unit)
  }

  return images.map((image) => {
    console.log(`Processing image for unit ${image.unit}`)

    // Find the unit's notes
    const unitData = installationData.find((data) => data.Unit === image.unit)
    const unitNotes = notes.filter((note) => note.unit === image.unit)

    console.log(`Unit ${image.unit} - Found unit data:`, !!unitData)
    console.log(`Unit ${image.unit} - Found unit notes:`, unitNotes.length)

    if (!unitData) {
      console.log(
        `Unit ${image.unit} - Available units in installation data:`,
        installationData.map((d) => d.Unit).slice(0, 10),
      )
    }

    let caption = ""

    // Priority 1: Use unit notes from the notes array
    if (unitNotes.length > 0) {
      caption = unitNotes[0].note // Use the first note for this unit
      console.log(`Unit ${image.unit} - Using unit note: "${caption}"`)
    }
    // Priority 2: Use general notes from installation data
    else if (unitData?.Notes && unitData.Notes.trim()) {
      caption = unitData.Notes.trim()
      console.log(`Unit ${image.unit} - Using general notes: "${caption}"`)
    }
    // Priority 3: Use leak issue notes
    else if (unitData) {
      console.log(`Unit ${image.unit} - Available properties:`, Object.keys(unitData))

      const leakNotes = []

      if (unitData["Leak Issue Kitchen Faucet"]) {
        const severity = unitData["Leak Issue Kitchen Faucet"].trim().toLowerCase()
        switch (severity) {
          case "light":
            leakNotes.push("Light leak from kitchen faucet")
            break
          case "moderate":
            leakNotes.push("Moderate leak from kitchen faucet")
            break
          case "heavy":
            leakNotes.push("Heavy leak from kitchen faucet")
            break
          case "dripping":
          case "driping":
            leakNotes.push("Dripping from kitchen faucet")
            break
          default:
            if (severity) leakNotes.push("Leak from kitchen faucet")
            break
        }
      }

      if (unitData["Leak Issue Bath Faucet"]) {
        const severity = unitData["Leak Issue Bath Faucet"].trim().toLowerCase()
        switch (severity) {
          case "light":
            leakNotes.push("Light leak from bathroom faucet")
            break
          case "moderate":
            leakNotes.push("Moderate leak from bathroom faucet")
            break
          case "heavy":
            leakNotes.push("Heavy leak from bathroom faucet")
            break
          case "dripping":
          case "driping":
            leakNotes.push("Dripping from bathroom faucet")
            break
          default:
            if (severity) leakNotes.push("Leak from bathroom faucet")
            break
        }
      }

      if (unitData["Tub Spout/Diverter Leak Issue"]) {
        const severity = unitData["Tub Spout/Diverter Leak Issue"]
        switch (severity) {
          case "Light":
            leakNotes.push("Light leak from tub spout/diverter")
            break
          case "Moderate":
            leakNotes.push("Moderate leak from tub spout/diverter")
            break
          case "Heavy":
            leakNotes.push("Heavy leak from tub spout/diverter")
            break
          default:
            if (severity) leakNotes.push("Leak from tub spout/diverter")
            break
        }
      }

      caption = leakNotes.join(". ")
      if (caption) {
        console.log(`Unit ${image.unit} - Using leak issue notes: "${caption}"`)
      }
    }

    // Priority 4: Keep existing caption if no notes found
    if (!caption) {
      caption = image.caption || `Unit ${image.unit} installation photo`
      console.log(`Unit ${image.unit} - Using fallback caption: "${caption}"`)
    }

    console.log(`Unit ${image.unit} - Final caption: "${caption}"`)

    return {
      ...image,
      caption: caption,
    }
  })
}

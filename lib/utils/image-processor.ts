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
            noteText = "Leak from tub spout/diverter"
            captionText = "Tub spout leak"
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
  const patterns = [
    /^([A-Z]?\d+[A-Z]?)/i, // A01, B02, 1A, 2B at start
    /[_\-\s]([A-Z]?\d+[A-Z]?)[_\-\s.]/i, // _A01_, -B02-, A01.
    /unit[_\-\s]*([A-Z]?\d+[A-Z]?)/i, // unit_A01, unit-B02
    /apt[_\-\s]*([A-Z]?\d+[A-Z]?)/i, // apt_A01, apt-B02
    /room[_\-\s]*([A-Z]?\d+[A-Z]?)/i, // room_A01, room-B02
    /([A-Z]?\d+[A-Z]?)(?:[_\-\s]|$)/i, // A01 followed by separator or end
  ]

  for (const pattern of patterns) {
    const match = filename.match(pattern)
    if (match) {
      return match[1].toUpperCase()
    }
  }

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

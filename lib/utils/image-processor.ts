import type { ImageData, ProcessedImage, InstallationData, Note } from "@/lib/types"
import { analyzeMultipleImages } from "./image-analyzer"

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

  if (installationData.length > 0) {
    console.log("Sample installation data structure:")
    console.log("Keys:", Object.keys(installationData[0]))
    console.log("Full sample:", installationData[0])
  }

  let tubLeakColumn = ""
  let kitchSinkColumn = ""
  let bathSinkColumn = ""

  if (installationData.length > 0) {
    const sampleData = installationData[0]
    const columns = Object.keys(sampleData)

    // Find Tub Leak Description column
    tubLeakColumn =
      columns.find(
        (col) =>
          col.toLowerCase().includes("tub") &&
          col.toLowerCase().includes("leak") &&
          col.toLowerCase().includes("description"),
      ) || ""

    // Find Kitchen Sink column
    kitchSinkColumn =
      columns.find((col) => col.toLowerCase().includes("kitch") && col.toLowerCase().includes("sink")) || ""

    // Find Bath Sink column
    bathSinkColumn =
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
  }

  return images.map((image) => {
    console.log(`🔥 Processing image: ${image.filename} for unit ${image.unit}`)

    // Find the unit's data
    const unitData = installationData.find((data) => data.Unit === image.unit)

    if (!unitData) {
      console.log(`Unit ${image.unit} - No unit data found`)
      return {
        ...image,
        caption: image.caption || `Unit ${image.unit} installation photo`,
      }
    }

    const filename = image.filename.toLowerCase()
    let caption = ""

    // Check filename for specific leak type keywords
    const isTubImage = filename.includes("tub") || filename.includes("shower") || filename.includes("spout")
    const isKitchenImage = filename.includes("kitchen") || filename.includes("kitch")
    const isBathImage = (filename.includes("bath") || filename.includes("bathroom")) && !filename.includes("kitchen")

    console.log(`🔥 Image analysis for ${image.filename}:`)
    console.log(`- Is tub image: ${isTubImage}`)
    console.log(`- Is kitchen image: ${isKitchenImage}`)
    console.log(`- Is bath image: ${isBathImage}`)

    // Intelligent caption assignment based on image content
    if (isTubImage && tubLeakColumn && unitData[tubLeakColumn] && unitData[tubLeakColumn].trim()) {
      const severity = unitData[tubLeakColumn].trim()
      caption = `${severity} leak from tub spout.`
      console.log(`🔥 Assigned tub caption: "${caption}"`)
    } else if (isKitchenImage && kitchSinkColumn && unitData[kitchSinkColumn] && unitData[kitchSinkColumn].trim()) {
      const severity = unitData[kitchSinkColumn].trim()
      caption = `${severity} drip from kitchen faucet.`
      console.log(`🔥 Assigned kitchen caption: "${caption}"`)
    } else if (isBathImage && bathSinkColumn && unitData[bathSinkColumn] && unitData[bathSinkColumn].trim()) {
      const severity = unitData[bathSinkColumn].trim()
      caption = `${severity} drip from bathroom faucet.`
      console.log(`🔥 Assigned bathroom caption: "${caption}"`)
    }
    // Fallback to priority system if filename doesn't indicate specific type
    else if (tubLeakColumn && unitData[tubLeakColumn] && unitData[tubLeakColumn].trim()) {
      const severity = unitData[tubLeakColumn].trim()
      caption = `${severity} leak from tub spout.`
      console.log(`🔥 Fallback to tub caption: "${caption}"`)
    } else if (kitchSinkColumn && unitData[kitchSinkColumn] && unitData[kitchSinkColumn].trim()) {
      const severity = unitData[kitchSinkColumn].trim()
      caption = `${severity} drip from kitchen faucet.`
      console.log(`🔥 Fallback to kitchen caption: "${caption}"`)
    } else if (bathSinkColumn && unitData[bathSinkColumn] && unitData[bathSinkColumn].trim()) {
      const severity = unitData[bathSinkColumn].trim()
      caption = `${severity} drip from bathroom faucet.`
      console.log(`🔥 Fallback to bathroom caption: "${caption}"`)
    } else {
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

// New AI-powered caption function
export async function setCaptionsFromAIAnalysis(
  images: ImageData[],
  installationData: InstallationData[],
  notes: Note[],
): Promise<ImageData[]> {
  console.log("🤖 Starting AI-powered caption analysis...")
  console.log("- Images:", images.length)
  console.log("- Installation data:", installationData.length)

  if (installationData.length === 0) {
    console.log("No installation data available for AI analysis")
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

  console.log("🤖 Found leak columns:")
  console.log("- Tub Leak:", tubLeakColumn)
  console.log("- Kitchen Sink:", kitchSinkColumn)
  console.log("- Bath Sink:", bathSinkColumn)

  // Prepare images for AI analysis
  const imagesToAnalyze = images
    .filter((img) => img.url && img.unit) // Only analyze images with URLs and units
    .map((img) => ({
      id: img.id,
      dataUrl: img.url,
    }))

  if (imagesToAnalyze.length === 0) {
    console.log("No valid images to analyze")
    return images
  }

  try {
    // Analyze images with AI
    console.log(`🤖 Analyzing ${imagesToAnalyze.length} images...`)
    const analysisResults = await analyzeMultipleImages(imagesToAnalyze)

    // Apply AI analysis results to generate captions
    const updatedImages = images.map((image) => {
      const analysis = analysisResults.get(image.id)

      if (!analysis || analysis.confidence < 0.3) {
        console.log(`🤖 Low confidence or no analysis for ${image.filename}, using fallback`)
        return setCaptionFromFallback(image, installationData, tubLeakColumn, kitchSinkColumn, bathSinkColumn)
      }

      const unitData = installationData.find((data) => data.Unit === image.unit)
      if (!unitData) {
        console.log(`🤖 No unit data found for ${image.unit}`)
        return image
      }

      let caption = ""

      // Map AI analysis to appropriate leak column
      switch (analysis.fixtureType) {
        case "tub":
          if (tubLeakColumn && unitData[tubLeakColumn] && unitData[tubLeakColumn].trim()) {
            const severity = unitData[tubLeakColumn].trim()
            caption = `${severity} leak from tub spout.`
            console.log(`🤖 AI detected tub, assigned caption: "${caption}"`)
          }
          break
        case "kitchen_sink":
          if (kitchSinkColumn && unitData[kitchSinkColumn] && unitData[kitchSinkColumn].trim()) {
            const severity = unitData[kitchSinkColumn].trim()
            caption = `${severity} drip from kitchen faucet.`
            console.log(`🤖 AI detected kitchen sink, assigned caption: "${caption}"`)
          }
          break
        case "bathroom_sink":
          if (bathSinkColumn && unitData[bathSinkColumn] && unitData[bathSinkColumn].trim()) {
            const severity = unitData[bathSinkColumn].trim()
            caption = `${severity} drip from bathroom faucet.`
            console.log(`🤖 AI detected bathroom sink, assigned caption: "${caption}"`)
          }
          break
        default:
          console.log(`🤖 AI detected "${analysis.fixtureType}" with low confidence, using fallback`)
          return setCaptionFromFallback(image, installationData, tubLeakColumn, kitchSinkColumn, bathSinkColumn)
      }

      if (!caption) {
        console.log(`🤖 No matching leak data for detected fixture type: ${analysis.fixtureType}`)
        return setCaptionFromFallback(image, installationData, tubLeakColumn, kitchSinkColumn, bathSinkColumn)
      }

      return {
        ...image,
        caption: caption,
      }
    })

    console.log("🤖 AI caption analysis complete!")
    return updatedImages
  } catch (error) {
    console.error("🤖 Error in AI analysis, falling back to filename-based captions:", error)
    // Fallback to existing filename-based logic
    return setCaptionsFromUnitNotes(images, installationData, notes)
  }
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

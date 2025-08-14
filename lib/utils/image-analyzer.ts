import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"

// Schema for the AI response
const FixtureAnalysisSchema = z.object({
  fixtureType: z.enum(["tub", "kitchen_sink", "bathroom_sink", "other"]),
  confidence: z.number().min(0).max(1),
  description: z.string(),
})

export type FixtureAnalysis = z.infer<typeof FixtureAnalysisSchema>

/**
 * Analyzes an image to identify bathroom/kitchen fixtures using Groq's vision model
 */
export async function analyzeImageFixture(imageDataUrl: string): Promise<FixtureAnalysis> {
  try {
    console.log("🔍 Analyzing image with Groq vision model...")

    const result = await generateObject({
      model: groq("llama-3.2-90b-vision-preview"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and identify what type of plumbing fixture is shown. 
              
              Look for:
              - Bathtub or tub spout (classify as "tub")
              - Kitchen sink or kitchen faucet (classify as "kitchen_sink") 
              - Bathroom sink or bathroom faucet (classify as "bathroom_sink")
              - Other fixtures or unclear images (classify as "other")
              
              Provide your confidence level (0-1) and a brief description of what you see.`,
            },
            {
              type: "image",
              image: imageDataUrl,
            },
          ],
        },
      ],
      schema: FixtureAnalysisSchema,
      temperature: 0.1, // Low temperature for consistent results
    })

    console.log("✅ Image analysis complete:", result.object)
    return result.object
  } catch (error) {
    console.error("❌ Error analyzing image:", error)
    // Return fallback result
    return {
      fixtureType: "other",
      confidence: 0,
      description: "Analysis failed",
    }
  }
}

/**
 * Analyzes multiple images and returns fixture types
 */
export async function analyzeMultipleImages(
  images: Array<{ id: string; dataUrl: string }>,
): Promise<Map<string, FixtureAnalysis>> {
  const results = new Map<string, FixtureAnalysis>()

  console.log(`🔍 Starting analysis of ${images.length} images...`)

  // Process images sequentially to avoid rate limits
  for (const image of images) {
    try {
      const analysis = await analyzeImageFixture(image.dataUrl)
      results.set(image.id, analysis)

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`❌ Failed to analyze image ${image.id}:`, error)
      results.set(image.id, {
        fixtureType: "other",
        confidence: 0,
        description: "Analysis failed",
      })
    }
  }

  console.log("✅ Completed analysis of all images")
  return results
}

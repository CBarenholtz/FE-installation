import { NextResponse } from "next/server"

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

export async function POST(request: Request) {
  console.log("[v0] Analyze image route called")

  try {
    const { imageDataUrl } = await request.json()

    if (!imageDataUrl) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      console.log("[v0] GROQ_API_KEY not available, returning unknown")
      return NextResponse.json({
        fixtureType: "unknown",
        confidence: 0,
      })
    }

    console.log("[v0] Calling Groq Vision API for image analysis")

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llava-v1.5-7b-4096-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this plumbing image and identify the fixture type. Respond with only one of these exact words: tub, kitchen_sink, bathroom_sink, or unknown. Look for: tubs/showers/spouts, kitchen sinks/faucets, or bathroom sinks/faucets.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data: GroqVisionResponse = await response.json()
    const content = data.choices[0]?.message?.content?.toLowerCase().trim() || "unknown"

    console.log("[v0] Groq analysis result:", content)

    let fixtureType: "tub" | "kitchen_sink" | "bathroom_sink" | "unknown" = "unknown"
    let confidence = 0

    if (content.includes("tub") || content.includes("shower") || content.includes("spout")) {
      fixtureType = "tub"
      confidence = 0.8
    } else if (content.includes("kitchen")) {
      fixtureType = "kitchen_sink"
      confidence = 0.8
    } else if (content.includes("bathroom") || content.includes("bath")) {
      fixtureType = "bathroom_sink"
      confidence = 0.8
    } else if (content === "tub" || content === "kitchen_sink" || content === "bathroom_sink") {
      fixtureType = content as any
      confidence = 0.9
    }

    const result: ImageAnalysisResult = { fixtureType, confidence }
    console.log("[v0] Final analysis result:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in analyze-image route:", error)
    return NextResponse.json({
      fixtureType: "unknown",
      confidence: 0,
    })
  }
}

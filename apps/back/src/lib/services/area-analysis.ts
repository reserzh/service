import { getAIClient, AI_MODEL } from "@/lib/ai/client";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";

export interface AreaAnalysisResult {
  estimatedSqft: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  range: { min: number; max: number };
  zones?: { name: string; estimatedSqft: number }[];
}

export async function analyzeAreaFromPhoto(
  ctx: UserContext,
  imageBuffer: Buffer,
  mimeType: string,
  context?: string
): Promise<AreaAnalysisResult> {
  assertPermission(ctx, "estimates", "create");

  const client = getAIClient();
  const base64 = imageBuffer.toString("base64");

  const systemPrompt = `You are an expert area estimator for field service work (landscaping, hardscaping, fencing, etc.).
Analyze the photo to estimate the area in square feet. Use these techniques:
- Identify boundaries: fences, structures, driveways, tree lines, property edges
- Use reference objects for scale: vehicles (~15ft long), standard doors (~3ft wide, ~7ft tall), garage doors (~16ft wide), sidewalks (~4ft wide), fence sections (~6-8ft between posts)
- Account for irregular shapes by breaking into rectangles/triangles
- Identify distinct zones if the area has clearly different sections

Your estimate does NOT need to be perfect — a rough estimate within 20-30% is useful. The technician will confirm/adjust.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation outside JSON) matching this exact schema:
{
  "estimatedSqft": <number>,
  "confidence": "<low|medium|high>",
  "reasoning": "<1-3 sentence explanation of how you estimated>",
  "range": { "min": <number>, "max": <number> },
  "zones": [{ "name": "<zone name>", "estimatedSqft": <number> }]
}

Confidence guide:
- "high": clear boundaries + multiple reference objects visible (within ~15%)
- "medium": some boundaries visible, at least one reference object (~20-30%)
- "low": few visual cues, mostly guessing (~30-50%)

If the photo doesn't show a measurable outdoor area, set estimatedSqft to 0 and confidence to "low" with an explanation.`;

  const userMessage = context
    ? `Estimate the area in this photo. Additional context: ${context}`
    : "Estimate the area in this photo.";

  const mediaType = mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: userMessage },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI");
  }

  // Parse the JSON response, stripping any markdown fences
  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(jsonStr) as AreaAnalysisResult;

  // Validate required fields
  if (typeof parsed.estimatedSqft !== "number" || !parsed.confidence || !parsed.range) {
    throw new Error("Invalid AI response format");
  }

  return {
    estimatedSqft: Math.round(parsed.estimatedSqft),
    confidence: parsed.confidence,
    reasoning: parsed.reasoning || "No reasoning provided",
    range: {
      min: Math.round(parsed.range.min),
      max: Math.round(parsed.range.max),
    },
    zones: parsed.zones?.map((z) => ({
      name: z.name,
      estimatedSqft: Math.round(z.estimatedSqft),
    })),
  };
}

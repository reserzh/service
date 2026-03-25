import { getAIClient, AI_MODEL, isAIConfigured } from "@/lib/ai/client";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import type { SiteTheme } from "@fieldservice/shared/types";

import dns from "dns/promises";

// ---------- SSRF Protection ----------

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "host.docker.internal",
  "metadata.google.internal",
  "169.254.169.254",
  "0.0.0.0",
]);

function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (/^127\./.test(ip)) return true; // loopback
  if (/^10\./.test(ip)) return true; // class A private
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true; // class B private
  if (/^192\.168\./.test(ip)) return true; // class C private
  if (/^169\.254\./.test(ip)) return true; // link-local
  if (ip === "0.0.0.0") return true;
  // IPv6
  if (ip === "::1" || ip === "::") return true;
  if (/^f[cd]/i.test(ip)) return true; // fc00::/7 unique-local
  if (/^fe80/i.test(ip)) return true; // link-local
  return false;
}

export async function validateExternalUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  // Only allow http(s)
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  // Block known internal hostnames
  if (BLOCKED_HOSTNAMES.has(parsed.hostname.toLowerCase())) {
    throw new Error("Internal URLs are not allowed");
  }

  // Resolve hostname and check for private IPs
  try {
    const { address } = await dns.lookup(parsed.hostname);
    if (isPrivateIP(address)) {
      throw new Error("URLs pointing to private networks are not allowed");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("not allowed")) {
      throw error;
    }
    // DNS resolution failure — let the fetch fail naturally
  }
}

// ---------- Constants ----------

export const ALLOWED_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Merriweather",
] as const;

export const ALLOWED_BORDER_RADII = [
  "0",
  "0.25rem",
  "0.5rem",
  "0.75rem",
  "1rem",
] as const;

// ---------- Types ----------

export interface ThemeGeneratorInput {
  description?: string;
  inspirationUrls?: string[];
  logoBase64?: string;
  logoMediaType?: string;
  refinementPrompt?: string;
  previousResult?: SiteTheme;
}

export interface ThemeOption {
  name: string;
  theme: SiteTheme;
  reasoning: string;
}

export interface ThemeGeneratorResult {
  options: ThemeOption[];
}

interface UrlStyleExtraction {
  url: string;
  styles?: string;
  error?: string;
}

// ---------- System Prompt ----------

const SYSTEM_PROMPT = `You are a brand identity and web design expert specializing in field service businesses (HVAC, plumbing, electrical, landscaping, cleaning, etc.).

Generate exactly 3 DISTINCT website theme options based on the user's inputs. Each option should take a meaningfully different design direction — vary color families, font pairings, and border radius. Do not just produce minor shade variations.

Your output MUST be valid JSON matching this exact schema (no markdown, no code fences):

{
  "options": [
    {
      "name": "<short creative name, e.g. Bold & Professional>",
      "theme": {
        "primaryColor": "<hex #RRGGBB>",
        "secondaryColor": "<hex #RRGGBB>",
        "accentColor": "<hex #RRGGBB>",
        "fontHeading": "<one of: ${ALLOWED_FONTS.join(", ")}>",
        "fontBody": "<one of: ${ALLOWED_FONTS.join(", ")}>",
        "borderRadius": "<one of: ${ALLOWED_BORDER_RADII.join(", ")}>",
        "style": "ai-generated"
      },
      "reasoning": "<1-2 sentences explaining the design direction>"
    },
    { ... },
    { ... }
  ]
}

Design guidelines:
- primaryColor: Main brand color for headers, buttons, key UI. Should feel intentional and professional.
- secondaryColor: Darker or complementary shade for hover states, depth, and contrast.
- accentColor: Eye-catching contrast color for CTAs and highlights. Must be visually distinct from primary.
- Heading + body font should be a deliberate pairing (e.g. serif heading + sans body for contrast, or two complementary sans-serifs).
- Modern styles: smaller radius (0 or 0.25rem), clean sans-serif fonts.
- Friendly/approachable: medium radius (0.5rem, 0.75rem), rounded fonts like Poppins or Lato.
- Premium/luxury: serif headings (Playfair Display, Merriweather), minimal radius, deep colors.
- Ensure sufficient contrast between primary, secondary, and accent — they should each be clearly distinguishable.
- All hex colors MUST be 6-digit format: #RRGGBB`;

// ---------- Main Function ----------

export async function generateTheme(
  ctx: UserContext,
  input: ThemeGeneratorInput
): Promise<ThemeGeneratorResult> {
  assertPermission(ctx, "website", "update");

  if (!isAIConfigured()) {
    throw new Error("AI is not configured");
  }

  const hasInput =
    input.description ||
    (input.inspirationUrls && input.inspirationUrls.length > 0) ||
    input.logoBase64;
  const hasRefinement = input.refinementPrompt && input.previousResult;

  if (!hasInput && !hasRefinement) {
    throw new Error(
      "At least one input (description, inspiration URLs, logo, or refinement) is required"
    );
  }

  type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  // Build the user message content
  const contentParts: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } }
  > = [];

  // Refinement mode
  if (hasRefinement) {
    contentParts.push({
      type: "text",
      text: `Current theme:\n${JSON.stringify(input.previousResult, null, 2)}\n\nRefinement request: ${input.refinementPrompt}\n\nGenerate 3 new variations based on this refinement while maintaining overall coherence with the current theme's direction.`,
    });
  } else {
    // Build description + context
    const textParts: string[] = [];

    if (input.description) {
      textParts.push(`Style description: ${input.description}`);
    }

    // Extract styles from inspiration URLs
    if (input.inspirationUrls && input.inspirationUrls.length > 0) {
      const urlStyles = await extractStylesFromUrls(input.inspirationUrls);
      const urlContext = urlStyles
        .map((u) => {
          if (u.error) return `Inspiration URL (${u.url}): Could not access — ${u.error}`;
          return `Inspiration URL (${u.url}):\n${u.styles}`;
        })
        .join("\n\n");
      textParts.push(urlContext);
    }

    if (input.logoBase64) {
      textParts.push(
        "A logo image is attached. Analyze its dominant colors, style characteristics, and typography feel. All 3 options should incorporate the logo's color DNA but interpret it differently."
      );
    }

    contentParts.push({ type: "text", text: textParts.join("\n\n") });

    // Add logo image if provided
    if (input.logoBase64 && input.logoMediaType) {
      contentParts.push({
        type: "image",
        source: {
          type: "base64",
          media_type: input.logoMediaType as ImageMediaType,
          data: input.logoBase64,
        },
      });
    }
  }

  const client = getAIClient();
  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: contentParts }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI");
  }

  // Parse JSON — strip markdown fences if present
  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(jsonStr) as {
    options: Array<{
      name: string;
      theme: Record<string, string>;
      reasoning: string;
    }>;
  };

  if (!parsed.options || !Array.isArray(parsed.options)) {
    throw new Error("Invalid AI response: missing options array");
  }

  // Validate and sanitize each option
  const options: ThemeOption[] = parsed.options.slice(0, 3).map((opt) => ({
    name: opt.name || "Untitled",
    theme: validateGeneratedTheme(opt.theme),
    reasoning: opt.reasoning || "",
  }));

  // Ensure we have exactly 3 options
  while (options.length < 3) {
    options.push({
      name: `Option ${options.length + 1}`,
      theme: getDefaultTheme(),
      reasoning: "Default theme (AI returned fewer than 3 options)",
    });
  }

  return { options };
}

// ---------- URL Style Extraction ----------

export async function extractStylesFromUrls(
  urls: string[]
): Promise<UrlStyleExtraction[]> {
  const results = await Promise.allSettled(
    urls.map((url) => extractStylesFromUrl(url))
  );

  return results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    return { url: urls[i], error: "Failed to fetch" };
  });
}

async function extractStylesFromUrl(url: string): Promise<UrlStyleExtraction> {
  // SSRF protection
  try {
    await validateExternalUrl(url);
  } catch (error) {
    return { url, error: error instanceof Error ? error.message : "URL validation failed" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FieldServiceBot/1.0; +https://fieldservicepro.com)",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return { url, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const styles = extractStyleSignals(html);
    return { url, styles };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { url, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

function extractStyleSignals(html: string): string {
  const signals: string[] = [];

  // Theme color meta tag
  const themeColorMatch = html.match(
    /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i
  );
  if (themeColorMatch) {
    signals.push(`Theme color: ${themeColorMatch[1]}`);
  }

  // CSS custom properties from inline styles
  const cssVarMatches = html.matchAll(
    /--((?:primary|brand|color|accent|secondary|main|bg|background)[a-z-]*)\s*:\s*([^;}{]+)/gi
  );
  const cssVars = new Set<string>();
  for (const match of cssVarMatches) {
    const value = match[2].trim();
    if (value && !value.includes("var(")) {
      cssVars.add(`--${match[1]}: ${value}`);
    }
    if (cssVars.size >= 10) break;
  }
  if (cssVars.size > 0) {
    signals.push(`CSS variables found: ${[...cssVars].join(", ")}`);
  }

  // Google Fonts references
  const fontMatches = html.matchAll(
    /fonts\.googleapis\.com\/css2?\?family=([^"&]+)/gi
  );
  const fonts = new Set<string>();
  for (const match of fontMatches) {
    const fontName = decodeURIComponent(match[1]).replace(/\+/g, " ").split(":")[0];
    fonts.add(fontName);
  }
  if (fonts.size > 0) {
    signals.push(`Google Fonts: ${[...fonts].join(", ")}`);
  }

  // Prominent color declarations (from inline styles)
  const colorMatches = html.matchAll(
    /(?:background-color|color|border-color)\s*:\s*(#[0-9a-fA-F]{3,8})\b/gi
  );
  const colors = new Set<string>();
  for (const match of colorMatches) {
    colors.add(match[1]);
    if (colors.size >= 8) break;
  }
  if (colors.size > 0) {
    signals.push(`Colors found in styles: ${[...colors].join(", ")}`);
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    signals.push(`Page title: ${titleMatch[1].trim()}`);
  }

  return signals.length > 0
    ? signals.join("\n")
    : "No style signals could be extracted from this URL.";
}

// ---------- Validation ----------

export function validateGeneratedTheme(
  raw: Record<string, string>
): SiteTheme {
  return {
    primaryColor: validateHexColor(raw.primaryColor) || "#2563eb",
    secondaryColor: validateHexColor(raw.secondaryColor) || "#1e40af",
    accentColor: validateHexColor(raw.accentColor) || "#f59e0b",
    fontHeading: validateFont(raw.fontHeading) || "Inter",
    fontBody: validateFont(raw.fontBody) || "Inter",
    borderRadius: validateBorderRadius(raw.borderRadius) || "0.5rem",
    style: "ai-generated",
  };
}

function validateHexColor(color: string | undefined): string | null {
  if (!color) return null;
  const cleaned = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned;
  // Try to fix 3-digit hex
  if (/^#[0-9a-fA-F]{3}$/.test(cleaned)) {
    return `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`;
  }
  return null;
}

function validateFont(font: string | undefined): string | null {
  if (!font) return null;
  const found = ALLOWED_FONTS.find(
    (f) => f.toLowerCase() === font.trim().toLowerCase()
  );
  return found || null;
}

function validateBorderRadius(radius: string | undefined): string | null {
  if (!radius) return null;
  const found = ALLOWED_BORDER_RADII.find(
    (r) => r === radius.trim()
  );
  return found || null;
}

function getDefaultTheme(): SiteTheme {
  return {
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    accentColor: "#f59e0b",
    fontHeading: "Inter",
    fontBody: "Inter",
    borderRadius: "0.5rem",
    style: "ai-generated",
  };
}

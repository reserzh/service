import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

export const AI_MODEL = "claude-sonnet-4-6";

let _client: Anthropic | undefined;

export function getAIClient(): Anthropic {
  if (!_client) {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export function isAIConfigured(): boolean {
  return !!env.ANTHROPIC_API_KEY;
}

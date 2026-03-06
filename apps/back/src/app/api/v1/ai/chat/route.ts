import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAIClient, AI_MODEL, isAIConfigured } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { AI_TOOLS } from "@/lib/ai/tools";
import { executeTool } from "@/lib/ai/tool-executor";
import {
  createConversation,
  addMessage,
  getConversation,
  getConversationMessages,
} from "@/lib/services/ai";
import type Anthropic from "@anthropic-ai/sdk";

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});

const MAX_TOOL_CALLS = 5;
const MAX_HISTORY_MESSAGES = 50;

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "ai_assistant", "read");

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "AI Assistant is not configured" } },
        { status: 503 }
      );
    }

    // Rate limit: 20 AI requests per minute per user
    const rl = await checkRateLimit(`ai:${ctx.userId}`, {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment." } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, conversationId: existingConvId } = chatSchema.parse(body);

    // Create or validate existing conversation
    let conversationId = existingConvId;
    if (conversationId) {
      // Verify ownership (throws NotFoundError if not owned by this user/tenant)
      await getConversation(ctx, conversationId);
    } else {
      const conv = await createConversation(ctx, message.slice(0, 100));
      conversationId = conv.id;
    }

    // Save user message
    await addMessage(ctx, conversationId, "user", message);

    // Load conversation history (tenant-scoped)
    const historyMessages = await getConversationMessages(
      ctx,
      conversationId,
      MAX_HISTORY_MESSAGES
    );

    // Build Claude messages from history (excluding the just-added user message since it's included)
    const claudeMessages: Anthropic.MessageParam[] = historyMessages.map(
      (m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    // Stream response via SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const client = getAIClient();
          let fullResponse = "";
          let toolCallCount = 0;
          let currentMessages = [...claudeMessages];

          // Send conversation ID as first event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "conversation_id", id: conversationId })}\n\n`
            )
          );

          // Tool use loop
          while (true) {
            const response = await client.messages.create({
              model: AI_MODEL,
              max_tokens: 4096,
              system: buildSystemPrompt(ctx),
              tools: AI_TOOLS,
              messages: currentMessages,
              stream: true,
            });

            let assistantText = "";
            let toolUseBlocks: Array<{
              id: string;
              name: string;
              input: Record<string, unknown>;
            }> = [];
            let currentToolId = "";
            let currentToolName = "";
            let currentToolInput = "";

            for await (const event of response) {
              if (event.type === "content_block_start") {
                if (event.content_block.type === "text") {
                  // Text block starting
                } else if (event.content_block.type === "tool_use") {
                  currentToolId = event.content_block.id;
                  currentToolName = event.content_block.name;
                  currentToolInput = "";
                  // Notify client about tool use
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "tool_use", name: currentToolName })}\n\n`
                    )
                  );
                }
              } else if (event.type === "content_block_delta") {
                if (event.delta.type === "text_delta") {
                  assistantText += event.delta.text;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "text_delta", text: event.delta.text })}\n\n`
                    )
                  );
                } else if (event.delta.type === "input_json_delta") {
                  currentToolInput += event.delta.partial_json;
                }
              } else if (event.type === "content_block_stop") {
                if (currentToolId) {
                  try {
                    const parsedInput = JSON.parse(currentToolInput || "{}");
                    toolUseBlocks.push({
                      id: currentToolId,
                      name: currentToolName,
                      input: parsedInput,
                    });
                  } catch {
                    toolUseBlocks.push({
                      id: currentToolId,
                      name: currentToolName,
                      input: {},
                    });
                  }
                  currentToolId = "";
                  currentToolName = "";
                  currentToolInput = "";
                }
              }
            }

            fullResponse += assistantText;

            // If no tool calls, we're done
            if (toolUseBlocks.length === 0) {
              break;
            }

            // Check tool call limit
            toolCallCount += toolUseBlocks.length;
            if (toolCallCount > MAX_TOOL_CALLS) {
              break;
            }

            // Build assistant content blocks for the multi-turn
            const assistantContent: Anthropic.ContentBlockParam[] = [];
            if (assistantText) {
              assistantContent.push({ type: "text", text: assistantText });
            }
            for (const tool of toolUseBlocks) {
              assistantContent.push({
                type: "tool_use",
                id: tool.id,
                name: tool.name,
                input: tool.input,
              });
            }

            // Execute tools and build results
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const tool of toolUseBlocks) {
              const result = await executeTool(
                tool.name,
                tool.input as Record<string, unknown>,
                ctx
              );
              toolResults.push({
                type: "tool_result",
                tool_use_id: tool.id,
                content: result,
              });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_result", name: tool.name })}\n\n`
                )
              );
            }

            // Add to messages for next turn
            currentMessages = [
              ...currentMessages,
              { role: "assistant", content: assistantContent },
              { role: "user", content: toolResults },
            ];

            // Reset for next iteration
            toolUseBlocks = [];
          }

          // Extract metadata (charts, tables) from the response
          const metadata = extractMetadata(fullResponse);

          // Save assistant message
          await addMessage(
            ctx,
            conversationId!,
            "assistant",
            fullResponse,
            metadata
          );

          // Send metadata event if present
          if (metadata) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "metadata", data: metadata })}\n\n`
              )
            );
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("[AI Chat] Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "An error occurred while processing your request." })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-Id": conversationId!,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function extractMetadata(
  text: string
): Record<string, unknown> | undefined {
  const charts: unknown[] = [];
  const tables: unknown[] = [];

  // Extract <chart>...</chart>
  const chartRegex = /<chart>([\s\S]*?)<\/chart>/g;
  let match;
  while ((match = chartRegex.exec(text)) !== null) {
    try {
      charts.push(JSON.parse(match[1]));
    } catch {
      // Skip malformed chart data
    }
  }

  // Extract <report-table>...</report-table>
  const tableRegex = /<report-table>([\s\S]*?)<\/report-table>/g;
  while ((match = tableRegex.exec(text)) !== null) {
    try {
      tables.push(JSON.parse(match[1]));
    } catch {
      // Skip malformed table data
    }
  }

  if (charts.length === 0 && tables.length === 0) return undefined;
  return {
    ...(charts.length > 0 && { charts }),
    ...(tables.length > 0 && { tables }),
  };
}

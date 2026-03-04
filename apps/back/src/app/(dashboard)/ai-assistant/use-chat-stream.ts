"use client";

import { useState, useCallback, useRef } from "react";

export interface QueryDefinition {
  tools: Array<{ name: string; params: Record<string, unknown> }>;
  prompt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    charts?: ChartData[];
    tables?: TableData[];
    queryDefinitions?: QueryDefinition[];
  };
  isStreaming?: boolean;
  toolEvents?: ToolEvent[];
}

export interface ChartData {
  type: "bar" | "line" | "pie" | "area";
  title: string;
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
  data: Record<string, unknown>[];
}

export interface TableData {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface ToolEvent {
  name: string;
  status: "running" | "done";
}

interface UseChatStreamReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  conversationId: string | null;
  sendMessage: (text: string, convId?: string | null) => Promise<void>;
  cancel: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setConversationId: React.Dispatch<React.SetStateAction<string | null>>;
}

const TOOL_LABELS: Record<string, string> = {
  search_customers: "Searching customers",
  get_customer: "Loading customer details",
  search_jobs: "Searching jobs",
  get_job: "Loading job details",
  search_invoices: "Searching invoices",
  get_invoice: "Loading invoice details",
  search_estimates: "Searching estimates",
  get_estimate: "Loading estimate details",
  search_agreements: "Searching agreements",
  get_dashboard_stats: "Fetching dashboard stats",
  get_revenue_report: "Generating revenue report",
  get_jobs_report: "Generating jobs report",
  get_invoice_report: "Generating invoice report",
  get_technician_report: "Generating technician report",
  get_team_members: "Loading team members",
  get_pricebook_items: "Searching pricebook",
};

export function useChatStream(): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string, convId?: string | null) => {
      const activeConvId = convId ?? conversationId;
      const abortController = new AbortController();
      abortRef.current = abortController;

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };

      // Add placeholder assistant message
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
        toolEvents: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/v1/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversationId: activeConvId || undefined,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          const errMsg =
            errData?.error?.message || `Error: ${response.statusText}`;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: errMsg, isStreaming: false }
                : m
            )
          );
          setIsStreaming(false);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  const metadata = extractMetadataFromContent(m.content);
                  return {
                    ...m,
                    isStreaming: false,
                    metadata,
                    toolEvents: m.toolEvents?.map((t) => ({
                      ...t,
                      status: "done" as const,
                    })),
                  };
                })
              );
              setIsStreaming(false);
              continue;
            }

            try {
              const event = JSON.parse(data);

              if (event.type === "conversation_id") {
                setConversationId(event.id);
              } else if (event.type === "text_delta") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.text }
                      : m
                  )
                );
              } else if (event.type === "tool_use") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          toolEvents: [
                            ...(m.toolEvents || []),
                            {
                              name:
                                TOOL_LABELS[event.name] || event.name,
                              status: "running" as const,
                            },
                          ],
                        }
                      : m
                  )
                );
              } else if (event.type === "tool_result") {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantId) return m;
                    const toolEvents = (m.toolEvents || []).map((t) =>
                      t.name ===
                      (TOOL_LABELS[event.name] || event.name)
                        ? { ...t, status: "done" as const }
                        : t
                    );
                    return { ...m, toolEvents };
                  })
                );
              } else if (event.type === "metadata") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, metadata: event.data }
                      : m
                  )
                );
              } else if (event.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content:
                            m.content || `Error: ${event.message}`,
                          isStreaming: false,
                        }
                      : m
                  )
                );
                setIsStreaming(false);
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return; // User cancelled
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Sorry, something went wrong. Please try again.",
                  isStreaming: false,
                }
              : m
          )
        );
        setIsStreaming(false);
      }
    },
    [conversationId]
  );

  return {
    messages,
    isStreaming,
    conversationId,
    sendMessage,
    cancel,
    setMessages,
    setConversationId,
  };
}

function extractMetadataFromContent(content: string) {
  const charts: ChartData[] = [];
  const tables: TableData[] = [];
  const queryDefinitions: QueryDefinition[] = [];

  const chartRegex = /<chart>([\s\S]*?)<\/chart>/g;
  let match;
  while ((match = chartRegex.exec(content)) !== null) {
    try {
      charts.push(JSON.parse(match[1]));
    } catch {
      /* skip */
    }
  }

  const tableRegex = /<report-table>([\s\S]*?)<\/report-table>/g;
  while ((match = tableRegex.exec(content)) !== null) {
    try {
      tables.push(JSON.parse(match[1]));
    } catch {
      /* skip */
    }
  }

  const qdRegex = /<query-definition>([\s\S]*?)<\/query-definition>/g;
  while ((match = qdRegex.exec(content)) !== null) {
    try {
      queryDefinitions.push(JSON.parse(match[1]));
    } catch {
      /* skip */
    }
  }

  if (charts.length === 0 && tables.length === 0 && queryDefinitions.length === 0) return undefined;
  return {
    ...(charts.length > 0 && { charts }),
    ...(tables.length > 0 && { tables }),
    ...(queryDefinitions.length > 0 && { queryDefinitions }),
  };
}

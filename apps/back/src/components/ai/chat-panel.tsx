"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Bot, SendHorizontal, Square, Loader2, User, Pin, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChartRenderer } from "./chart-renderer";
import { ReportDownload } from "./report-download";
import type { ChartData } from "./chart-renderer";
import type { TableData } from "./report-download";

// Re-export for consumers
export type { ChartData, TableData };

export interface QueryDefinition {
  tools: Array<{ name: string; params: Record<string, unknown> }>;
  prompt: string;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConversationId?: string | null;
  onChartGenerated?: (chart: ChartData, queryDef: QueryDefinition) => void;
  onTableGenerated?: (table: TableData, queryDef: QueryDefinition) => void;
  actionLabel?: "Pin to Dashboard" | "Save as Report";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    charts?: ChartData[];
    tables?: TableData[];
    queryDefinitions?: QueryDefinition[];
  };
  isStreaming?: boolean;
  toolEvents?: Array<{ name: string; status: "running" | "done" }>;
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

export function ChatPanel({
  open,
  onOpenChange,
  initialConversationId,
  onChartGenerated,
  onTableGenerated,
  actionLabel = "Pin to Dashboard",
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load existing conversation if provided
  useEffect(() => {
    if (!open) return;
    if (initialConversationId && initialConversationId !== conversationId) {
      setConversationId(initialConversationId);
      loadConversation(initialConversationId);
    }
    if (!initialConversationId && messages.length === 0) {
      setConversationId(null);
    }
  }, [open, initialConversationId]);

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/ai/conversations/${id}`);
      if (!res.ok) return;
      const json = await res.json();
      const conv = json.data;
      setMessages(
        conv.messages.map(
          (m: { id: string; role: string; content: string; metadata?: Record<string, unknown> }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            metadata: m.metadata as ChatMessage["metadata"],
          })
        )
      );
    } catch {
      // Ignore
    }
  };

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const abortController = new AbortController();
      abortRef.current = abortController;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };

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
            conversationId: conversationId || undefined,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          const errMsg = errData?.error?.message || `Error: ${response.statusText}`;
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
                  const metadata = extractMetadata(m.content);
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
                              name: TOOL_LABELS[event.name] || event.name,
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
                      t.name === (TOOL_LABELS[event.name] || event.name)
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
                          content: m.content || `Error: ${event.message}`,
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
        if (error instanceof DOMException && error.name === "AbortError") return;
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

  const handleSubmit = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming) return;
    sendMessage(text);
    el.value = "";
    el.style.height = "auto";
  }, [sendMessage, isStreaming]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handlePinChart = (chart: ChartData, msg: ChatMessage) => {
    const qd: QueryDefinition = msg.metadata?.queryDefinitions?.[0] ?? {
      tools: [],
      prompt: msg.content,
    };
    onChartGenerated?.(chart, qd);
  };

  const handleSaveTable = (table: TableData, msg: ChatMessage) => {
    const qd: QueryDefinition = msg.metadata?.queryDefinitions?.[0] ?? {
      tools: [],
      prompt: msg.content,
    };
    onTableGenerated?.(table, qd);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4" />
            AI Assistant
          </SheetTitle>
        </SheetHeader>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-sm text-muted-foreground">
                <Bot className="mx-auto mb-3 h-8 w-8" />
                <p>Ask me to create a chart or report.</p>
                <p className="mt-1 text-xs">
                  e.g. &quot;Show monthly revenue for the last 6 months&quot;
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <PanelMessage
                  key={msg.id}
                  message={msg}
                  actionLabel={actionLabel}
                  onPinChart={(chart) => handlePinChart(chart, msg)}
                  onSaveTable={(table) => handleSaveTable(table, msg)}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t bg-background p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              placeholder="Describe the chart or report you want..."
              className="flex-1 resize-none rounded-lg border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={1}
              maxLength={2000}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
            />
            {isStreaming ? (
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 shrink-0 rounded-lg"
                onClick={cancel}
                aria-label="Stop generating"
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg"
                onClick={handleSubmit}
                aria-label="Send message"
              >
                <SendHorizontal className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PanelMessage({
  message,
  actionLabel,
  onPinChart,
  onSaveTable,
}: {
  message: ChatMessage;
  actionLabel: string;
  onPinChart: (chart: ChartData) => void;
  onSaveTable: (table: TableData) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      <div className={`max-w-[85%] space-y-2 ${isUser ? "text-right" : ""}`}>
        {/* Tool events */}
        {message.toolEvents && message.toolEvents.length > 0 && (
          <div className="space-y-0.5">
            {message.toolEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {event.status === "running" ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <span className="h-2.5 w-2.5 text-center text-green-500">&#10003;</span>
                )}
                <span>{event.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Text */}
        {message.content && (
          <div
            className={`inline-block rounded-lg px-3 py-2 text-sm ${
              isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            <PanelTextContent content={stripTags(message.content)} />
            {message.isStreaming && (
              <span className="ml-1 inline-block h-3.5 w-0.5 animate-pulse bg-current" />
            )}
          </div>
        )}

        {/* Charts with action buttons */}
        {message.metadata?.charts?.map((chart, i) => (
          <div key={`chart-${i}`} className="space-y-2">
            <ChartRenderer data={chart} height={200} />
            {onPinChart && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onPinChart(chart)}
              >
                {actionLabel === "Pin to Dashboard" ? (
                  <Pin className="mr-1.5 h-3 w-3" />
                ) : (
                  <FileBarChart className="mr-1.5 h-3 w-3" />
                )}
                {actionLabel}
              </Button>
            )}
          </div>
        ))}

        {/* Tables with action buttons */}
        {message.metadata?.tables?.map((table, i) => (
          <div key={`table-${i}`} className="space-y-2">
            <ReportDownload data={table} />
            {onSaveTable && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onSaveTable(table)}
              >
                <FileBarChart className="mr-1.5 h-3 w-3" />
                {actionLabel}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Strip special tags from visible text */
function stripTags(text: string): string {
  return text
    .replace(/<chart>[\s\S]*?<\/chart>/g, "")
    .replace(/<report-table>[\s\S]*?<\/report-table>/g, "")
    .replace(/<query-definition>[\s\S]*?<\/query-definition>/g, "")
    .trim();
}

/** Simple inline text renderer */
function PanelTextContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <p key={i} className="mt-2 mb-1 font-semibold text-sm">{line.slice(4)}</p>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <p key={i} className="mt-2 mb-1 font-semibold">{line.slice(3)}</p>
      );
      continue;
    }
    if (line.match(/^[-*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-1.5 text-sm">
          <span className="text-muted-foreground">&bull;</span>
          <span>{line.slice(2)}</span>
        </div>
      );
      continue;
    }
    elements.push(<p key={i}>{line}</p>);
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function extractMetadata(content: string) {
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

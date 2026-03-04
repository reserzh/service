"use client";

import { Bot, User, Loader2 } from "lucide-react";
import type { ChatMessage, ToolEvent } from "./use-chat-stream";
import { ChartRenderer } from "./chart-renderer";
import { ReportDownload } from "./report-download";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div
        className={`max-w-[75%] space-y-3 ${isUser ? "text-right" : ""}`}
      >
        {/* Tool activity indicators */}
        {message.toolEvents && message.toolEvents.length > 0 && (
          <div className="space-y-1">
            {message.toolEvents.map((event, i) => (
              <ToolEventBadge key={i} event={event} />
            ))}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <div
            className={`inline-block rounded-xl px-4 py-3 text-sm ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <MarkdownContent content={stripTags(message.content)} />
            {message.isStreaming && (
              <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
            )}
          </div>
        )}

        {/* Charts */}
        {message.metadata?.charts?.map((chart, i) => (
          <ChartRenderer key={`chart-${i}`} data={chart} />
        ))}

        {/* Exportable tables */}
        {message.metadata?.tables?.map((table, i) => (
          <ReportDownload key={`table-${i}`} data={table} />
        ))}
      </div>
    </div>
  );
}

function ToolEventBadge({ event }: { event: ToolEvent }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {event.status === "running" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span className="h-3 w-3 text-center text-green-500">✓</span>
      )}
      <span>{event.name}</span>
    </div>
  );
}

/** Strip <chart> and <report-table> tags from visible text */
function stripTags(text: string): string {
  return text
    .replace(/<chart>[\s\S]*?<\/chart>/g, "")
    .replace(/<report-table>[\s\S]*?<\/report-table>/g, "")
    .trim();
}

/** Lightweight markdown renderer */
function MarkdownContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-2 overflow-x-auto rounded-lg bg-background/50 p-3 text-xs"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Table detection
    if (line.includes("|") && line.trim().startsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      // Skip separator rows
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;

      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(cells);
      // Check if next line is NOT a table row
      const nextLine = lines[i + 1];
      if (
        !nextLine ||
        !nextLine.includes("|") ||
        !nextLine.trim().startsWith("|")
      ) {
        // Flush table
        if (tableRows.length > 0) {
          const [header, ...rows] = tableRows;
          elements.push(
            <div key={`table-${i}`} className="my-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {header.map((cell, ci) => (
                      <th
                        key={ci}
                        className="px-3 py-2 text-left font-medium"
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} className="border-b last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        inTable = false;
        tableRows = [];
      }
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="mt-3 mb-1 font-semibold">
          {formatInline(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="mt-3 mb-1 text-base font-semibold">
          {formatInline(line.slice(3))}
        </h3>
      );
      continue;
    }

    // List items
    if (line.match(/^[-*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2">
          <span className="text-muted-foreground">•</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2">
          <span className="text-muted-foreground">{numMatch[1]}.</span>
          <span>{formatInline(line.slice(numMatch[0].length))}</span>
        </div>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i}>{formatInline(line)}</p>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

/** Format inline markdown: bold, italic, code */
function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-background/50 px-1 py-0.5 text-xs"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Regular text up to next special char
    const nextSpecial = remaining.search(/[`*]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    }
    if (nextSpecial === 0) {
      // Single special char, treat as text
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

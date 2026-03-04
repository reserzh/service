"use client";

import { useRef, useEffect, useCallback } from "react";
import { SendHorizontal, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onCancel,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [resize]);

  const handleSubmit = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming || disabled) return;
    onSend(text);
    el.value = "";
    resize();
  }, [onSend, isStreaming, disabled, resize]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={textareaRef}
          placeholder="Ask about your customers, jobs, invoices, reports..."
          className="flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={1}
          maxLength={2000}
          onInput={resize}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        {isStreaming ? (
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 shrink-0 rounded-xl"
            onClick={onCancel}
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            onClick={handleSubmit}
            disabled={disabled}
            aria-label="Send message"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
        AI can make mistakes. Always verify important data.
      </p>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Bot, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useChatStream } from "./use-chat-stream";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatArea } from "./chat-area";
import { ChatInput } from "./chat-input";
import { SuggestedPrompts } from "./suggested-prompts";

interface AIAssistantViewProps {
  configured: boolean;
  user: { firstName: string; role: string };
}

export function AIAssistantView({ configured, user }: AIAssistantViewProps) {
  const {
    messages,
    isStreaming,
    conversationId,
    sendMessage,
    cancel,
    setMessages,
    setConversationId,
  } = useChatStream();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSend = useCallback(
    async (text: string) => {
      await sendMessage(text);
      // Trigger sidebar refresh after sending (new conversation may be created)
      setRefreshKey((k) => k + 1);
    },
    [sendMessage]
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, [setMessages, setConversationId]);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/v1/ai/conversations/${id}`);
        if (!res.ok) return;
        const json = await res.json();
        const conv = json.data;
        setConversationId(id);
        setMessages(
          conv.messages.map(
            (m: { id: string; role: string; content: string; metadata?: Record<string, unknown> }) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              metadata: m.metadata as any,
            })
          )
        );
      } catch {
        // Ignore
      }
    },
    [setConversationId, setMessages]
  );

  if (!configured) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="max-w-sm space-y-3 text-center">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">AI Assistant Not Configured</h2>
          <p className="text-sm text-muted-foreground">
            The AI Assistant requires an Anthropic API key. Please contact your
            administrator to set up the <code>ANTHROPIC_API_KEY</code>{" "}
            environment variable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <div
        className={`hidden transition-all duration-200 lg:block ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <ConversationSidebar
          activeId={conversationId}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          refreshKey={refreshKey}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-2 border-b px-4 py-2">
          {/* Desktop toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile sheet trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 lg:hidden"
                aria-label="Open conversations"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <ConversationSidebar
                activeId={conversationId}
                onSelect={(id) => {
                  handleSelectConversation(id);
                }}
                onNewChat={handleNewChat}
                refreshKey={refreshKey}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-medium">AI Assistant</h1>
          </div>
        </div>

        {/* Chat content or welcome screen */}
        {messages.length === 0 ? (
          <SuggestedPrompts
            firstName={user.firstName}
            onSelect={handleSend}
          />
        ) : (
          <ChatArea messages={messages} />
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onCancel={cancel}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}

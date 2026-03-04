"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface ConversationSidebarProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  refreshKey?: number;
}

export function ConversationSidebar({
  activeId,
  onSelect,
  onNewChat,
  refreshKey,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/ai/conversations?pageSize=50");
      if (res.ok) {
        const json = await res.json();
        setConversations(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, refreshKey]);

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    await fetch(`/api/v1/ai/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle.trim() }),
    });
    setEditingId(null);
    fetchConversations();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/ai/conversations/${id}`, { method: "DELETE" });
    fetchConversations();
    if (activeId === id) onNewChat();
  };

  return (
    <div className="flex h-full flex-col border-r">
      <div className="border-b p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent ${
                    activeId === conv.id ? "bg-accent" : ""
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />

                  {editingId === conv.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleRename(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(conv.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-6 text-xs"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => onSelect(conv.id)}
                      className="flex-1 truncate text-left"
                    >
                      {conv.title}
                    </button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="invisible shrink-0 rounded p-0.5 hover:bg-muted group-hover:visible">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingId(conv.id);
                          setEditTitle(conv.title);
                        }}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(conv.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import { Pencil, Check, Plus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/ai/chat-panel";
import type { ChartData } from "@/components/ai/chart-renderer";
import type { QueryDefinition } from "@/components/ai/chat-panel";
import { SortableWidget } from "./sortable-widget";
import { AIWidgetCard } from "./ai-widget-card";
import { saveDashboardLayoutAction, pinAIWidgetAction, removeAIWidgetAction } from "@/actions/dashboard";
import type { AIWidgetData, UserLayoutConfig, BuiltInWidgetId } from "./layouts/types";

interface CustomizableDashboardProps {
  children: React.ReactNode;
  aiWidgets: AIWidgetData[];
  userLayout: UserLayoutConfig | null;
  builtInWidgetIds: BuiltInWidgetId[];
  aiConfigured: boolean;
}

export function CustomizableDashboard({
  children,
  aiWidgets,
  userLayout,
  builtInWidgetIds,
  aiConfigured,
}: CustomizableDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [refineConversationId, setRefineConversationId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Build ordered list of AI widget IDs
  const defaultAiOrder = aiWidgets.map((w) => `ai-widget-${w.id}`);
  const savedAiOrder = userLayout?.widgetOrder?.filter((id) =>
    id.startsWith("ai-widget-")
  );
  const initialAiOrder = savedAiOrder?.length ? savedAiOrder : defaultAiOrder;

  const [aiOrder, setAiOrder] = useState<string[]>(initialAiOrder);
  const [widgetSizes, setWidgetSizes] = useState<Record<string, "full" | "half">>(
    userLayout?.widgetSizes ?? {}
  );

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => {
    setDragId(id);
  }, []);

  const handleDragOver = useCallback((id: string) => {
    setDragOverId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragId && dragOverId && dragId !== dragOverId) {
      setAiOrder((prev) => {
        const oldIndex = prev.indexOf(dragId);
        const newIndex = prev.indexOf(dragOverId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const newOrder = [...prev];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, dragId);

        // Build full widget order for save
        const fullOrder = [...builtInWidgetIds, ...newOrder];
        startTransition(() => {
          saveDashboardLayoutAction(fullOrder, widgetSizes);
        });

        return newOrder;
      });
    }
    setDragId(null);
    setDragOverId(null);
  }, [dragId, dragOverId, builtInWidgetIds, widgetSizes]);

  const handleToggleSize = useCallback(
    (id: string) => {
      setWidgetSizes((prev) => {
        const current = prev[id] ?? "half";
        const next: "full" | "half" = current === "full" ? "half" : "full";
        const updated: Record<string, "full" | "half"> = { ...prev, [id]: next };

        const fullOrder = [...builtInWidgetIds, ...aiOrder];
        startTransition(() => {
          saveDashboardLayoutAction(fullOrder, updated);
        });

        return updated;
      });
    },
    [builtInWidgetIds, aiOrder]
  );

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      const dbId = widgetId.replace("ai-widget-", "");
      setAiOrder((prev) => prev.filter((id) => id !== widgetId));
      startTransition(() => {
        removeAIWidgetAction(dbId);
      });
    },
    []
  );

  const handleChartGenerated = useCallback(
    (chart: ChartData, queryDef: QueryDefinition) => {
      startTransition(async () => {
        const result = await pinAIWidgetAction({
          title: chart.title || "AI Chart",
          widgetConfig: {
            chartType: chart.type,
            xKey: chart.xKey,
            yKey: chart.yKey,
            nameKey: chart.nameKey,
            valueKey: chart.valueKey,
          },
          queryDefinition: queryDef,
          cachedData: { data: chart.data } as Record<string, unknown>,
        });
        if (result.success && result.widgetId) {
          const newId = `ai-widget-${result.widgetId}`;
          setAiOrder((prev) => [...prev, newId]);
          const fullOrder = [...builtInWidgetIds, ...aiOrder, newId];
          saveDashboardLayoutAction(fullOrder, widgetSizes);
        }
        setChatOpen(false);
      });
    },
    [builtInWidgetIds, aiOrder, widgetSizes]
  );

  const handleRefine = useCallback((conversationId: string | null) => {
    setRefineConversationId(conversationId);
    setChatOpen(true);
  }, []);

  const aiWidgetMap = new Map(aiWidgets.map((w) => [`ai-widget-${w.id}`, w]));

  return (
    <div className="space-y-6">
      {/* Customize toolbar */}
      <div className="flex items-center justify-end gap-2">
        {isEditing && aiConfigured && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefineConversationId(null);
              setChatOpen(true);
            }}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add AI Chart
          </Button>
        )}
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing((e) => !e)}
        >
          {isEditing ? (
            <>
              <Check className="mr-2 h-3.5 w-3.5" />
              Done
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Customize
            </>
          )}
        </Button>
      </div>

      {/* Main preset layout */}
      {children}

      {/* AI Widgets grid */}
      {aiOrder.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {aiOrder.map((widgetId) => {
            const widget = aiWidgetMap.get(widgetId);
            if (!widget) return null;
            const size = widgetSizes[widgetId] ?? "half";

            return (
              <SortableWidget
                key={widgetId}
                id={widgetId}
                isEditing={isEditing}
                size={size}
                isAIWidget
                onRemove={() => handleRemoveWidget(widgetId)}
                onToggleSize={() => handleToggleSize(widgetId)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                isDragging={dragId === widgetId}
                isDragOver={dragOverId === widgetId}
              >
                <AIWidgetCard
                  widget={widget}
                  onRefine={
                    aiConfigured
                      ? () => handleRefine(widget.conversationId)
                      : undefined
                  }
                />
              </SortableWidget>
            );
          })}
        </div>
      )}

      {/* Empty state for AI widgets */}
      {aiWidgets.length === 0 && !isEditing && aiConfigured && (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <Bot className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click &quot;Customize&quot; to add AI-generated charts to your dashboard.
          </p>
        </div>
      )}

      {/* AI Chat Panel */}
      {aiConfigured && (
        <ChatPanel
          open={chatOpen}
          onOpenChange={setChatOpen}
          initialConversationId={refineConversationId}
          onChartGenerated={handleChartGenerated}
          actionLabel="Pin to Dashboard"
        />
      )}
    </div>
  );
}

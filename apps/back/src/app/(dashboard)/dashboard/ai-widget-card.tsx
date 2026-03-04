"use client";

import { useState, useTransition } from "react";
import { MessageSquare, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartRenderer } from "@/components/ai/chart-renderer";
import type { ChartData } from "@/components/ai/chart-renderer";
import type { AIWidgetData } from "./layouts/types";

interface AIWidgetCardProps {
  widget: AIWidgetData;
  onRefine?: () => void;
}

export function AIWidgetCard({ widget, onRefine }: AIWidgetCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  const chartData: ChartData = {
    type: widget.widgetConfig.chartType,
    title: "",
    xKey: widget.widgetConfig.xKey,
    yKey: widget.widgetConfig.yKey,
    nameKey: widget.widgetConfig.nameKey,
    valueKey: widget.widgetConfig.valueKey,
    data: (widget.cachedData as Record<string, unknown>[] | null) ?? [],
  };

  // Check if data is an array at the top level or nested
  if (widget.cachedData && !Array.isArray(widget.cachedData)) {
    // If cached data has a "data" key, use it
    const cd = widget.cachedData as Record<string, unknown>;
    if (Array.isArray(cd.data)) {
      chartData.data = cd.data as Record<string, unknown>[];
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      // Re-fetch by navigating (triggers server-side re-query)
      window.location.reload();
    });
  };

  const lastUpdated = widget.lastRefreshedAt
    ? formatTimeAgo(new Date(widget.lastRefreshedAt))
    : "never";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        <div className="flex items-center gap-1">
          {onRefine && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefine}
              aria-label="Refine with AI"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh data"
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.data.length > 0 ? (
          <div className="-mx-2">
            <ChartRenderer data={chartData} height={200} className="border-0 p-0" />
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Updated {lastUpdated}
        </p>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

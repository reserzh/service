"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Monitor,
  Smartphone,
  Globe,
  Users,
  Server,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Calendar,
  FlaskConical,
} from "lucide-react";
import { featureComponents, type FeatureStatus, type FeatureComponent } from "./feature-data";

const componentIcons: Record<string, React.ElementType> = {
  admin: Monitor,
  mobile: Smartphone,
  website: Globe,
  portal: Users,
  platform: Server,
};

const statusConfig: Record<FeatureStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  complete: { label: "Complete", variant: "default", icon: CheckCircle2 },
  "in-progress": { label: "In Progress", variant: "secondary", icon: Clock },
  planned: { label: "Planned", variant: "outline", icon: Calendar },
  beta: { label: "Beta", variant: "destructive", icon: FlaskConical },
};

function getStats(component: FeatureComponent) {
  let total = 0;
  let complete = 0;
  let inProgress = 0;
  let planned = 0;
  let beta = 0;
  for (const cat of component.categories) {
    for (const f of cat.features) {
      total++;
      if (f.status === "complete") complete++;
      else if (f.status === "in-progress") inProgress++;
      else if (f.status === "planned") planned++;
      else if (f.status === "beta") beta++;
    }
  }
  return { total, complete, inProgress, planned, beta };
}

function getTotalStats() {
  let total = 0;
  let complete = 0;
  for (const comp of featureComponents) {
    for (const cat of comp.categories) {
      for (const f of cat.features) {
        total++;
        if (f.status === "complete") complete++;
      }
    }
  }
  return { total, complete };
}

export default function FeaturesPage() {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const totalStats = getTotalStats();

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    for (const comp of featureComponents) {
      for (const cat of comp.categories) {
        all.add(`${comp.id}-${cat.name}`);
      }
    }
    setExpandedCategories(all);
  };

  const collapseAll = () => setExpandedCategories(new Set());

  const filteredComponents = useMemo(() => {
    if (!search.trim()) return featureComponents;
    const q = search.toLowerCase();
    return featureComponents.map((comp) => ({
      ...comp,
      categories: comp.categories
        .map((cat) => ({
          ...cat,
          features: cat.features.filter(
            (f) =>
              f.name.toLowerCase().includes(q) ||
              f.description.toLowerCase().includes(q) ||
              cat.name.toLowerCase().includes(q)
          ),
        }))
        .filter((cat) => cat.features.length > 0),
    })).filter((comp) => comp.categories.length > 0);
  }, [search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Features"
        description="Complete feature inventory across all components"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Platform Features" },
        ]}
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {featureComponents.map((comp) => {
          const stats = getStats(comp);
          const Icon = componentIcons[comp.id] || Server;
          const pct = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;
          return (
            <Card key={comp.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{comp.name}</p>
                    <p className="text-2xl font-bold">{stats.complete}<span className="text-sm font-normal text-muted-foreground">/{stats.total}</span></p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{pct}% complete</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall stat */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {totalStats.complete} of {totalStats.total} features complete ({Math.round((totalStats.complete / totalStats.total) * 100)}%)
        </span>
        <div className="flex-1" />
        <button onClick={expandAll} className="text-xs hover:text-foreground transition-colors">
          Expand all
        </button>
        <span className="text-muted-foreground/40">|</span>
        <button onClick={collapseAll} className="text-xs hover:text-foreground transition-colors">
          Collapse all
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search features..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabbed feature lists */}
      <Tabs defaultValue="admin">
        <TabsList className="w-full justify-start overflow-x-auto">
          {filteredComponents.map((comp) => {
            const Icon = componentIcons[comp.id] || Server;
            return (
              <TabsTrigger key={comp.id} value={comp.id} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{comp.name}</span>
                <span className="sm:hidden">{comp.name.split(" ")[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {filteredComponents.map((comp) => (
          <TabsContent key={comp.id} value={comp.id} className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">{comp.description}</p>
            {comp.categories.map((cat) => {
              const catKey = `${comp.id}-${cat.name}`;
              const isExpanded = expandedCategories.has(catKey);
              const catComplete = cat.features.filter((f) => f.status === "complete").length;
              return (
                <Card key={cat.name}>
                  <button
                    onClick={() => toggleCategory(catKey)}
                    className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors rounded-t-xl"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {catComplete}/{cat.features.length}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <div className="h-1.5 w-20 rounded-full bg-muted shrink-0">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${cat.features.length > 0 ? (catComplete / cat.features.length) * 100 : 0}%` }}
                      />
                    </div>
                  </button>
                  {isExpanded && (
                    <CardContent className="border-t pt-0 pb-2">
                      <div className="divide-y">
                        {cat.features.map((feature) => {
                          const sc = statusConfig[feature.status];
                          const StatusIcon = sc.icon;
                          return (
                            <div key={feature.name} className="flex items-start gap-3 py-3">
                              <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${feature.status === "complete" ? "text-primary" : "text-muted-foreground"}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{feature.name}</p>
                                <p className="text-xs text-muted-foreground">{feature.description}</p>
                              </div>
                              <Badge variant={sc.variant} className="shrink-0 text-[10px]">
                                {sc.label}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

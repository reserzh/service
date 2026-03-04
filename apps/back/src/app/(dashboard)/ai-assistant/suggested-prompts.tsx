"use client";

import { BarChart3, Users, Receipt, Briefcase } from "lucide-react";

const suggestions = [
  {
    icon: BarChart3,
    label: "Dashboard overview",
    prompt: "Give me an overview of today's dashboard stats",
  },
  {
    icon: Receipt,
    label: "Overdue invoices",
    prompt: "What are my overdue invoices?",
  },
  {
    icon: Briefcase,
    label: "This week's jobs",
    prompt: "Show me all jobs scheduled for this week",
  },
  {
    icon: Users,
    label: "Customer count",
    prompt: "How many customers do I have?",
  },
];

interface SuggestedPromptsProps {
  firstName: string;
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ firstName, onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-lg space-y-6 px-4 text-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Hi {firstName}, how can I help?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask me anything about your customers, jobs, invoices, estimates, or
            reports. I can look up data and generate visual reports.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {suggestions.map((s) => (
            <button
              key={s.prompt}
              onClick={() => onSelect(s.prompt)}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left text-sm transition-colors hover:bg-accent"
            >
              <s.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

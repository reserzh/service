"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Users,
  Briefcase,
  FileText,
  Receipt,
  LayoutDashboard,
  Calendar,
  Truck,
  BarChart3,
  Globe,
  Settings,
  Loader2,
  Plus,
} from "lucide-react";
import { globalSearchAction, type SearchResult } from "@/actions/search";

const pages = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Jobs", href: "/jobs", icon: Briefcase },
  { title: "Estimates", href: "/estimates", icon: FileText },
  { title: "Invoices", href: "/invoices", icon: Receipt },
  { title: "Schedule", href: "/schedule", icon: Calendar },
  { title: "Dispatch", href: "/dispatch", icon: Truck },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Website", href: "/website", icon: Globe },
  { title: "Settings", href: "/settings", icon: Settings },
];

const resultIcons: Record<string, typeof Users> = {
  customer: Users,
  job: Briefcase,
  estimate: FileText,
  invoice: Receipt,
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.trim().length < 2) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(() => {
        startTransition(async () => {
          try {
            const data = await globalSearchAction(value);
            setResults(data);
          } catch {
            setResults([]);
          }
        });
      }, 250);
    },
    []
  );

  function navigate(href: string) {
    onOpenChange(false);
    setQuery("");
    setResults([]);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) {
          setQuery("");
          setResults([]);
        }
      }}
      title="Search"
      description="Search customers, jobs, estimates, invoices, or navigate to a page"
    >
      <CommandInput
        placeholder="Search customers, jobs, invoices..."
        value={query}
        onValueChange={handleSearch}
      />
      <CommandList>
        {isPending && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isPending && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {/* Search results */}
        {results.length > 0 && (
          <>
            {["customer", "job", "estimate", "invoice"].map((type) => {
              const items = results.filter((r) => r.type === type);
              if (items.length === 0) return null;
              const Icon = resultIcons[type];
              const label =
                type === "customer"
                  ? "Customers"
                  : type === "job"
                    ? "Jobs"
                    : type === "estimate"
                      ? "Estimates"
                      : "Invoices";

              return (
                <CommandGroup key={type} heading={label}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.type}-${item.title}-${item.subtitle}`}
                      onSelect={() => navigate(item.href)}
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-1 items-center justify-between">
                        <span className="font-medium">{item.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground truncate max-w-[200px]">
                          {item.subtitle}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
            <CommandSeparator />
          </>
        )}

        {/* Quick actions */}
        {!isPending && (query.length < 2 || results.length > 0) && (
          <CommandGroup heading="Quick Actions">
            <CommandItem value="New Customer" onSelect={() => navigate("/customers")}>
              <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
              New Customer
            </CommandItem>
            <CommandItem value="New Job" onSelect={() => navigate("/jobs/new")}>
              <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
              New Job
            </CommandItem>
            <CommandItem value="New Estimate" onSelect={() => navigate("/estimates/new")}>
              <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
              New Estimate
            </CommandItem>
            <CommandItem value="New Invoice" onSelect={() => navigate("/invoices/new")}>
              <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
              New Invoice
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Quick navigation - always shown */}
        {!isPending && (query.length < 2 || results.length > 0) && (
          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.href}
                value={page.title}
                onSelect={() => navigate(page.href)}
              >
                <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {page.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

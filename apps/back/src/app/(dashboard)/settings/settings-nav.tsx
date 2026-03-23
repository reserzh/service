"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { settingsNavItems } from "@/lib/nav-config";

const sectionOrder = ["General", "Services", "Communications", "System"];

export function SettingsNav() {
  const pathname = usePathname();

  const grouped = sectionOrder
    .map((section) => ({
      section,
      items: settingsNavItems.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {grouped.map((group) => (
        <div key={group.section}>
          <p className="hidden lg:block px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 first:pt-0">
            {group.section}
          </p>
          {group.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

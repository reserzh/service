"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  Wrench,
  Bell,
  Link2,
  CreditCard,
} from "lucide-react";

const navItems = [
  { label: "Company Profile", href: "/settings/company", icon: Building2 },
  { label: "Team Members", href: "/settings/team", icon: Users },
  { label: "Services & Pricing", href: "/settings/services", icon: Wrench },
  { label: "Notifications", href: "/settings/notifications", icon: Bell },
  { label: "Integrations", href: "/settings/integrations", icon: Link2 },
  { label: "Billing", href: "/settings/billing", icon: CreditCard },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
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
    </nav>
  );
}

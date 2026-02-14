"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  Palette,
  Wrench,
  Globe,
  Image,
  CalendarCheck,
  LayoutDashboard,
} from "lucide-react";

const websiteNav = [
  { title: "Overview", href: "/website", icon: LayoutDashboard },
  { title: "Pages", href: "/website/pages", icon: FileText },
  { title: "Theme", href: "/website/theme", icon: Palette },
  { title: "Services", href: "/website/services", icon: Wrench },
  { title: "Domains", href: "/website/domains", icon: Globe },
  { title: "Media", href: "/website/media", icon: Image },
  { title: "Bookings", href: "/website/bookings", icon: CalendarCheck },
];

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 overflow-x-auto border-b pb-px">
        {websiteNav.map((item) => {
          const isActive =
            item.href === "/website"
              ? pathname === "/website"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}

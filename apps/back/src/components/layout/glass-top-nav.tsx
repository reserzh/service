"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  Users,
  Receipt,
  BarChart3,
  Search,
  LogOut,
  User,
  Wrench,
  Settings,
  Sun,
  Moon,
  Bot,
  Radio,
  FileText,
  ClipboardList,
  Globe,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandPalette } from "@/components/layout/command-palette";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";

const navLinks = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", href: "/jobs", icon: Briefcase },
  { title: "Schedule", href: "/schedule", icon: CalendarDays },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Invoices", href: "/invoices", icon: Receipt },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "AI", href: "/ai-assistant", icon: Bot },
];

const moreLinks = [
  { title: "Dispatch", href: "/dispatch", icon: Radio },
  { title: "Estimates", href: "/estimates", icon: FileText },
  { title: "Agreements", href: "/agreements", icon: ClipboardList },
  { title: "Website", href: "/website", icon: Globe },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface GlassTopNavProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export function GlassTopNav({ user }: GlassTopNavProps) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <>
      <nav className="flex h-16 items-center justify-between px-6">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{
              background: "linear-gradient(135deg, #818cf8, #f472b6)",
              boxShadow: "0 4px 20px rgba(129, 140, 248, 0.3)",
            }}
          >
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ letterSpacing: "-0.5px", color: "var(--glass-nav-text)" }}>
            FieldService Pro
          </span>
        </Link>

        {/* Glass pill nav */}
        <div
          className="flex items-center gap-1 rounded-xl border px-1 py-1"
          style={{
            background: "var(--glass-nav-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "var(--glass-nav-border)",
          }}
        >
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
                style={{
                  color: isActive ? "var(--glass-nav-active-color)" : "var(--glass-nav-text-muted)",
                  background: isActive ? "var(--glass-nav-active-bg)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {link.title}
              </Link>
            );
          })}

          {/* More dropdown for additional pages */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
                style={{
                  color: moreLinks.some(
                    (l) =>
                      pathname === l.href ||
                      pathname.startsWith(l.href + "/")
                  )
                    ? "var(--glass-nav-active-color)"
                    : "var(--glass-nav-text-muted)",
                  background: moreLinks.some(
                    (l) =>
                      pathname === l.href ||
                      pathname.startsWith(l.href + "/")
                  )
                    ? "var(--glass-nav-active-bg)"
                    : "transparent",
                }}
                aria-label="More pages"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {moreLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} className="flex items-center">
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
            style={{
              background: "var(--glass-nav-bg)",
              borderColor: "var(--glass-nav-border)",
              color: "var(--glass-text-tertiary)",
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <kbd className="ml-1 hidden rounded border px-1 py-0.5 text-[10px] sm:inline-block" style={{ borderColor: "var(--glass-nav-border)", background: "var(--glass-hover-bg)" }}>
              ⌘K
            </kbd>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--glass-nav-text-muted)" }}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-full p-0 hover:bg-white/10"
                aria-label={`User menu for ${user.firstName} ${user.lastName}`}
              >
                <Avatar className="h-[34px] w-[34px]">
                  <AvatarFallback
                    className="text-[13px] font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #34d399, #22d3ee)",
                      border: "2px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {user.role.replace("_", " ")}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/api/auth/signout" method="post">
                  <button type="submit" className="flex w-full items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}

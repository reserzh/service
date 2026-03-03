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
  Zap,
  Settings,
  Sun,
  Moon,
  Bot,
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
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "AI", href: "/ai-assistant", icon: Bot },
];

interface BlueprintTopNavProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export function BlueprintTopNav({ user }: BlueprintTopNavProps) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <>
      <nav className="flex h-14 items-center gap-6 px-6" style={{ background: "var(--bp-nav-bg)" }}>
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f97316]">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--bp-nav-text-active)" }}>
            FieldService Pro
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-3 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  color: isActive ? "var(--bp-nav-text-active)" : "var(--bp-nav-text)",
                  background: isActive ? "var(--bp-nav-active-bg)" : "transparent",
                }}
              >
                {link.title}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* Search trigger */}
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
            style={{
              background: "var(--bp-nav-search-bg)",
              borderColor: "var(--bp-nav-search-border)",
              color: "var(--bp-nav-search-text)",
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="ml-2 hidden rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[10px] sm:inline-block">
              ⌘K
            </kbd>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{
              color: "var(--bp-nav-text)",
            }}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 gap-2 px-1 hover:bg-white/10"
                aria-label={`User menu for ${user.firstName} ${user.lastName}`}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback
                    className="text-xs font-bold text-white"
                    style={{ background: "#f97316" }}
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

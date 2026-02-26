"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
          <span className="text-lg font-bold tracking-tight text-white/95" style={{ letterSpacing: "-0.5px" }}>
            FieldService Pro
          </span>
        </Link>

        {/* Glass pill nav */}
        <div
          className="flex items-center gap-1 rounded-xl border px-1 py-1"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "rgba(255,255,255,0.1)",
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
                  color: isActive ? "#818cf8" : "rgba(255,255,255,0.6)",
                  background: isActive ? "rgba(129,140,248,0.2)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {link.title}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <kbd className="ml-1 hidden rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[10px] sm:inline-block">
              ⌘K
            </kbd>
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

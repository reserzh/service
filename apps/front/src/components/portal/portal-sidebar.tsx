"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Receipt,
  FileText,
  ClipboardList,
  User,
  LogOut,
} from "lucide-react";
import { createPortalBrowserClient } from "@/lib/portal-supabase-browser";

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/portal/jobs", icon: Briefcase },
  { label: "Invoices", href: "/portal/invoices", icon: Receipt },
  { label: "Estimates", href: "/portal/estimates", icon: FileText },
  { label: "Agreements", href: "/portal/agreements", icon: ClipboardList },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createPortalBrowserClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          Customer Portal
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-3 py-4 space-y-1">
        <Link
          href="/portal/profile"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
            pathname === "/portal/profile"
              ? "bg-gray-100 font-medium text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <User className="h-5 w-5" />
          Profile
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}

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
  X,
} from "lucide-react";
import { createPortalBrowserClient } from "@/lib/portal-supabase-browser";

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/portal/jobs", icon: Briefcase },
  { label: "Invoices", href: "/portal/invoices", icon: Receipt },
  { label: "Estimates", href: "/portal/estimates", icon: FileText },
  { label: "Agreements", href: "/portal/agreements", icon: ClipboardList },
];

interface PortalSidebarProps {
  open?: boolean;
  onClose?: () => void;
  companyName?: string;
  logoUrl?: string;
}

export function PortalSidebar({ open, onClose, companyName, logoUrl }: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createPortalBrowserClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  }

  const sidebarContent = (
    <>
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt="" className="h-8 w-auto" />
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            {companyName || "Customer Portal"}
          </h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "portal-nav-active font-medium"
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
          onClick={onClose}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
            pathname === "/portal/profile"
              ? "portal-nav-active font-medium"
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
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-64 flex-col border-r bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Sidebar panel */}
          <aside className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

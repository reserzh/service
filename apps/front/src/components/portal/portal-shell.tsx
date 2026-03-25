"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

interface PortalShellProps {
  children: React.ReactNode;
  companyName?: string;
  logoUrl?: string;
}

export function PortalShell({ children, companyName, logoUrl }: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <PortalSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        companyName={companyName}
        logoUrl={logoUrl}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <div className="flex items-center border-b bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          {logoUrl && (
            <img src={logoUrl} alt="" className="ml-3 h-7 w-auto" />
          )}
          <span className="ml-3 text-lg font-semibold text-gray-900">
            {companyName || "Customer Portal"}
          </span>
        </div>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

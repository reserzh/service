"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";

type NavPage = {
  id: string;
  slug: string;
  title: string;
  navLabel: string | null;
  isHomepage: boolean;
};

export function SiteHeader({
  companyName,
  logoUrl,
  phone,
  navPages,
}: {
  companyName: string;
  logoUrl?: string;
  phone?: string;
  navPages: NavPage[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo / Company Name */}
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={companyName} className="h-8 w-auto" />
          ) : (
            <span className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
              {companyName}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navPages.map((page) => (
            <Link
              key={page.id}
              href={page.isHomepage ? "/" : `/${page.slug}`}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              {page.navLabel || page.title}
            </Link>
          ))}
          <Link
            href="/book"
            className="rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Book Now
          </Link>
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-1 text-sm font-medium text-gray-700">
              <Phone className="h-4 w-4" />
              {phone}
            </a>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navPages.map((page) => (
              <Link
                key={page.id}
                href={page.isHomepage ? "/" : `/${page.slug}`}
                className="text-sm font-medium text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                {page.navLabel || page.title}
              </Link>
            ))}
            <Link
              href="/book"
              className="mt-2 rounded-md px-4 py-2 text-center text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
              onClick={() => setMobileOpen(false)}
            >
              Book Now
            </Link>
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-1 text-sm text-gray-700">
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

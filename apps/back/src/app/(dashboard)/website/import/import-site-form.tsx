"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  Globe,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Import,
  AlertTriangle,
  Palette,
  Building2,
  FileText,
  Wrench,
} from "lucide-react";

// ---------- Types ----------

interface DiscoveredPage {
  url: string;
  title: string;
  path: string;
}

interface ImportSection {
  type: string;
  content: Record<string, unknown>;
  include: boolean;
}

interface ImportPage {
  title: string;
  slug: string;
  isHomepage: boolean;
  sections: ImportSection[];
}

interface ImportService {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  priceDisplay?: string;
  include: boolean;
}

interface SiteImportPreview {
  branding: {
    businessName: string;
    tagline?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontHeading: string;
    fontBody: string;
    borderRadius: string;
    style?: string;
  };
  pages: ImportPage[];
  services: ImportService[];
  warnings: string[];
}

// ---------- Step Type ----------

type Step = "url" | "select" | "preview" | "done";

// ---------- Section Type Labels ----------

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: "Hero Banner",
  about: "About",
  services: "Services Grid",
  testimonials: "Testimonials",
  faq: "FAQ",
  gallery: "Gallery",
  contact_form: "Contact Form",
  cta_banner: "Call to Action",
  team: "Team",
  features: "Features",
  pricing: "Pricing",
  map: "Map",
  booking_widget: "Booking Widget",
  custom_html: "Custom HTML",
};

// ---------- Component ----------

export function ImportSiteForm() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>("url");

  // Step 1: URL input
  const [siteUrl, setSiteUrl] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Step 2: Page selection
  const [siteName, setSiteName] = useState("");
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Step 3: Preview
  const [preview, setPreview] = useState<SiteImportPreview | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([0]));
  const [applyTheme, setApplyTheme] = useState(true);
  const [applyBranding, setApplyBranding] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  // ---------- Step 1: Discover ----------

  const handleDiscover = async () => {
    if (!siteUrl.trim()) return;

    let validUrl = siteUrl.trim();
    if (!validUrl.startsWith("http")) {
      validUrl = `https://${validUrl}`;
    }

    try {
      new URL(validUrl);
    } catch {
      showToast.error("Please enter a valid URL");
      return;
    }

    setSiteUrl(validUrl);
    setIsDiscovering(true);

    try {
      const res = await fetch("/api/v1/website/import-site/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: validUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || `Failed to scan (${res.status})`);
      }

      const { data } = await res.json();
      setSiteName(data.siteName);
      setDiscoveredPages(data.pages);
      // Pre-select homepage
      const homepageUrl = data.pages.find(
        (p: DiscoveredPage) => p.path === "/"
      )?.url;
      if (homepageUrl) {
        setSelectedPages(new Set([homepageUrl]));
      }
      setStep("select");
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Failed to scan website"
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  // ---------- Step 2: Analyze ----------

  const handleAnalyze = async () => {
    if (selectedPages.size === 0) {
      showToast.error("Select at least one page");
      return;
    }

    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/v1/website/import-site/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: siteUrl,
          selectedPages: [...selectedPages],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error?.message || `Failed to analyze (${res.status})`
        );
      }

      const { data } = await res.json();
      setPreview(data);
      setStep("preview");
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Failed to analyze website"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ---------- Step 3: Apply ----------

  const handleImport = async () => {
    if (!preview) return;

    setIsImporting(true);

    try {
      const res = await fetch("/api/v1/website/import-site/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview,
          applyTheme,
          applyBranding,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error?.message || `Failed to import (${res.status})`
        );
      }

      const { data } = await res.json();
      showToast.created(
        `Imported ${data.pagesCreated} pages with ${data.sectionsCreated} sections`
      );
      setStep("done");
      router.push("/website/pages");
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Failed to import"
      );
    } finally {
      setIsImporting(false);
    }
  };

  // ---------- Toggle Helpers ----------

  const togglePage = (url: string) => {
    const next = new Set(selectedPages);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedPages(next);
  };

  const selectAllPages = () => {
    setSelectedPages(new Set(discoveredPages.map((p) => p.url)));
  };

  const deselectAllPages = () => {
    setSelectedPages(new Set());
  };

  const toggleExpandPage = (index: number) => {
    const next = new Set(expandedPages);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedPages(next);
  };

  const toggleSectionInclude = (pageIndex: number, sectionIndex: number) => {
    if (!preview) return;
    const updated = { ...preview };
    updated.pages = [...updated.pages];
    updated.pages[pageIndex] = { ...updated.pages[pageIndex] };
    updated.pages[pageIndex].sections = [
      ...updated.pages[pageIndex].sections,
    ];
    updated.pages[pageIndex].sections[sectionIndex] = {
      ...updated.pages[pageIndex].sections[sectionIndex],
      include: !updated.pages[pageIndex].sections[sectionIndex].include,
    };
    setPreview(updated);
  };

  const toggleServiceInclude = (index: number) => {
    if (!preview) return;
    const updated = { ...preview };
    updated.services = [...updated.services];
    updated.services[index] = {
      ...updated.services[index],
      include: !updated.services[index].include,
    };
    setPreview(updated);
  };

  // ---------- Get section content summary ----------

  const getSectionSummary = (section: ImportSection): string => {
    const c = section.content;
    switch (section.type) {
      case "hero":
        return (c.heading as string) || "Hero section";
      case "about": {
        const text = (c.content as string) || "";
        return text.length > 100 ? text.substring(0, 100) + "..." : text || "About section";
      }
      case "testimonials": {
        const items = c.items as Array<{ name: string }>;
        return items ? `${items.length} testimonials` : "Testimonials";
      }
      case "faq": {
        const faqItems = c.items as Array<{ question: string }>;
        return faqItems ? `${faqItems.length} questions` : "FAQ";
      }
      case "team": {
        const members = c.members as Array<{ name: string }>;
        return members ? `${members.length} members` : "Team";
      }
      case "gallery": {
        const images = c.images as Array<{ url: string }>;
        return images ? `${images.length} images` : "Gallery";
      }
      case "features": {
        const featureItems = c.items as Array<{ title: string }>;
        return featureItems ? `${featureItems.length} features` : "Features";
      }
      case "services":
        return (c.heading as string) || "Services list";
      case "contact_form":
        return "Contact form";
      case "cta_banner":
        return (c.heading as string) || "Call to action";
      default:
        return section.type;
    }
  };

  // ---------- Render ----------

  return (
    <div className="mt-6 space-y-6 max-w-3xl">
      {/* Step 1: URL Input */}
      {step === "url" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Enter Your Website URL
            </CardTitle>
            <CardDescription>
              We&apos;ll scan your existing website and find all available pages
              to import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-url">Website URL</Label>
              <div className="flex gap-2">
                <Input
                  id="site-url"
                  placeholder="https://www.yourbusiness.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleDiscover();
                    }
                  }}
                />
                <Button
                  onClick={handleDiscover}
                  disabled={!siteUrl.trim() || isDiscovering}
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Scan Website
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Page Selection */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Pages to Import
            </CardTitle>
            <CardDescription>
              Found {discoveredPages.length} pages on{" "}
              <span className="font-medium">{siteName}</span>. Select which ones
              to analyze and import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={selectAllPages}
                className="text-primary hover:underline"
              >
                Select All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={deselectAllPages}
                className="text-primary hover:underline"
              >
                Deselect All
              </button>
              <span className="ml-auto text-muted-foreground">
                {selectedPages.size} selected
              </span>
            </div>

            <div className="space-y-1 rounded-lg border divide-y max-h-80 overflow-y-auto">
              {discoveredPages.map((page) => (
                <label
                  key={page.url}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedPages.has(page.url)}
                    onCheckedChange={() => togglePage(page.url)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{page.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {page.path}
                    </p>
                  </div>
                  {page.path === "/" && (
                    <Badge variant="secondary" className="text-xs">
                      Home
                    </Badge>
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("url")}
              >
                Back
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={selectedPages.size === 0 || isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing {selectedPages.size} pages...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze Selected Pages
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && preview && (
        <>
          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <CardContent className="flex items-start gap-2 py-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  {preview.warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Branding */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Extracted Branding
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="apply-branding" className="text-sm">
                    Apply
                  </Label>
                  <Switch
                    id="apply-branding"
                    checked={applyBranding}
                    onCheckedChange={setApplyBranding}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Business Name:</span>{" "}
                  <span className="font-medium">
                    {preview.branding.businessName}
                  </span>
                </div>
                {preview.branding.tagline && (
                  <div>
                    <span className="text-muted-foreground">Tagline:</span>{" "}
                    {preview.branding.tagline}
                  </div>
                )}
                {preview.branding.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {preview.branding.phone}
                  </div>
                )}
                {preview.branding.email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {preview.branding.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4" />
                  Extracted Theme
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="apply-theme" className="text-sm">
                    Apply
                  </Label>
                  <Switch
                    id="apply-theme"
                    checked={applyTheme}
                    onCheckedChange={setApplyTheme}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {[
                    { color: preview.theme.primaryColor, label: "Primary" },
                    { color: preview.theme.secondaryColor, label: "Secondary" },
                    { color: preview.theme.accentColor, label: "Accent" },
                  ].map((swatch) => (
                    <div key={swatch.label} className="text-center">
                      <div
                        className="h-8 w-8 rounded-full border"
                        style={{ backgroundColor: swatch.color }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {swatch.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Fonts: {preview.theme.fontHeading} /{" "}
                    {preview.theme.fontBody}
                  </p>
                  <p>Radius: {preview.theme.borderRadius}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Pages & Sections ({preview.pages.length} pages)
              </CardTitle>
              <CardDescription>
                Toggle sections on or off before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {preview.pages.map((page, pageIdx) => {
                const isExpanded = expandedPages.has(pageIdx);
                const includedCount = page.sections.filter(
                  (s) => s.include
                ).length;
                return (
                  <div key={pageIdx} className="rounded-lg border">
                    <button
                      type="button"
                      onClick={() => toggleExpandPage(pageIdx)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <span className="font-medium text-sm flex-1">
                        {page.title}
                      </span>
                      {page.isHomepage && (
                        <Badge variant="secondary" className="text-xs">
                          Home
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {includedCount}/{page.sections.length} sections
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t divide-y">
                        {page.sections.map((section, secIdx) => (
                          <label
                            key={secIdx}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer"
                          >
                            <Checkbox
                              checked={section.include}
                              onCheckedChange={() =>
                                toggleSectionInclude(pageIdx, secIdx)
                              }
                            />
                            <Badge variant="outline" className="text-xs shrink-0">
                              {SECTION_TYPE_LABELS[section.type] ||
                                section.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground truncate">
                              {getSectionSummary(section)}
                            </span>
                          </label>
                        ))}
                        {page.sections.length === 0 && (
                          <p className="px-3 py-2 text-sm text-muted-foreground">
                            No sections extracted for this page
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Services */}
          {preview.services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-4 w-4" />
                  Extracted Services ({preview.services.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 divide-y rounded-lg border">
                  {preview.services.map((svc, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer"
                    >
                      <Checkbox
                        checked={svc.include}
                        onCheckedChange={() => toggleServiceInclude(i)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{svc.name}</p>
                        {svc.shortDescription && (
                          <p className="text-xs text-muted-foreground truncate">
                            {svc.shortDescription}
                          </p>
                        )}
                      </div>
                      {svc.priceDisplay && (
                        <span className="text-xs text-muted-foreground">
                          {svc.priceDisplay}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image notice */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="py-3 text-sm text-blue-800 dark:text-blue-200">
              Images are linked from your old website. For best results, upload
              replacements via the{" "}
              <a
                href="/website/media"
                className="underline font-medium"
              >
                Media Library
              </a>{" "}
              after importing.
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Import className="mr-2 h-4 w-4" />
                  Import as Draft
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSiteSettingsAction } from "@/actions/website";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Check, Save } from "lucide-react";
import { AIStyleGenerator } from "./ai-style-generator";
import type { SiteTheme } from "@fieldservice/shared/types";

type SiteSettings = {
  id: string;
  tenantId: string;
  isPublished: boolean;
  subdomainSlug: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontHeading: string;
    fontBody: string;
    borderRadius: string;
    style?: string;
  } | null;
  branding: {
    logoUrl?: string;
    faviconUrl?: string;
    businessName: string;
    tagline?: string;
    phone?: string;
    email?: string;
  } | null;
  seoDefaults: {
    title?: string;
    description?: string;
    ogImage?: string;
    keywords?: string[];
  } | null;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    google?: string;
    yelp?: string;
    nextdoor?: string;
  } | null;
  customCss: string | null;
} | null;

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Merriweather", label: "Merriweather" },
];

const RADIUS_OPTIONS = [
  { value: "0", label: "None" },
  { value: "0.25rem", label: "Small" },
  { value: "0.5rem", label: "Medium" },
  { value: "0.75rem", label: "Large" },
  { value: "1rem", label: "Extra Large" },
];

type ThemePreset = {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
};

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "professional-blue",
    name: "Professional Blue",
    description: "Clean corporate look",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    accentColor: "#f59e0b",
    fontHeading: "Inter",
    fontBody: "Inter",
    borderRadius: "0.5rem",
  },
  {
    id: "bold-contractor",
    name: "Bold Contractor",
    description: "High-energy trades",
    primaryColor: "#dc2626",
    secondaryColor: "#991b1b",
    accentColor: "#fbbf24",
    fontHeading: "Montserrat",
    fontBody: "Open Sans",
    borderRadius: "0.25rem",
  },
  {
    id: "nature-green",
    name: "Nature Green",
    description: "Outdoor & landscaping",
    primaryColor: "#059669",
    secondaryColor: "#065f46",
    accentColor: "#f97316",
    fontHeading: "Poppins",
    fontBody: "Lato",
    borderRadius: "0.75rem",
  },
  {
    id: "modern-slate",
    name: "Modern Slate",
    description: "Sophisticated premium",
    primaryColor: "#475569",
    secondaryColor: "#1e293b",
    accentColor: "#06b6d4",
    fontHeading: "Inter",
    fontBody: "Roboto",
    borderRadius: "0.5rem",
  },
  {
    id: "warm-copper",
    name: "Warm Copper",
    description: "Classic established",
    primaryColor: "#b45309",
    secondaryColor: "#78350f",
    accentColor: "#0284c7",
    fontHeading: "Playfair Display",
    fontBody: "Lato",
    borderRadius: "0.75rem",
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Water-inspired calm",
    primaryColor: "#0369a1",
    secondaryColor: "#0c4a6e",
    accentColor: "#22c55e",
    fontHeading: "Poppins",
    fontBody: "Inter",
    borderRadius: "1rem",
  },
  {
    id: "midnight-pro",
    name: "Midnight Pro",
    description: "Tech-forward dark",
    primaryColor: "#1e1b4b",
    secondaryColor: "#312e81",
    accentColor: "#a78bfa",
    fontHeading: "Montserrat",
    fontBody: "Roboto",
    borderRadius: "0.25rem",
  },
  {
    id: "sunrise-energy",
    name: "Sunrise Energy",
    description: "Vibrant & emergency",
    primaryColor: "#ea580c",
    secondaryColor: "#c2410c",
    accentColor: "#2563eb",
    fontHeading: "Poppins",
    fontBody: "Open Sans",
    borderRadius: "0.5rem",
  },
];

export function ThemeEditorForm({ settings, aiConfigured = false }: { settings: SiteSettings; aiConfigured?: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(settings?.isPublished ?? false);
  const [aiPreviewActive, setAiPreviewActive] = useState(false);

  // Theme
  const [primaryColor, setPrimaryColor] = useState(settings?.theme?.primaryColor ?? "#2563eb");
  const [secondaryColor, setSecondaryColor] = useState(settings?.theme?.secondaryColor ?? "#1e40af");
  const [accentColor, setAccentColor] = useState(settings?.theme?.accentColor ?? "#f59e0b");
  const [fontHeading, setFontHeading] = useState(settings?.theme?.fontHeading ?? "Inter");
  const [fontBody, setFontBody] = useState(settings?.theme?.fontBody ?? "Inter");
  const [borderRadius, setBorderRadius] = useState(settings?.theme?.borderRadius ?? "0.5rem");

  // Branding
  const [businessName, setBusinessName] = useState(settings?.branding?.businessName ?? "");
  const [tagline, setTagline] = useState(settings?.branding?.tagline ?? "");
  const [brandingPhone, setBrandingPhone] = useState(settings?.branding?.phone ?? "");
  const [brandingEmail, setBrandingEmail] = useState(settings?.branding?.email ?? "");

  // SEO
  const [seoTitle, setSeoTitle] = useState(settings?.seoDefaults?.title ?? "");
  const [seoDescription, setSeoDescription] = useState(settings?.seoDefaults?.description ?? "");

  // Social
  const [facebook, setFacebook] = useState(settings?.socialLinks?.facebook ?? "");
  const [instagram, setInstagram] = useState(settings?.socialLinks?.instagram ?? "");
  const [google, setGoogle] = useState(settings?.socialLinks?.google ?? "");
  const [yelp, setYelp] = useState(settings?.socialLinks?.yelp ?? "");

  // Custom CSS
  const [customCss, setCustomCss] = useState(settings?.customCss ?? "");

  const activePresetId = THEME_PRESETS.find(
    (p) =>
      p.primaryColor === primaryColor &&
      p.secondaryColor === secondaryColor &&
      p.accentColor === accentColor &&
      p.fontHeading === fontHeading &&
      p.fontBody === fontBody &&
      p.borderRadius === borderRadius
  )?.id ?? null;

  const applyPreset = (preset: ThemePreset) => {
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setAccentColor(preset.accentColor);
    setFontHeading(preset.fontHeading);
    setFontBody(preset.fontBody);
    setBorderRadius(preset.borderRadius);
  };

  const handleApplyAITheme = (theme: SiteTheme) => {
    setPrimaryColor(theme.primaryColor);
    setSecondaryColor(theme.secondaryColor);
    setAccentColor(theme.accentColor);
    setFontHeading(theme.fontHeading);
    setFontBody(theme.fontBody);
    setBorderRadius(theme.borderRadius);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSiteSettingsAction({
        isPublished,
        theme: {
          primaryColor,
          secondaryColor,
          accentColor,
          fontHeading,
          fontBody,
          borderRadius,
          style: "modern",
        },
        branding: {
          businessName,
          tagline: tagline || undefined,
          phone: brandingPhone || undefined,
          email: brandingEmail || undefined,
        },
        seoDefaults: {
          title: seoTitle || undefined,
          description: seoDescription || undefined,
        },
        socialLinks: {
          facebook: facebook || undefined,
          instagram: instagram || undefined,
          google: google || undefined,
          yelp: yelp || undefined,
        },
        customCss: customCss || null,
      });

      if (result.error) {
        showToast.error(result.error);
      } else {
        showToast.saved("Theme");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Publish Toggle */}
      <div className="max-w-3xl">
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Publish Website</p>
              <p className="text-sm text-muted-foreground">
                Make your website visible to the public
              </p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </CardContent>
        </Card>
      </div>

      {/* AI Style Generator — full width when preview is active */}
      {aiConfigured && (
        <div className={aiPreviewActive ? "" : "max-w-3xl"}>
          <AIStyleGenerator
            onApplyTheme={handleApplyAITheme}
            logoUrl={settings?.branding?.logoUrl}
            onPreviewActiveChange={setAiPreviewActive}
          />
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        {/* Theme Presets */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Presets</CardTitle>
            <CardDescription>Quick-start with a curated theme, then customize below</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {THEME_PRESETS.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "relative rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm",
                      isActive && "border-primary ring-2 ring-primary/20"
                    )}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className="mb-2 flex gap-1.5">
                      <span
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: preset.secondaryColor }}
                      />
                      <span
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                    </div>
                    <p className="text-sm font-medium leading-tight">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>Set your brand colors</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border p-1"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="accentColor"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border p-1"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Choose fonts for your site</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <Select value={fontHeading} onValueChange={setFontHeading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body Font</Label>
              <Select value={fontBody} onValueChange={setFontBody}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Border Radius</Label>
              <Select value={borderRadius} onValueChange={setBorderRadius}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Your business identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Business Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Your trusted partner in..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandingPhone">Phone Number</Label>
                <Input
                  id="brandingPhone"
                  value={brandingPhone}
                  onChange={(e) => setBrandingPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandingEmail">Email</Label>
                <Input
                  id="brandingEmail"
                  type="email"
                  value={brandingEmail}
                  onChange={(e) => setBrandingEmail(e.target.value)}
                  placeholder="info@yourbusiness.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Defaults</CardTitle>
            <CardDescription>Default meta tags for your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">Default Title</Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Your Business | Professional Services"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">Default Description</Label>
              <Textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Describe your business for search engines..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Connect your social media profiles</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google">Google Business</Label>
              <Input id="google" value={google} onChange={(e) => setGoogle(e.target.value)} placeholder="https://g.page/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yelp">Yelp</Label>
              <Input id="yelp" value={yelp} onChange={(e) => setYelp(e.target.value)} placeholder="https://yelp.com/biz/..." />
            </div>
          </CardContent>
        </Card>

        {/* Custom CSS */}
        <Card>
          <CardHeader>
            <CardTitle>Custom CSS</CardTitle>
            <CardDescription>Advanced: Add custom CSS overrides</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              placeholder="/* Your custom CSS here */"
              className="font-mono text-sm"
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pb-6">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Plus,
  X,
  Upload,
  Loader2,
  Check,
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";
import type { SiteTheme } from "@fieldservice/shared/types";

interface ThemeOption {
  name: string;
  theme: SiteTheme;
  reasoning: string;
}

interface AIStyleGeneratorProps {
  onApplyTheme: (theme: SiteTheme) => void;
  logoUrl?: string;
}

export function AIStyleGenerator({
  onApplyTheme,
  logoUrl,
}: AIStyleGeneratorProps) {
  // Input state
  const [description, setDescription] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [inspirationUrls, setInspirationUrls] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [useCurrentLogo, setUseCurrentLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [options, setOptions] = useState<ThemeOption[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Refinement state
  const [showRefine, setShowRefine] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");

  const hasInput =
    description.trim() || inspirationUrls.length > 0 || logoFile || useCurrentLogo;

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      showToast.error("Please enter a valid URL");
      return;
    }
    if (inspirationUrls.length >= 3) {
      showToast.error("Maximum 3 inspiration URLs");
      return;
    }
    if (inspirationUrls.includes(trimmed)) {
      showToast.error("URL already added");
      return;
    }
    setInspirationUrls([...inspirationUrls, trimmed]);
    setUrlInput("");
  };

  const removeUrl = (index: number) => {
    setInspirationUrls(inspirationUrls.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast.error("Logo must be JPEG, PNG, or WebP");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("Logo must be under 10MB");
      return;
    }
    setLogoFile(file);
    setUseCurrentLogo(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setOptions(null);
    setSelectedIndex(null);
    setShowRefine(false);

    try {
      const formData = new FormData();
      if (description.trim()) formData.append("description", description.trim());
      if (inspirationUrls.length > 0)
        formData.append("inspirationUrls", JSON.stringify(inspirationUrls));
      if (logoFile) {
        formData.append("logo", logoFile);
      } else if (useCurrentLogo && logoUrl) {
        formData.append("logoUrl", logoUrl);
      }

      const res = await fetch("/api/v1/website/generate-theme", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error?.message || `Failed to generate (${res.status})`
        );
      }

      const { data } = await res.json();
      setOptions(data.options);
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Failed to generate theme"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!refinementPrompt.trim() || selectedIndex === null || !options) return;

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("refinementPrompt", refinementPrompt.trim());
      formData.append(
        "previousResult",
        JSON.stringify(options[selectedIndex].theme)
      );

      const res = await fetch("/api/v1/website/generate-theme", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error?.message || `Failed to refine (${res.status})`
        );
      }

      const { data } = await res.json();
      setOptions(data.options);
      setSelectedIndex(null);
      setRefinementPrompt("");
      setShowRefine(false);
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Failed to refine theme"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = (index: number) => {
    if (!options) return;
    onApplyTheme(options[index].theme);
    showToast.saved("AI theme applied — review and save when ready");
  };

  const handleStartOver = () => {
    setOptions(null);
    setSelectedIndex(null);
    setShowRefine(false);
    setRefinementPrompt("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Style Generator
        </CardTitle>
        <CardDescription>
          Describe your ideal look, share inspiration sites, or upload your logo
          — AI will generate 3 unique theme options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input form — shown when no results or generating */}
        {!options && (
          <>
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="ai-description">Style Description</Label>
              <Textarea
                id="ai-description"
                placeholder="Describe your ideal website style... (e.g., 'modern and clean with earth tones for a landscaping company')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500
              </p>
            </div>

            {/* Inspiration URLs */}
            <div className="space-y-2">
              <Label>Inspiration Websites</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrl();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addUrl}
                  disabled={inspirationUrls.length >= 3}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {inspirationUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {inspirationUrls.map((url, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                    >
                      {new URL(url).hostname}
                      <button
                        type="button"
                        onClick={() => removeUrl(i)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Add up to 3 website URLs for style inspiration
              </p>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
                {logoUrl && !logoFile && (
                  <Button
                    type="button"
                    variant={useCurrentLogo ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setUseCurrentLogo(!useCurrentLogo);
                      setLogoFile(null);
                    }}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {useCurrentLogo ? "Using Current Logo" : "Use Current Logo"}
                  </Button>
                )}
                {logoFile && (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    {logoFile.name}
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your logo to extract brand colors and style
              </p>
            </div>

            {/* Generate Button */}
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!hasInput || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating 3 options...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Themes
                </>
              )}
            </Button>
          </>
        )}

        {/* Results — 3 option cards */}
        {options && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {options.map((option, i) => {
                const isSelected = selectedIndex === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    className={cn(
                      "relative rounded-lg border text-left transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-primary"
                    )}
                  >
                    {/* Color accent stripe */}
                    <div
                      className="h-2 rounded-t-lg"
                      style={{ backgroundColor: option.theme.primaryColor }}
                    />
                    <div className="p-3 space-y-3">
                      <p className="font-semibold text-sm">{option.name}</p>

                      {/* Color swatches */}
                      <div className="flex gap-2">
                        {[
                          {
                            color: option.theme.primaryColor,
                            label: "Primary",
                          },
                          {
                            color: option.theme.secondaryColor,
                            label: "Secondary",
                          },
                          {
                            color: option.theme.accentColor,
                            label: "Accent",
                          },
                        ].map((swatch) => (
                          <div key={swatch.label} className="text-center">
                            <div
                              className="h-8 w-8 rounded-full border mx-auto"
                              style={{ backgroundColor: swatch.color }}
                            />
                            <span className="text-[10px] text-muted-foreground mt-1 block">
                              {swatch.color}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Font preview */}
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>
                          Heading:{" "}
                          <span className="font-medium text-foreground">
                            {option.theme.fontHeading}
                          </span>
                        </p>
                        <p>
                          Body:{" "}
                          <span className="font-medium text-foreground">
                            {option.theme.fontBody}
                          </span>
                        </p>
                        <p>
                          Radius:{" "}
                          <span className="font-medium text-foreground">
                            {option.theme.borderRadius === "0"
                              ? "None"
                              : option.theme.borderRadius}
                          </span>
                        </p>
                      </div>

                      {/* Reasoning */}
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {option.reasoning}
                      </p>

                      {/* Apply button */}
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        variant={isSelected ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(i);
                        }}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Apply
                      </Button>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Refinement */}
            {showRefine && selectedIndex !== null ? (
              <div className="space-y-2 rounded-lg border p-3">
                <Label htmlFor="ai-refine">
                  Refine &ldquo;{options[selectedIndex].name}&rdquo;
                </Label>
                <Textarea
                  id="ai-refine"
                  placeholder="e.g., make the accent color warmer, use a serif heading font..."
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  maxLength={500}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleRefine}
                    disabled={!refinementPrompt.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refining...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowRefine(false);
                      setRefinementPrompt("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedIndex === null) {
                      showToast.error("Select an option first to refine it");
                      return;
                    }
                    setShowRefine(true);
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Refine
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleStartOver}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

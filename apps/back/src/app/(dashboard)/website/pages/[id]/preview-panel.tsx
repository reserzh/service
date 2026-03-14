"use client";

import { getSectionPreview } from "./section-previews";

type Section = {
  id: string;
  type: string;
  content: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  sortOrder: number;
  isVisible: boolean;
};

type SiteTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
};

type PreviewPanelProps = {
  sections: Section[];
  siteTheme?: SiteTheme | null;
};

const PADDING_MAP: Record<string, string> = {
  none: "0",
  sm: "1rem",
  md: "2rem",
  lg: "3rem",
  xl: "4rem",
};

const MAX_WIDTH_MAP: Record<string, string> = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  full: "100%",
};

export function PreviewPanel({ sections, siteTheme }: PreviewPanelProps) {
  const theme = siteTheme || {
    primaryColor: "#1e40af",
    secondaryColor: "#64748b",
    accentColor: "#f59e0b",
    fontHeading: "system-ui, sans-serif",
    fontBody: "system-ui, sans-serif",
    borderRadius: "0.375rem",
  };

  const visibleSections = sections.filter((s) => s.isVisible);

  return (
    <div className="h-full overflow-y-auto bg-background rounded-lg border">
      <div className="border-b px-4 py-2 bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">Preview</span>
        </div>
      </div>
      <div style={{ fontFamily: theme.fontBody, backgroundColor: "#fff" }}>
        {visibleSections.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground text-sm">
            No visible sections to preview
          </div>
        ) : (
          visibleSections.map((section) => {
            const Preview = getSectionPreview(section.type);
            if (!Preview) {
              return (
                <div key={section.id} className="py-8 px-4 text-center text-muted-foreground text-sm border-b">
                  {section.type.replace(/_/g, " ")} section
                </div>
              );
            }

            const settings = section.settings as Record<string, unknown> | null;
            const paddingY = PADDING_MAP[(settings?.paddingY as string) || ""] || undefined;
            const paddingX = PADDING_MAP[(settings?.paddingX as string) || ""] || undefined;
            const maxWidth = MAX_WIDTH_MAP[(settings?.maxWidth as string) || ""] || undefined;
            const fullWidth = settings?.fullWidth as boolean;

            return (
              <div
                key={section.id}
                style={{
                  backgroundColor: (settings?.backgroundColor as string) || undefined,
                  color: (settings?.textColor as string) || undefined,
                  paddingTop: paddingY,
                  paddingBottom: paddingY,
                  paddingLeft: paddingX,
                  paddingRight: paddingX,
                }}
              >
                <div style={{ maxWidth: fullWidth ? "100%" : maxWidth, margin: "0 auto" }}>
                  <Preview content={section.content ?? {}} theme={theme} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

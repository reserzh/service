import type { SiteTheme } from "@fieldservice/shared/types";

interface AIThemePreviewPanelProps {
  theme: SiteTheme;
}

export function AIThemePreviewPanel({ theme }: AIThemePreviewPanelProps) {
  return (
    <div className="h-full overflow-y-auto rounded-lg border bg-background" style={{ maxHeight: 500 }}>
      {/* Browser chrome */}
      <div className="sticky top-0 z-10 border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <span className="ml-2 text-xs text-muted-foreground">Preview</span>
        </div>
      </div>

      <div style={{ fontFamily: `"${theme.fontBody}", system-ui, sans-serif`, backgroundColor: "#fff" }}>
        {/* Hero Section */}
        <div
          style={{
            backgroundColor: theme.primaryColor,
            color: "#fff",
            padding: "2.5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: `"${theme.fontHeading}", system-ui, sans-serif`,
              fontSize: "1.35rem",
              fontWeight: 700,
              marginBottom: "0.4rem",
            }}
          >
            Your Business Name
          </h1>
          <p style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "1rem" }}>
            Professional services you can trust
          </p>
          <span
            style={{
              backgroundColor: theme.accentColor,
              color: "#fff",
              padding: "0.45rem 1.2rem",
              borderRadius: theme.borderRadius,
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Get a Quote
          </span>
        </div>

        {/* Services Section */}
        <div style={{ padding: "1.5rem 1.5rem" }}>
          <h2
            style={{
              fontFamily: `"${theme.fontHeading}", system-ui, sans-serif`,
              fontSize: "1rem",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: "0.35rem",
            }}
          >
            Our Services
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#666",
              fontSize: "0.7rem",
              marginBottom: "0.75rem",
            }}
          >
            Quality workmanship, every time
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.5rem",
            }}
          >
            {["Repairs", "Installation", "Maintenance", "Emergency"].map((name) => (
              <div
                key={name}
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "0.75rem",
                  borderRadius: theme.borderRadius,
                }}
              >
                <div
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    backgroundColor: theme.primaryColor,
                    borderRadius: "0.25rem",
                    marginBottom: "0.35rem",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div
          style={{
            backgroundColor: theme.secondaryColor,
            color: "#fff",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: `"${theme.fontHeading}", system-ui, sans-serif`,
              fontSize: "0.95rem",
              fontWeight: 700,
              marginBottom: "0.35rem",
            }}
          >
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: "0.7rem", opacity: 0.9, marginBottom: "0.75rem" }}>
            Contact us today for a free estimate
          </p>
          <span
            style={{
              backgroundColor: "#fff",
              color: theme.secondaryColor,
              padding: "0.4rem 1rem",
              borderRadius: theme.borderRadius,
              fontSize: "0.7rem",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Call Now
          </span>
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "0.75rem 1.5rem",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.6rem", color: "#9ca3af" }}>
            {theme.fontHeading} / {theme.fontBody} &middot; Radius: {theme.borderRadius === "0" ? "none" : theme.borderRadius}
          </div>
        </div>
      </div>
    </div>
  );
}

import type { SiteTheme } from "@fieldservice/shared/types";

interface AIThemePreviewPanelProps {
  theme: SiteTheme;
  variant?: number;
}

// Lighten a hex color by mixing with white
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

// Get pill-style radius for buttons when theme uses rounding
function btnRadius(themeRadius: string): string {
  if (themeRadius === "0" || themeRadius === "0.25rem") return themeRadius;
  return "9999px";
}

const SERVICES = ["Repairs", "Installation", "Maintenance", "Emergency"];

export function AIThemePreviewPanel({ theme, variant = 0 }: AIThemePreviewPanelProps) {
  const headingFont = `"${theme.fontHeading}", system-ui, sans-serif`;
  const bodyFont = `"${theme.fontBody}", system-ui, sans-serif`;
  const v = variant % 3;

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

      <div style={{ fontFamily: bodyFont, backgroundColor: "#fff" }}>
        {v === 0 && <VariantCentered theme={theme} headingFont={headingFont} />}
        {v === 1 && <VariantSplit theme={theme} headingFont={headingFont} />}
        {v === 2 && <VariantEditorial theme={theme} headingFont={headingFont} bodyFont={bodyFont} />}

        {/* Footer */}
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

// --- Variant 0: Bold centered hero, 2x2 card grid, colored CTA banner ---
function VariantCentered({ theme, headingFont }: { theme: SiteTheme; headingFont: string }) {
  return (
    <>
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
          color: "#fff",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontFamily: headingFont, fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.4rem" }}>
          Your Business Name
        </h1>
        <p style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "1rem" }}>
          Professional services you can trust
        </p>
        <span
          style={{
            backgroundColor: theme.accentColor,
            color: "#fff",
            padding: "0.5rem 1.4rem",
            borderRadius: btnRadius(theme.borderRadius),
            fontSize: "0.75rem",
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          Get a Quote
        </span>
      </div>

      {/* Services — 2x2 cards */}
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: headingFont, fontSize: "1rem", fontWeight: 700, textAlign: "center", marginBottom: "0.75rem" }}>
          Our Services
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
          {SERVICES.map((name) => (
            <div
              key={name}
              style={{
                backgroundColor: lighten(theme.primaryColor, 0.92),
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
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#374151" }}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ backgroundColor: theme.secondaryColor, color: "#fff", padding: "1.5rem", textAlign: "center" }}>
        <h2 style={{ fontFamily: headingFont, fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.35rem" }}>
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
            borderRadius: btnRadius(theme.borderRadius),
            fontSize: "0.7rem",
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          Call Now
        </span>
      </div>
    </>
  );
}

// --- Variant 1: Split hero (text left / image right), horizontal service strip, accent sidebar CTA ---
function VariantSplit({ theme, headingFont }: { theme: SiteTheme; headingFont: string }) {
  return (
    <>
      {/* Split Hero */}
      <div style={{ display: "flex" }}>
        <div
          style={{
            flex: "1 1 55%",
            backgroundColor: theme.primaryColor,
            color: "#fff",
            padding: "2rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1 style={{ fontFamily: headingFont, fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.35rem", lineHeight: 1.2 }}>
            Your Business Name
          </h1>
          <p style={{ fontSize: "0.7rem", opacity: 0.85, marginBottom: "0.75rem", lineHeight: 1.4 }}>
            Trusted experts for all your home service needs
          </p>
          <span
            style={{
              backgroundColor: theme.accentColor,
              color: "#fff",
              padding: "0.4rem 1rem",
              borderRadius: theme.borderRadius,
              fontSize: "0.7rem",
              fontWeight: 600,
              display: "inline-block",
              alignSelf: "flex-start",
            }}
          >
            Book Now
          </span>
        </div>
        <div
          style={{
            flex: "1 1 45%",
            background: `linear-gradient(135deg, ${lighten(theme.primaryColor, 0.4)} 0%, ${lighten(theme.secondaryColor, 0.3)} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "8rem",
          }}
        >
          <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.3)" }} />
        </div>
      </div>

      {/* Horizontal services strip */}
      <div style={{ padding: "1.25rem" }}>
        <h2 style={{ fontFamily: headingFont, fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem" }}>
          What We Do
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {SERVICES.map((name) => (
            <div
              key={name}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "0.6rem 0.25rem",
                border: `1.5px solid ${lighten(theme.primaryColor, 0.7)}`,
                borderRadius: theme.borderRadius,
              }}
            >
              <div
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  backgroundColor: theme.accentColor,
                  borderRadius: "50%",
                  margin: "0 auto 0.3rem",
                }}
              />
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#374151" }}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Accent sidebar CTA */}
      <div style={{ display: "flex", margin: "0 1.25rem 1.25rem" }}>
        <div
          style={{
            width: "4px",
            backgroundColor: theme.accentColor,
            borderRadius: theme.borderRadius,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            flex: 1,
            backgroundColor: lighten(theme.secondaryColor, 0.9),
            padding: "1rem 1.25rem",
            borderRadius: `0 ${theme.borderRadius} ${theme.borderRadius} 0`,
          }}
        >
          <h2 style={{ fontFamily: headingFont, fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.25rem", color: theme.secondaryColor }}>
            Schedule Your Service
          </h2>
          <p style={{ fontSize: "0.65rem", color: "#666", marginBottom: "0.5rem" }}>
            Quick response times, transparent pricing
          </p>
          <span
            style={{
              backgroundColor: theme.secondaryColor,
              color: "#fff",
              padding: "0.35rem 0.9rem",
              borderRadius: theme.borderRadius,
              fontSize: "0.65rem",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Contact Us
          </span>
        </div>
      </div>
    </>
  );
}

// --- Variant 2: Editorial / minimal — big typography, stacked sections, accent rule ---
function VariantEditorial({ theme, headingFont, bodyFont }: { theme: SiteTheme; headingFont: string; bodyFont: string }) {
  return (
    <>
      {/* Minimal hero — white bg, accent rule, large type */}
      <div style={{ padding: "2.5rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div
          style={{
            width: "2.5rem",
            height: "3px",
            backgroundColor: theme.accentColor,
            margin: "0 auto 1rem",
            borderRadius: theme.borderRadius,
          }}
        />
        <h1 style={{ fontFamily: headingFont, fontSize: "1.5rem", fontWeight: 700, color: theme.primaryColor, marginBottom: "0.4rem", lineHeight: 1.15 }}>
          Your Business Name
        </h1>
        <p style={{ fontFamily: bodyFont, fontSize: "0.8rem", color: "#666", marginBottom: "1.25rem", lineHeight: 1.5 }}>
          Craftsmanship &amp; reliability since 2010
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          <span
            style={{
              backgroundColor: theme.primaryColor,
              color: "#fff",
              padding: "0.45rem 1.2rem",
              borderRadius: theme.borderRadius,
              fontSize: "0.7rem",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Get a Quote
          </span>
          <span
            style={{
              backgroundColor: "transparent",
              color: theme.primaryColor,
              padding: "0.45rem 1.2rem",
              borderRadius: theme.borderRadius,
              border: `1.5px solid ${theme.primaryColor}`,
              fontSize: "0.7rem",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Our Work
          </span>
        </div>
      </div>

      {/* Full-width colored divider */}
      <div
        style={{
          height: "3px",
          background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor}, ${theme.secondaryColor})`,
          margin: "0.5rem 1.5rem",
          borderRadius: theme.borderRadius,
        }}
      />

      {/* Stacked service list */}
      <div style={{ padding: "1.25rem 1.5rem" }}>
        <h2 style={{ fontFamily: headingFont, fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "#1f2937" }}>
          Services
        </h2>
        {SERVICES.map((name, i) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.5rem 0",
              borderBottom: i < SERVICES.length - 1 ? "1px solid #f3f4f6" : "none",
            }}
          >
            <div
              style={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "50%",
                backgroundColor: theme.accentColor,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#374151" }}>{name}</span>
            <span style={{ marginLeft: "auto", fontSize: "0.6rem", color: theme.primaryColor, fontWeight: 600 }}>
              Learn more &rarr;
            </span>
          </div>
        ))}
      </div>

      {/* Testimonial-style block */}
      <div style={{ padding: "1.25rem 1.5rem", backgroundColor: lighten(theme.primaryColor, 0.95) }}>
        <div style={{ fontFamily: headingFont, fontSize: "1.5rem", color: theme.accentColor, lineHeight: 1, marginBottom: "0.35rem" }}>
          &ldquo;
        </div>
        <p style={{ fontSize: "0.7rem", color: "#4b5563", lineHeight: 1.5, fontStyle: "italic", marginBottom: "0.35rem" }}>
          Outstanding service from start to finish. Highly recommended to anyone looking for quality work.
        </p>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, color: theme.primaryColor }}>
          &mdash; A Happy Customer
        </p>
      </div>
    </>
  );
}

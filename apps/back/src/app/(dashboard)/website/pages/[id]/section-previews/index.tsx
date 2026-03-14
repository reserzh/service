import sanitizeHtml from "sanitize-html";
import { sanitizeRichText, SANITIZE_CONFIG_CUSTOM_HTML } from "@fieldservice/shared/sanitize";

type PreviewProps = {
  content: Record<string, unknown>;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontHeading: string;
    fontBody: string;
    borderRadius: string;
  };
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function safeUrl(v: unknown): string | undefined {
  const url = str(v);
  if (!url) return undefined;
  if (url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://")) {
    return url.replace(/[()]/g, encodeURIComponent);
  }
  return undefined;
}


function HeroPreview({ content, theme }: PreviewProps) {
  const alignment = (content.alignment as string) || "center";
  const textAlign = alignment === "center" ? "center" : alignment === "right" ? "right" : "left";
  return (
    <div
      className="py-16 px-8"
      style={{
        backgroundColor: theme?.primaryColor || "#1e40af",
        color: "#fff",
        textAlign: textAlign as "left" | "center" | "right",
        backgroundImage: safeUrl(content.backgroundImage) ? `url(${safeUrl(content.backgroundImage)})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <h1 style={{ fontFamily: theme?.fontHeading, fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {str(content.heading) || "Heading"}
      </h1>
      {!!content.subheading && (
        <p style={{ fontFamily: theme?.fontBody, fontSize: "1.1rem", opacity: 0.9 }}>
          {str(content.subheading)}
        </p>
      )}
      {!!content.ctaText && (
        <div style={{ marginTop: "1.5rem" }}>
          <span
            style={{
              backgroundColor: theme?.accentColor || "#f59e0b",
              color: "#fff",
              padding: "0.6rem 1.5rem",
              borderRadius: theme?.borderRadius || "0.375rem",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            {str(content.ctaText)}
          </span>
        </div>
      )}
    </div>
  );
}

function AboutPreview({ content, theme }: PreviewProps) {
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        {str(content.heading) || "About Us"}
      </h2>
      <div
        style={{ fontFamily: theme?.fontBody, fontSize: "0.9rem", color: "#666", lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(str(content.content)) || "About content..." }}
      />
    </div>
  );
}

function TestimonialsPreview({ content, theme }: PreviewProps) {
  const items = (content.items as Array<{ name: string; text: string; rating: number }>) || [];
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", textAlign: "center" }}>
        {str(content.heading) || "Testimonials"}
      </h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 2)}, 1fr)` }}>
        {items.map((item, i) => (
          <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: theme?.borderRadius || "0.375rem", padding: "1rem" }}>
            <div style={{ color: "#f59e0b", marginBottom: "0.25rem" }}>{"★".repeat(item.rating || 5)}</div>
            <div style={{ fontFamily: theme?.fontBody, fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }} dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.text) }} />
            <p style={{ fontFamily: theme?.fontBody, fontSize: "0.8rem", fontWeight: 600 }}>{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqPreview({ content, theme }: PreviewProps) {
  const items = (content.items as Array<{ question: string; answer: string }>) || [];
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
        {str(content.heading) || "FAQ"}
      </h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "0.75rem" }}>
            <p style={{ fontFamily: theme?.fontBody, fontWeight: 600, fontSize: "0.9rem" }}>{item.question}</p>
            <div style={{ fontFamily: theme?.fontBody, fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }} dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.answer) }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesPreview({ content, theme }: PreviewProps) {
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>
        {str(content.heading) || "Our Services"}
      </h2>
      {!!content.description && (
        <p style={{ fontFamily: theme?.fontBody, textAlign: "center", color: "#666", fontSize: "0.9rem" }}>{str(content.description)}</p>
      )}
      <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ backgroundColor: "#f9fafb", padding: "1rem", borderRadius: theme?.borderRadius || "0.375rem" }}>
            <div style={{ width: "2rem", height: "2rem", backgroundColor: theme?.primaryColor || "#1e40af", borderRadius: "0.25rem", marginBottom: "0.5rem" }} />
            <div style={{ height: "0.6rem", width: "60%", backgroundColor: "#d1d5db", borderRadius: "0.25rem" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactFormPreview({ content, theme }: PreviewProps) {
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
        {str(content.heading) || "Contact Us"}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div style={{ height: "2.25rem", backgroundColor: "#f3f4f6", borderRadius: theme?.borderRadius || "0.375rem", border: "1px solid #e5e7eb" }} />
          <div style={{ height: "2.25rem", backgroundColor: "#f3f4f6", borderRadius: theme?.borderRadius || "0.375rem", border: "1px solid #e5e7eb" }} />
          <div style={{ height: "5rem", backgroundColor: "#f3f4f6", borderRadius: theme?.borderRadius || "0.375rem", border: "1px solid #e5e7eb" }} />
          <div
            style={{
              height: "2.25rem",
              width: "8rem",
              backgroundColor: theme?.primaryColor || "#1e40af",
              borderRadius: theme?.borderRadius || "0.375rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            Send Message
          </div>
        </div>
        {!!content.showMap && (
          <div style={{ backgroundColor: "#e5e7eb", borderRadius: theme?.borderRadius || "0.375rem", minHeight: "10rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "0.8rem" }}>
            Map
          </div>
        )}
      </div>
    </div>
  );
}

function CtaBannerPreview({ content, theme }: PreviewProps) {
  return (
    <div
      className="py-12 px-8 text-center"
      style={{ backgroundColor: str(content.backgroundColor) || theme?.primaryColor || "#1e40af", color: "#fff" }}
    >
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {str(content.heading) || "CTA"}
      </h2>
      {!!content.subheading && (
        <p style={{ fontFamily: theme?.fontBody, opacity: 0.9, marginBottom: "1rem", fontSize: "0.9rem" }}>{str(content.subheading)}</p>
      )}
      {!!content.ctaText && (
        <span
          style={{
            backgroundColor: "#fff",
            color: str(content.backgroundColor) || theme?.primaryColor || "#1e40af",
            padding: "0.5rem 1.25rem",
            borderRadius: theme?.borderRadius || "0.375rem",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {str(content.ctaText)}
        </span>
      )}
    </div>
  );
}

function TeamPreview({ content, theme }: PreviewProps) {
  const members = (content.members as Array<{ name: string; role: string }>) || [];
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", textAlign: "center" }}>
        {str(content.heading) || "Our Team"}
      </h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(members.length || 1, 3)}, 1fr)` }}>
        {members.map((m, i) => (
          <div key={i} className="text-center">
            <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", backgroundColor: "#e5e7eb", margin: "0 auto 0.5rem" }} />
            <p style={{ fontFamily: theme?.fontBody, fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</p>
            <p style={{ fontFamily: theme?.fontBody, fontSize: "0.8rem", color: "#666" }}>{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryPreview({ content, theme }: PreviewProps) {
  const images = (content.images as Array<{ url: string; alt: string }>) || [];
  const columns = (content.columns as number) || 3;
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", textAlign: "center" }}>
        {str(content.heading) || "Gallery"}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "0.5rem" }}>
        {(images.length > 0 ? images : Array(columns).fill(null)).map((img, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "4/3",
              backgroundColor: "#e5e7eb",
              borderRadius: theme?.borderRadius || "0.375rem",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: "0.75rem",
            }}
          >
            {img?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img.url} alt={img.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              "Image"
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MapPreview({ content, theme }: PreviewProps) {
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
        {str(content.heading) || "Find Us"}
      </h2>
      <div style={{ backgroundColor: "#e5e7eb", height: "12rem", borderRadius: theme?.borderRadius || "0.375rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
        {str(content.address) || "Map Placeholder"}
      </div>
    </div>
  );
}

function FeaturesPreview({ content, theme }: PreviewProps) {
  const items = (content.items as Array<{ title: string; description: string }>) || [];
  const columns = (content.columns as number) || 3;
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", textAlign: "center" }}>
        {str(content.heading) || "Features"}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(columns, items.length || 1)}, 1fr)`, gap: "1rem" }}>
        {items.map((item, i) => (
          <div key={i} className="text-center">
            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", backgroundColor: (theme?.primaryColor || "#1e40af") + "20", margin: "0 auto 0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "1rem", height: "1rem", backgroundColor: theme?.primaryColor || "#1e40af", borderRadius: "0.125rem" }} />
            </div>
            <p style={{ fontFamily: theme?.fontBody, fontWeight: 600, fontSize: "0.9rem" }}>{item.title}</p>
            <div style={{ fontFamily: theme?.fontBody, fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }} dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.description) }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingPreview({ content, theme }: PreviewProps) {
  const items = (content.items as Array<{ name: string; price: string; highlighted: boolean; features: string[] }>) || [];
  return (
    <div className="py-12 px-8">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", textAlign: "center" }}>
        {str(content.heading) || "Pricing"}
      </h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(items.length || 1, 3)}, 1fr)` }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              border: item.highlighted ? `2px solid ${theme?.primaryColor || "#1e40af"}` : "1px solid #e5e7eb",
              borderRadius: theme?.borderRadius || "0.375rem",
              padding: "1.25rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontFamily: theme?.fontBody, fontWeight: 600, fontSize: "0.9rem" }}>{item.name}</p>
            <p style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, color: theme?.primaryColor || "#1e40af", margin: "0.5rem 0" }}>{item.price}</p>
            {item.features?.map((f, fi) => (
              <p key={fi} style={{ fontFamily: theme?.fontBody, fontSize: "0.8rem", color: "#666" }}>{f}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingWidgetPreview({ content, theme }: PreviewProps) {
  return (
    <div className="py-12 px-8 text-center">
      <h2 style={{ fontFamily: theme?.fontHeading, fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {str(content.heading) || "Book a Service"}
      </h2>
      {!!content.description && (
        <p style={{ fontFamily: theme?.fontBody, color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>{str(content.description)}</p>
      )}
      <div style={{ border: "2px dashed #d1d5db", borderRadius: theme?.borderRadius || "0.375rem", padding: "2rem", color: "#9ca3af", fontSize: "0.85rem" }}>
        Booking Widget Placeholder
      </div>
    </div>
  );
}

function CustomHtmlPreview({ content }: PreviewProps) {
  const html = sanitizeHtml(str(content.html), SANITIZE_CONFIG_CUSTOM_HTML) || "<p style='color:#999'>Custom HTML content</p>";
  return (
    <div className="py-6 px-8">
      <div
        style={{ fontSize: "0.85rem", lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

const PREVIEW_MAP: Record<string, React.ComponentType<PreviewProps>> = {
  hero: HeroPreview,
  about: AboutPreview,
  testimonials: TestimonialsPreview,
  faq: FaqPreview,
  services: ServicesPreview,
  contact_form: ContactFormPreview,
  cta_banner: CtaBannerPreview,
  team: TeamPreview,
  gallery: GalleryPreview,
  map: MapPreview,
  features: FeaturesPreview,
  pricing: PricingPreview,
  booking_widget: BookingWidgetPreview,
  custom_html: CustomHtmlPreview,
};

export function getSectionPreview(type: string): React.ComponentType<PreviewProps> | null {
  return PREVIEW_MAP[type] || null;
}

export type { PreviewProps };

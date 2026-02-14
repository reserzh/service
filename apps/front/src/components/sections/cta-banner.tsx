interface CtaBannerProps {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export function CtaBanner({ content, settings }: CtaBannerProps) {
  const heading = (content.heading as string) || "";
  const subheading = content.subheading as string | undefined;
  const ctaText = (content.ctaText as string) || "Get Started";
  const ctaLink = (content.ctaLink as string) || "#";

  const backgroundColor = (settings.backgroundColor as string) || undefined;
  const textColor = (settings.textColor as string) || undefined;

  return (
    <section
      className="py-16 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: backgroundColor || "var(--color-primary)",
        color: textColor || "#ffffff",
      }}
    >
      <div className="mx-auto max-w-4xl text-center">
        {heading && (
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="mt-4 text-lg leading-relaxed opacity-90">
            {subheading}
          </p>
        )}
        <div className="mt-8">
          <a
            href={ctaLink}
            className="inline-block rounded-lg px-8 py-3.5 text-base font-semibold shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: textColor || "#ffffff",
              color: backgroundColor || "var(--color-primary)",
            }}
          >
            {ctaText}
          </a>
        </div>
      </div>
    </section>
  );
}

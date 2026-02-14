export function HeroSection({
  content,
  settings,
}: {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}) {
  const heading = (content.heading as string) ?? "";
  const subheading = (content.subheading as string) ?? "";
  const ctaText = (content.ctaText as string) ?? "";
  const ctaLink = (content.ctaLink as string) ?? "#";
  const backgroundImage = content.backgroundImage as string | undefined;
  const alignment = (content.alignment as "left" | "center") ?? "center";

  const backgroundColor = (settings.backgroundColor as string) ?? undefined;
  const textColor = (settings.textColor as string) ?? undefined;
  const overlayOpacity = (settings.overlayOpacity as number) ?? 0.5;
  const fullHeight = (settings.fullHeight as boolean) ?? false;

  const alignmentClasses =
    alignment === "left" ? "items-start text-left" : "items-center text-center";

  return (
    <section
      className={`relative flex w-full ${alignmentClasses} justify-center overflow-hidden ${fullHeight ? "min-h-screen" : "min-h-[60vh]"}`}
      style={{
        backgroundColor: backgroundColor ?? "var(--color-primary)",
        color: textColor ?? "#ffffff",
      }}
    >
      {backgroundImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        </>
      )}

      {!backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
          }}
        />
      )}

      <div
        className={`relative z-10 mx-auto flex max-w-4xl flex-col gap-6 px-6 py-24 ${alignmentClasses}`}
      >
        {heading && (
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {heading}
          </h1>
        )}

        {subheading && (
          <p className="max-w-2xl text-lg opacity-90 sm:text-xl">
            {subheading}
          </p>
        )}

        {ctaText && (
          <a
            href={ctaLink}
            className="mt-4 inline-block rounded-lg px-8 py-3 text-lg font-semibold transition-transform hover:scale-105"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "#ffffff",
            }}
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

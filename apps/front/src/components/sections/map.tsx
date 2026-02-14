interface MapSectionProps {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export function MapSection({ content, settings }: MapSectionProps) {
  const heading = content.heading as string | undefined;
  const address = content.address as string | undefined;
  const embedUrl = content.embedUrl as string | undefined;

  const backgroundColor = (settings.backgroundColor as string) || undefined;
  const height = (settings.height as string) || "450px";

  return (
    <section
      className="py-16 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor }}
    >
      <div className="mx-auto max-w-7xl">
        {heading && (
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-10">
            {heading}
          </h2>
        )}

        {embedUrl ? (
          <div
            className="relative w-full overflow-hidden rounded-xl shadow-sm ring-1 ring-gray-100"
            style={{ height }}
          >
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={heading || "Map"}
            />
          </div>
        ) : address ? (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              style={{ color: "var(--color-primary)" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p className="text-lg text-gray-700">{address}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

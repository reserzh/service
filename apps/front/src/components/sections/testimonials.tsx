export function TestimonialsSection({
  content,
  settings,
}: {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}) {
  const heading = (content.heading as string) ?? "";
  const items = (content.items as Array<Record<string, unknown>>) ?? [];

  const backgroundColor = (settings.backgroundColor as string) ?? undefined;
  const layout = (settings.layout as "grid" | "slider") ?? "grid";

  function renderStars(rating: number) {
    const clamped = Math.min(5, Math.max(0, Math.round(rating)));
    const filled = "★".repeat(clamped);
    const empty = "☆".repeat(5 - clamped);
    return filled + empty;
  }

  return (
    <section
      className="w-full py-16 lg:py-24"
      style={{ backgroundColor: backgroundColor ?? "#f9fafb" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {heading && (
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
        )}

        {items.length > 0 && (
          <div
            className={`mt-12 ${
              layout === "slider"
                ? "flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
                : "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {items.map((item, index) => {
              const name = (item.name as string) ?? "";
              const text = (item.text as string) ?? "";
              const rating = item.rating as number | undefined;
              const photo = item.photo as string | undefined;

              return (
                <article
                  key={index}
                  className={`flex flex-col rounded-xl border border-gray-200 bg-white p-8 shadow-sm ${
                    layout === "slider"
                      ? "min-w-[320px] flex-shrink-0 snap-start"
                      : ""
                  }`}
                >
                  {rating != null && (
                    <div
                      className="mb-4 text-xl tracking-wider"
                      style={{ color: "var(--color-accent)" }}
                      aria-label={`${rating} out of 5 stars`}
                    >
                      {renderStars(rating)}
                    </div>
                  )}

                  {text && (
                    <blockquote className="flex-1 text-gray-700">
                      <p className="leading-relaxed">&ldquo;{text}&rdquo;</p>
                    </blockquote>
                  )}

                  <div className="mt-6 flex items-center gap-3">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{
                          backgroundColor: "var(--color-primary)",
                        }}
                      >
                        {name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                    <span className="font-semibold text-gray-900">{name}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

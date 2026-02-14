export function ServicesGrid({
  content,
  settings,
}: {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}) {
  const heading = (content.heading as string) ?? "";
  const description = content.description as string | undefined;
  const rawItems = (content.items as Array<Record<string, unknown>>) ?? [];
  const showPricing = (content.showPricing as boolean) ?? false;
  const layout = (content.layout as "grid" | "list") ?? "grid";

  const backgroundColor = (settings.backgroundColor as string) ?? undefined;
  const maxItems = (settings.maxItems as number) ?? 0;
  const columns = (settings.columns as number) ?? 3;

  const items = maxItems > 0 ? rawItems.slice(0, maxItems) : rawItems;

  const gridColsClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      className="w-full py-16 lg:py-24"
      style={{ backgroundColor: backgroundColor ?? "#ffffff" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {heading && (
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
        )}

        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
            {description}
          </p>
        )}

        {items.length > 0 && (
          <div
            className={`mt-12 ${
              layout === "list"
                ? "flex flex-col gap-4"
                : `grid grid-cols-1 gap-8 ${gridColsClass}`
            }`}
          >
            {items.map((item, index) => {
              const name = (item.name as string) ?? "";
              const shortDescription =
                (item.shortDescription as string) ?? "";
              const icon = item.icon as string | undefined;
              const priceDisplay = item.priceDisplay as string | undefined;
              const slug = item.slug as string | undefined;

              if (layout === "list") {
                return (
                  <div
                    key={index}
                    className="flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                  >
                    {icon && (
                      <span className="flex-shrink-0 text-3xl" role="img">
                        {icon}
                      </span>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{name}</h3>
                      {shortDescription && (
                        <p className="mt-1 text-gray-600">
                          {shortDescription}
                        </p>
                      )}
                    </div>
                    {showPricing && priceDisplay && (
                      <span
                        className="flex-shrink-0 text-lg font-bold"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {priceDisplay}
                      </span>
                    )}
                    {slug && (
                      <a
                        href={`/services/${slug}`}
                        className="flex-shrink-0 text-sm font-medium underline"
                        style={{ color: "var(--color-accent)" }}
                      >
                        Learn more
                      </a>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-8 text-center transition-shadow hover:shadow-lg"
                >
                  {icon && (
                    <span className="mb-4 text-4xl" role="img">
                      {icon}
                    </span>
                  )}
                  <h3 className="text-xl font-semibold">{name}</h3>
                  {shortDescription && (
                    <p className="mt-2 text-gray-600">{shortDescription}</p>
                  )}
                  {showPricing && priceDisplay && (
                    <p
                      className="mt-4 text-2xl font-bold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {priceDisplay}
                    </p>
                  )}
                  {slug && (
                    <a
                      href={`/services/${slug}`}
                      className="mt-4 inline-block text-sm font-medium underline"
                      style={{ color: "var(--color-accent)" }}
                    >
                      Learn more
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

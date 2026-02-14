interface FeaturesSectionProps {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export function FeaturesSection({ content, settings }: FeaturesSectionProps) {
  const heading = (content.heading as string) || "";
  const description = content.description as string | undefined;
  const items =
    (content.items as Array<{
      title: string;
      description: string;
      icon?: string;
    }>) || [];

  const backgroundColor = (settings.backgroundColor as string) || undefined;
  const columns = (settings.columns as number) || 3;

  const gridColsClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      className="py-16 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor }}
    >
      <div className="mx-auto max-w-7xl">
        {heading && (
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
        )}
        {description && (
          <p className="mt-4 text-center text-lg text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        )}
        <div className={`mt-12 grid grid-cols-1 gap-8 ${gridColsClass}`}>
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow duration-200 hover:shadow-md"
            >
              {item.icon && (
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-xl"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                    color: "var(--color-primary)",
                  }}
                >
                  <span role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                </div>
              )}
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

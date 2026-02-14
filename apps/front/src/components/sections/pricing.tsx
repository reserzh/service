interface PricingSectionProps {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export function PricingSection({ content, settings }: PricingSectionProps) {
  const heading = (content.heading as string) || "";
  const description = content.description as string | undefined;
  const items =
    (content.items as Array<{
      name: string;
      price: string;
      description?: string;
      features?: string[];
    }>) || [];

  const backgroundColor = (settings.backgroundColor as string) || undefined;

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
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100"
            >
              <h3 className="text-xl font-semibold">{item.name}</h3>
              <p
                className="mt-4 text-4xl font-bold tracking-tight"
                style={{ color: "var(--color-primary)" }}
              >
                {item.price}
              </p>
              {item.description && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.features && item.features.length > 0 && (
                <ul className="mt-6 flex-1 space-y-3">
                  {item.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mt-0.5 h-5 w-5 flex-shrink-0"
                        style={{ color: "var(--color-accent, var(--color-primary))" }}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

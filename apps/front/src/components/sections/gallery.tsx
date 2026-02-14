export function GallerySection({
  content,
  settings,
}: {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}) {
  const heading = content.heading as string | undefined;
  const images = (content.images as Array<Record<string, unknown>>) ?? [];

  const backgroundColor = (settings.backgroundColor as string) ?? undefined;
  const columns = (settings.columns as number) ?? 3;

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

        {images.length > 0 && (
          <div
            className={`mt-12 grid grid-cols-1 gap-4 ${gridColsClass}`}
          >
            {images.map((image, index) => {
              const url = (image.url as string) ?? "";
              const alt = (image.alt as string) ?? "";
              const caption = image.caption as string | undefined;

              return (
                <figure key={index} className="group overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={alt}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {caption && (
                    <figcaption className="mt-2 text-center text-sm text-gray-600">
                      {caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

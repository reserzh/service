export function AboutSection({
  content,
  settings,
}: {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}) {
  const heading = (content.heading as string) ?? "";
  const body = (content.body as string) ?? "";
  const imageUrl = content.imageUrl as string | undefined;
  const imagePosition = (content.imagePosition as "left" | "right") ?? "right";

  const backgroundColor = (settings.backgroundColor as string) ?? undefined;

  const hasImage = Boolean(imageUrl);

  return (
    <section
      className="w-full py-16 lg:py-24"
      style={{ backgroundColor: backgroundColor ?? "#ffffff" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {hasImage ? (
          <div
            className={`flex flex-col items-center gap-12 lg:flex-row ${
              imagePosition === "left" ? "lg:flex-row" : "lg:flex-row-reverse"
            }`}
          >
            <div className="w-full lg:w-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl!}
                alt={heading || "About us"}
                className="h-auto w-full rounded-xl object-cover shadow-lg"
              />
            </div>

            <div className="w-full lg:w-1/2">
              {heading && (
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {heading}
                </h2>
              )}
              {body && (
                <div className="mt-6 space-y-4 text-lg leading-relaxed text-gray-700">
                  {body.split("\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl text-center">
            {heading && (
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {heading}
              </h2>
            )}
            {body && (
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-gray-700">
                {body.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

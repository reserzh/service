export function BookingWidget({
  content,
  settings,
}: {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}) {
  const heading = (content.heading as string) ?? "";
  const description = content.description as string | undefined;

  const backgroundColor = (settings.backgroundColor as string) ?? undefined;

  return (
    <section
      className="w-full py-16 lg:py-24"
      style={{
        backgroundColor: backgroundColor ?? "var(--color-primary)",
        color: "#ffffff",
      }}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        {heading && (
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
        )}

        {description && (
          <p className="mt-4 max-w-xl text-lg opacity-90">{description}</p>
        )}

        <a
          href="/book"
          className="mt-8 inline-block rounded-lg px-10 py-4 text-lg font-bold transition-transform hover:scale-105"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#ffffff",
          }}
        >
          Book Now
        </a>
      </div>
    </section>
  );
}

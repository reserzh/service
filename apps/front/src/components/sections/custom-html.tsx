interface CustomHtmlSectionProps {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export function CustomHtmlSection({ content, settings }: CustomHtmlSectionProps) {
  const html = (content.html as string) || "";

  const backgroundColor = (settings.backgroundColor as string) || undefined;

  return (
    <section
      className="py-16 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor }}
    >
      <div
        className="mx-auto max-w-7xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

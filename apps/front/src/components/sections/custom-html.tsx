import sanitizeHtml from "sanitize-html";
import { SANITIZE_CONFIG_CUSTOM_HTML } from "@fieldservice/shared/sanitize";

interface CustomHtmlSectionProps {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export function CustomHtmlSection({ content, settings }: CustomHtmlSectionProps) {
  const rawHtml = (content.html as string) || "";
  const html = sanitizeHtml(rawHtml, SANITIZE_CONFIG_CUSTOM_HTML);

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

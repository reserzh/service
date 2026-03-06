import sanitizeHtml from "sanitize-html";

interface CustomHtmlSectionProps {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export function CustomHtmlSection({ content, settings }: CustomHtmlSectionProps) {
  const rawHtml = (content.html as string) || "";
  const html = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "figure", "figcaption", "video", "source", "iframe",
      "details", "summary", "mark", "section", "article", "aside",
      "header", "footer", "nav", "main",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class", "id", "style"],
      img: ["src", "alt", "width", "height", "loading"],
      iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "title"],
      video: ["src", "controls", "width", "height", "poster"],
      source: ["src", "type"],
      a: ["href", "target", "rel"],
    },
    allowedIframeHostnames: ["www.youtube.com", "www.google.com", "player.vimeo.com"],
  });

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

import sanitizeHtml from "sanitize-html";

/** Permissive config for custom HTML sections — allows iframes, videos, images, etc. */
export const SANITIZE_CONFIG_CUSTOM_HTML: sanitizeHtml.IOptions = {
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
};

/** Restrictive config for rich text fields — only basic formatting tags */
export const SANITIZE_CONFIG_RICH_TEXT: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "a",
    "ul", "ol", "li",
    "h2", "h3", "h4",
    "blockquote", "code",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
};

/**
 * Sanitize rich text HTML.
 * If input contains no HTML tags (plain text from before rich text was added),
 * converts newlines to `<br>` for backward compatibility.
 */
export function sanitizeRichText(html: string): string {
  if (!html) return "";
  const hasHtmlTags = /<[a-z][\s\S]*?>/i.test(html);
  const input = hasHtmlTags ? html : html.replace(/\n/g, "<br>");
  return sanitizeHtml(input, SANITIZE_CONFIG_RICH_TEXT);
}

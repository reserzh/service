import sanitizeHtml from "sanitize-html";

/** Permissive config for custom HTML sections — allows iframes, videos, images, etc. */
export const SANITIZE_CONFIG_CUSTOM_HTML: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img", "figure", "figcaption", "video", "source", "iframe",
    "details", "summary", "mark", "section", "article", "aside",
    "header", "footer", "nav", "main",
  ]),
  allowedAttributes: {
    "*": ["class", "id", "style"],
    img: ["src", "alt", "width", "height", "loading"],
    iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "title"],
    video: ["src", "controls", "width", "height", "poster"],
    source: ["src", "type"],
    a: ["href", "target", "rel"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  allowedStyles: {
    "*": {
      // Colors: hex, rgb/rgba, hsl/hsla, or named CSS colors only
      "color": [/^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}[\s,]+\d{1,3}[\s,]+\d{1,3}([\s,/]+[\d.]+%?)?\s*\)|hsla?\(\s*\d{1,3}[\s,]+[\d.]+%[\s,]+[\d.]+%([\s,/]+[\d.]+%?)?\s*\)|[a-zA-Z]{3,20})$/],
      "background-color": [/^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}[\s,]+\d{1,3}[\s,]+\d{1,3}([\s,/]+[\d.]+%?)?\s*\)|hsla?\(\s*\d{1,3}[\s,]+[\d.]+%[\s,]+[\d.]+%([\s,/]+[\d.]+%?)?\s*\)|[a-zA-Z]{3,20}|transparent)$/],
      "background": [/^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}[\s,]+\d{1,3}[\s,]+\d{1,3}([\s,/]+[\d.]+%?)?\s*\)|[a-zA-Z]{3,20}|transparent|none)$/],
      "text-align": [/^(left|right|center|justify)$/],
      // Font-size: only reasonable values (px, em, rem, pt, %)
      "font-size": [/^(\d{1,3}(\.\d{1,2})?(px|em|rem|pt|%))$/],
      "font-weight": [/^(normal|bold|bolder|lighter|[1-9]00)$/],
      "font-style": [/^(normal|italic|oblique)$/],
      // Spacing: only numeric values with units, block expression/var/calc
      "margin": [/^(-?\d{1,4}(\.\d{1,2})?(px|em|rem|%|auto)(\s+-?\d{1,4}(\.\d{1,2})?(px|em|rem|%|auto)){0,3}|0|auto)$/],
      "margin-top": [/^(-?\d{1,4}(\.\d{1,2})?(px|em|rem|%)|0|auto)$/],
      "margin-bottom": [/^(-?\d{1,4}(\.\d{1,2})?(px|em|rem|%)|0|auto)$/],
      "margin-left": [/^(-?\d{1,4}(\.\d{1,2})?(px|em|rem|%)|0|auto)$/],
      "margin-right": [/^(-?\d{1,4}(\.\d{1,2})?(px|em|rem|%)|0|auto)$/],
      "padding": [/^(\d{1,4}(\.\d{1,2})?(px|em|rem|%)(\s+\d{1,4}(\.\d{1,2})?(px|em|rem|%)){0,3}|0)$/],
      "padding-top": [/^(\d{1,4}(\.\d{1,2})?(px|em|rem|%)|0)$/],
      "padding-bottom": [/^(\d{1,4}(\.\d{1,2})?(px|em|rem|%)|0)$/],
      "padding-left": [/^(\d{1,4}(\.\d{1,2})?(px|em|rem|%)|0)$/],
      "padding-right": [/^(\d{1,4}(\.\d{1,2})?(px|em|rem|%)|0)$/],
      "border": [/^(\d{1,3}px\s+(solid|dashed|dotted|double|none)\s+(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20})|none)$/],
      "border-radius": [/^(\d{1,3}(\.\d{1,2})?(px|em|rem|%)(\s+\d{1,3}(\.\d{1,2})?(px|em|rem|%)){0,3}|0)$/],
      "width": [/^(\d{1,4}(\.\d{1,2})?(px|em|rem|%|vw)|auto|100%)$/],
      "max-width": [/^(\d{1,4}(\.\d{1,2})?(px|em|rem|%|vw)|none|100%)$/],
      "height": [/^(\d{1,4}(\.\d{1,2})?(px|em|rem|%|vh)|auto)$/],
      "display": [/^(block|inline|inline-block|flex|grid|none)$/],
      "list-style-type": [/^(disc|circle|square|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman|none)$/],
      "line-height": [/^(\d{1,2}(\.\d{1,2})?(px|em|rem|%)?|normal)$/],
    },
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

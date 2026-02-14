export type { StarterTemplate, TemplatePage, TemplateSection, TemplateService, TemplateTheme } from "./types";
export { hvacTemplate } from "./hvac";
export { plumbingTemplate } from "./plumbing";
export { generalTemplate } from "./general";

import { hvacTemplate } from "./hvac";
import { plumbingTemplate } from "./plumbing";
import { generalTemplate } from "./general";
import type { StarterTemplate } from "./types";

export const templates: Record<string, StarterTemplate> = {
  hvac: hvacTemplate,
  plumbing: plumbingTemplate,
  general: generalTemplate,
};

export function getTemplate(id: string): StarterTemplate | undefined {
  return templates[id];
}

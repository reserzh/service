export interface TemplateSection {
  type: string;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface TemplatePage {
  slug: string;
  title: string;
  isHomepage?: boolean;
  showInNav?: boolean;
  navLabel?: string;
  sections: TemplateSection[];
}

export interface TemplateService {
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  priceDisplay?: string;
  isBookable: boolean;
  estimatedDuration?: number;
  icon?: string;
}

export interface TemplateTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
}

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  theme: TemplateTheme;
  pages: TemplatePage[];
  services: TemplateService[];
}

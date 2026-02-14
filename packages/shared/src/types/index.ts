export type UserRole = "admin" | "office_manager" | "dispatcher" | "csr" | "technician";

export interface UserContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
}

// TenantSettings is exported from db/schema/tenants.ts

// Website-related types
export type SiteTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
  style?: string;
};

export type SiteBranding = {
  logoUrl?: string;
  faviconUrl?: string;
  businessName: string;
  tagline?: string;
  phone?: string;
  email?: string;
};

export type SiteSeoDefaults = {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
};

export type SiteSocialLinks = {
  facebook?: string;
  instagram?: string;
  google?: string;
  yelp?: string;
  nextdoor?: string;
};

export type SiteAnalytics = {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
};

export type PageSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
  noIndex?: boolean;
};

// Section content types
export type HeroContent = {
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  alignment?: "left" | "center";
};

export type ServicesGridContent = {
  heading?: string;
  description?: string;
  showPricing?: boolean;
  maxItems?: number;
  layout?: "grid" | "list";
};

export type TestimonialsContent = {
  heading?: string;
  items: Array<{
    name: string;
    text: string;
    rating: number;
    photo?: string;
  }>;
};

export type FaqContent = {
  heading?: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
};

export type ContactFormContent = {
  heading?: string;
  description?: string;
  showMap?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
};

export type BookingWidgetContent = {
  heading?: string;
  description?: string;
  showServicePicker?: boolean;
  showDatePicker?: boolean;
};

export type AboutContent = {
  heading?: string;
  content?: string;
  image?: string;
  layout?: "left" | "right" | "center";
};

export type GalleryContent = {
  heading?: string;
  images: Array<{
    url: string;
    alt?: string;
    caption?: string;
  }>;
  columns?: number;
};

export type CtaBannerContent = {
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
};

export type TeamContent = {
  heading?: string;
  members: Array<{
    name: string;
    role?: string;
    photo?: string;
    bio?: string;
  }>;
};

export type MapContent = {
  heading?: string;
  address?: string;
  showDirectionsLink?: boolean;
};

export type CustomHtmlContent = {
  html: string;
};

export type FeaturesContent = {
  heading?: string;
  description?: string;
  items: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
  columns?: number;
};

export type PricingContent = {
  heading?: string;
  description?: string;
  items: Array<{
    name: string;
    price: string;
    description?: string;
    features?: string[];
    highlighted?: boolean;
  }>;
};

export type SectionContent =
  | HeroContent
  | ServicesGridContent
  | TestimonialsContent
  | FaqContent
  | ContactFormContent
  | BookingWidgetContent
  | AboutContent
  | GalleryContent
  | CtaBannerContent
  | TeamContent
  | MapContent
  | CustomHtmlContent
  | FeaturesContent
  | PricingContent;

export type SectionSettings = {
  backgroundColor?: string;
  textColor?: string;
  paddingY?: string;
  paddingX?: string;
  maxWidth?: string;
  fullWidth?: boolean;
};

import { HeroSection } from "./hero";
import { ServicesGrid } from "./services-grid";
import { AboutSection } from "./about";
import { TestimonialsSection } from "./testimonials";
import { GallerySection } from "./gallery";
import { ContactFormSection } from "./contact-form";
import { BookingWidget } from "./booking-widget";
import { CtaBanner } from "./cta-banner";
import { FaqSection } from "./faq";
import { TeamSection } from "./team";
import { MapSection } from "./map";
import { FeaturesSection } from "./features";
import { PricingSection } from "./pricing";
import { CustomHtmlSection } from "./custom-html";

type SectionData = {
  id: string;
  type: string;
  content: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
};

const sectionComponents: Record<string, React.ComponentType<{ content: Record<string, unknown>; settings: Record<string, unknown> }>> = {
  hero: HeroSection,
  services: ServicesGrid,
  about: AboutSection,
  testimonials: TestimonialsSection,
  gallery: GallerySection,
  contact_form: ContactFormSection,
  booking_widget: BookingWidget,
  cta_banner: CtaBanner,
  faq: FaqSection,
  team: TeamSection,
  map: MapSection,
  features: FeaturesSection,
  pricing: PricingSection,
  custom_html: CustomHtmlSection,
};

export function SectionRenderer({ section }: { section: SectionData }) {
  const Component = sectionComponents[section.type];
  if (!Component) return null;

  return (
    <Component
      content={(section.content ?? {}) as Record<string, unknown>}
      settings={(section.settings ?? {}) as Record<string, unknown>}
    />
  );
}

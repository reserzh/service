import { HeroEditor } from "./hero-editor";
import { AboutEditor } from "./about-editor";
import { TestimonialsEditor } from "./testimonials-editor";
import { FaqEditor } from "./faq-editor";
import { GalleryEditor } from "./gallery-editor";
import { ServicesEditor } from "./services-editor";
import { ContactFormEditor } from "./contact-form-editor";
import { CtaBannerEditor } from "./cta-banner-editor";
import { TeamEditor } from "./team-editor";
import { MapEditor } from "./map-editor";
import { FeaturesEditor } from "./features-editor";
import { PricingEditor } from "./pricing-editor";
import { BookingWidgetEditor } from "./booking-widget-editor";
import { CustomHtmlEditor } from "./custom-html-editor";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

const EDITOR_MAP: Record<string, React.ComponentType<SectionEditorProps>> = {
  hero: HeroEditor,
  about: AboutEditor,
  testimonials: TestimonialsEditor,
  faq: FaqEditor,
  gallery: GalleryEditor,
  services: ServicesEditor,
  contact_form: ContactFormEditor,
  cta_banner: CtaBannerEditor,
  team: TeamEditor,
  map: MapEditor,
  features: FeaturesEditor,
  pricing: PricingEditor,
  booking_widget: BookingWidgetEditor,
  custom_html: CustomHtmlEditor,
};

export function getSectionEditor(type: string): React.ComponentType<SectionEditorProps> | null {
  return EDITOR_MAP[type] || null;
}

export { SectionSettingsEditor } from "./section-settings-editor";

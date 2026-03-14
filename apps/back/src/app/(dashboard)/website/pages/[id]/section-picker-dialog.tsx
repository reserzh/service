"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImageIcon,
  Info,
  Star,
  Megaphone,
  Code,
  Wrench,
  DollarSign,
  CalendarPlus,
  MessageSquareQuote,
  Users,
  Images,
  Mail,
  HelpCircle,
  MapPin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: string) => void;
};

type SectionTypeInfo = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const SECTION_CATEGORIES: { label: string; types: SectionTypeInfo[] }[] = [
  {
    label: "Content",
    types: [
      { value: "hero", label: "Hero Banner", description: "Large hero section with heading and CTA", icon: ImageIcon },
      { value: "about", label: "About", description: "About your business", icon: Info },
      { value: "features", label: "Features", description: "Feature highlights", icon: Star },
      { value: "cta_banner", label: "CTA Banner", description: "Call-to-action banner", icon: Megaphone },
      { value: "custom_html", label: "Custom HTML", description: "Raw HTML content", icon: Code },
    ],
  },
  {
    label: "Services",
    types: [
      { value: "services", label: "Services Grid", description: "Display your service catalog", icon: Wrench },
      { value: "pricing", label: "Pricing", description: "Pricing plans", icon: DollarSign },
      { value: "booking_widget", label: "Booking Widget", description: "Online booking form", icon: CalendarPlus },
    ],
  },
  {
    label: "Social Proof",
    types: [
      { value: "testimonials", label: "Testimonials", description: "Customer reviews and testimonials", icon: MessageSquareQuote },
      { value: "team", label: "Team", description: "Team members", icon: Users },
      { value: "gallery", label: "Gallery", description: "Image gallery", icon: Images },
    ],
  },
  {
    label: "Interactive",
    types: [
      { value: "contact_form", label: "Contact Form", description: "Contact form with map", icon: Mail },
      { value: "faq", label: "FAQ", description: "Frequently asked questions", icon: HelpCircle },
      { value: "map", label: "Map", description: "Location map", icon: MapPin },
    ],
  },
];

export function SectionPickerDialog({ open, onOpenChange, onSelect }: SectionPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {SECTION_CATEGORIES.map((category) => (
            <div key={category.label}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {category.label}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {category.types.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => onSelect(type.value)}
                      className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center hover:bg-accent hover:border-accent-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
                    >
                      <Icon className="h-6 w-6 text-muted-foreground" />
                      <span className="font-medium text-sm">{type.label}</span>
                      <span className="text-xs text-muted-foreground leading-tight">
                        {type.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

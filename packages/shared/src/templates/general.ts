import type { StarterTemplate } from "./types";

export const generalTemplate: StarterTemplate = {
  id: "general",
  name: "Trade Services",
  description: "Versatile template for any trade or home service business",
  theme: {
    primaryColor: "#059669",
    secondaryColor: "#065f46",
    accentColor: "#f97316",
    fontHeading: "Inter",
    fontBody: "Inter",
    borderRadius: "0.5rem",
  },
  pages: [
    {
      slug: "home",
      title: "Home",
      isHomepage: true,
      showInNav: true,
      navLabel: "Home",
      sections: [
        {
          type: "hero",
          content: {
            heading: "Professional Service You Can Count On",
            subheading: "Quality workmanship, honest pricing, and exceptional customer service. Serving our community with pride.",
            ctaText: "Request Service",
            ctaLink: "/book",
            alignment: "center",
          },
          settings: { fullHeight: false },
        },
        {
          type: "services",
          content: {
            heading: "What We Do",
            description: "Comprehensive services for your home and business",
            showPricing: false,
            layout: "grid",
          },
        },
        {
          type: "features",
          content: {
            heading: "The Difference Is in the Details",
            items: [
              { title: "Experienced Professionals", description: "Our team brings years of hands-on experience to every project.", icon: "👷" },
              { title: "Fair & Transparent Pricing", description: "Detailed quotes upfront. No hidden fees, no surprises.", icon: "📋" },
              { title: "Fully Licensed & Insured", description: "Complete peace of mind with our licensing and insurance coverage.", icon: "✅" },
              { title: "Satisfaction Guaranteed", description: "We're not done until you're completely satisfied with our work.", icon: "⭐" },
            ],
          },
          settings: { columns: 2 },
        },
        {
          type: "testimonials",
          content: {
            heading: "Trusted by Our Community",
            items: [
              { name: "Robert S.", text: "Excellent work and great communication throughout the entire project. Highly recommend!", rating: 5 },
              { name: "Jennifer L.", text: "On time, professional, and the quality of work was outstanding. Will definitely call again.", rating: 5 },
              { name: "Michael B.", text: "Fair pricing and they went above and beyond. Best service company in the area.", rating: 5 },
            ],
          },
        },
        {
          type: "cta_banner",
          content: {
            heading: "Ready to Get Started?",
            subheading: "Book your appointment today — fast, easy, and convenient",
            ctaText: "Schedule Now",
            ctaLink: "/book",
          },
        },
      ],
    },
    {
      slug: "about",
      title: "About Us",
      showInNav: true,
      navLabel: "About",
      sections: [
        {
          type: "about",
          content: {
            heading: "About Our Company",
            body: "We're a locally owned and operated service company dedicated to providing top-quality work at fair prices.\n\nOur team of experienced professionals takes pride in every job, whether it's a quick repair or a major project. We believe in doing things right the first time and building lasting relationships with our customers.\n\nFrom our family to yours, thank you for trusting us with your home.",
            imagePosition: "right",
          },
        },
        {
          type: "team",
          content: {
            heading: "Our Team",
            members: [
              { name: "Owner", role: "Founder & Lead Technician", bio: "Bringing expertise and dedication to every job" },
              { name: "Office Manager", role: "Customer Relations", bio: "Making sure every experience is exceptional" },
            ],
          },
          settings: { columns: 2 },
        },
      ],
    },
    {
      slug: "services",
      title: "Services",
      showInNav: true,
      navLabel: "Services",
      sections: [
        {
          type: "services",
          content: {
            heading: "Our Services",
            description: "Professional services tailored to your needs",
            showPricing: true,
            layout: "list",
          },
        },
        {
          type: "faq",
          content: {
            heading: "Frequently Asked Questions",
            items: [
              { question: "How do I schedule an appointment?", answer: "You can book online through our website, call us, or send us a message through our contact form." },
              { question: "What areas do you serve?", answer: "We serve the local area and surrounding communities. Contact us to confirm service availability in your location." },
              { question: "Do you offer free estimates?", answer: "Yes, we offer free estimates for most services. Contact us for details." },
              { question: "Are you licensed and insured?", answer: "Yes, we are fully licensed, bonded, and insured for your protection." },
            ],
          },
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      showInNav: true,
      navLabel: "Contact",
      sections: [
        {
          type: "contact_form",
          content: {
            heading: "Contact Us",
            description: "Questions? Need a quote? We're here to help.",
            showPhone: true,
            showEmail: true,
          },
        },
        {
          type: "map",
          content: {
            heading: "Find Us",
            address: "Serving the local area and surrounding communities",
          },
        },
      ],
    },
  ],
  services: [
    { name: "Repair Service", slug: "repair", shortDescription: "Expert repairs for your home or business", priceDisplay: "Call for quote", isBookable: true, estimatedDuration: 120, icon: "🔧" },
    { name: "Installation", slug: "installation", shortDescription: "Professional installation services", priceDisplay: "Call for quote", isBookable: true, estimatedDuration: 240, icon: "🏗️" },
    { name: "Maintenance", slug: "maintenance", shortDescription: "Regular maintenance to prevent costly repairs", priceDisplay: "Starting at $99", isBookable: true, estimatedDuration: 90, icon: "📋" },
    { name: "Inspection", slug: "inspection", shortDescription: "Thorough inspection and assessment", priceDisplay: "Starting at $79", isBookable: true, estimatedDuration: 60, icon: "🔍" },
    { name: "Emergency Service", slug: "emergency", shortDescription: "24/7 emergency service available", priceDisplay: "Call for pricing", isBookable: true, estimatedDuration: 120, icon: "🚨" },
  ],
};

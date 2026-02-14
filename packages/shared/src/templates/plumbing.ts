import type { StarterTemplate } from "./types";

export const plumbingTemplate: StarterTemplate = {
  id: "plumbing",
  name: "Plumbing Pro",
  description: "Ideal for plumbing, drain, and water heater businesses",
  theme: {
    primaryColor: "#0369a1",
    secondaryColor: "#0c4a6e",
    accentColor: "#22c55e",
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
            heading: "Reliable Plumbing You Can Trust",
            subheading: "Expert plumbing services for your home and business. Fast response, honest pricing, and guaranteed workmanship.",
            ctaText: "Get Help Now",
            ctaLink: "/book",
            alignment: "center",
          },
          settings: { fullHeight: false },
        },
        {
          type: "services",
          content: {
            heading: "Our Plumbing Services",
            description: "From leaky faucets to complete repiping — we handle it all",
            showPricing: true,
            layout: "grid",
          },
        },
        {
          type: "features",
          content: {
            heading: "Why Customers Choose Us",
            items: [
              { title: "Same-Day Service", description: "We understand plumbing emergencies can't wait. Same-day service available.", icon: "⚡" },
              { title: "Licensed Plumbers", description: "All our plumbers are fully licensed, insured, and background-checked.", icon: "🪪" },
              { title: "Upfront Pricing", description: "We provide a detailed quote before starting any work. No surprises.", icon: "💰" },
              { title: "Warranty on All Work", description: "Every job comes with our satisfaction guarantee and warranty.", icon: "🏆" },
            ],
          },
          settings: { columns: 4 },
        },
        {
          type: "testimonials",
          content: {
            heading: "Customer Reviews",
            items: [
              { name: "Tom H.", text: "Called at 10pm with a burst pipe. They were here within 45 minutes. Lifesavers!", rating: 5 },
              { name: "Karen P.", text: "Best plumber we've ever used. Fair prices and excellent quality work.", rating: 5 },
              { name: "David W.", text: "Replaced our water heater same day. Very professional and cleaned up perfectly.", rating: 5 },
            ],
          },
        },
        {
          type: "booking_widget",
          content: {
            heading: "Need a Plumber?",
            description: "Book your service online and we'll confirm within the hour",
          },
        },
      ],
    },
    {
      slug: "about",
      title: "About",
      showInNav: true,
      navLabel: "About",
      sections: [
        {
          type: "about",
          content: {
            heading: "Your Local Plumbing Experts",
            body: "Family-owned and operated since 2005, we've built our reputation on honest service, quality workmanship, and treating every customer like family.\n\nOur team of licensed plumbers brings decades of combined experience to every job. Whether it's a simple faucet repair or a complex repiping project, we have the skills and equipment to get it done right.\n\nWe're proud to serve our community and be the plumber our neighbors trust.",
            imagePosition: "left",
          },
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
            heading: "Full-Service Plumbing Solutions",
            description: "Professional plumbing services for residential and commercial properties",
            showPricing: true,
            layout: "list",
          },
        },
        {
          type: "faq",
          content: {
            heading: "Common Questions",
            items: [
              { question: "Do you charge for estimates?", answer: "We offer free estimates for most jobs. For complex projects, we provide a detailed written quote." },
              { question: "Are you available for emergencies?", answer: "Yes! We offer 24/7 emergency plumbing service. Call us anytime for urgent plumbing issues." },
              { question: "What areas do you serve?", answer: "We serve the greater metro area and surrounding communities within a 30-mile radius." },
              { question: "Do you work on both residential and commercial?", answer: "Yes, we provide plumbing services for both residential and commercial properties." },
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
            description: "Reach out for questions, quotes, or to schedule service",
            showPhone: true,
            showEmail: true,
          },
        },
      ],
    },
  ],
  services: [
    { name: "Drain Cleaning", slug: "drain-cleaning", shortDescription: "Professional drain clearing and cleaning", priceDisplay: "Starting at $99", isBookable: true, estimatedDuration: 90, icon: "🚿" },
    { name: "Water Heater Repair", slug: "water-heater-repair", shortDescription: "Tank and tankless water heater repair", priceDisplay: "Starting at $129", isBookable: true, estimatedDuration: 120, icon: "🔥" },
    { name: "Water Heater Installation", slug: "water-heater-installation", shortDescription: "New water heater installation and replacement", priceDisplay: "Call for quote", isBookable: true, estimatedDuration: 300, icon: "🏗️" },
    { name: "Leak Detection & Repair", slug: "leak-detection", shortDescription: "Find and fix leaks before they cause damage", priceDisplay: "Starting at $89", isBookable: true, estimatedDuration: 120, icon: "🔍" },
    { name: "Toilet Repair", slug: "toilet-repair", shortDescription: "Toilet repair, replacement, and installation", priceDisplay: "Starting at $79", isBookable: true, estimatedDuration: 60, icon: "🚽" },
    { name: "Sewer Line Service", slug: "sewer-line", shortDescription: "Sewer line inspection, repair, and replacement", priceDisplay: "Call for quote", isBookable: true, estimatedDuration: 240, icon: "🔧" },
    { name: "Repiping", slug: "repiping", shortDescription: "Whole-house and partial repiping services", priceDisplay: "Call for quote", isBookable: true, estimatedDuration: 480, icon: "🏠" },
  ],
};

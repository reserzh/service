import type { StarterTemplate } from "./types";

export const hvacTemplate: StarterTemplate = {
  id: "hvac",
  name: "HVAC Pro",
  description: "Perfect for heating, cooling, and air quality businesses",
  theme: {
    primaryColor: "#1e40af",
    secondaryColor: "#1e3a5f",
    accentColor: "#f59e0b",
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
            heading: "Your Comfort Is Our Priority",
            subheading: "Professional heating, cooling, and air quality services for your home and business. Available 24/7 for emergencies.",
            ctaText: "Schedule Service",
            ctaLink: "/book",
            alignment: "center",
          },
          settings: { fullHeight: false },
        },
        {
          type: "services",
          content: {
            heading: "Our Services",
            description: "Comprehensive HVAC solutions to keep you comfortable year-round",
            showPricing: true,
            layout: "grid",
          },
        },
        {
          type: "features",
          content: {
            heading: "Why Choose Us",
            items: [
              { title: "Licensed & Insured", description: "Fully licensed, bonded, and insured for your peace of mind.", icon: "🛡️" },
              { title: "24/7 Emergency Service", description: "We're here when you need us most — day or night, weekends and holidays.", icon: "🕐" },
              { title: "Upfront Pricing", description: "No hidden fees or surprises. You'll know the cost before we start.", icon: "💲" },
              { title: "Satisfaction Guaranteed", description: "We stand behind our work with a 100% satisfaction guarantee.", icon: "✅" },
            ],
          },
          settings: { columns: 4 },
        },
        {
          type: "testimonials",
          content: {
            heading: "What Our Customers Say",
            items: [
              { name: "Sarah M.", text: "They fixed our AC in under an hour during a heat wave. Couldn't be happier!", rating: 5 },
              { name: "James R.", text: "Professional, on time, and fair pricing. This is our go-to HVAC company.", rating: 5 },
              { name: "Linda K.", text: "Installed a new furnace quickly and cleanly. Excellent communication throughout.", rating: 5 },
            ],
          },
        },
        {
          type: "cta_banner",
          content: {
            heading: "Ready to Get Comfortable?",
            subheading: "Schedule your service appointment today",
            ctaText: "Book Now",
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
            body: "We've been serving our community for over 20 years, providing top-quality heating, cooling, and indoor air quality services.\n\nOur team of certified technicians is dedicated to delivering exceptional service on every call. We invest in ongoing training to stay current with the latest HVAC technologies and best practices.\n\nAs a locally owned and operated business, we treat every home and business like our own.",
            imagePosition: "right",
          },
        },
        {
          type: "team",
          content: {
            heading: "Meet Our Team",
            description: "Experienced, certified, and dedicated to your comfort",
            members: [
              { name: "John Smith", role: "Owner & Lead Technician", bio: "20+ years of HVAC experience" },
              { name: "Maria Garcia", role: "Office Manager", bio: "Keeping everything running smoothly" },
              { name: "Mike Johnson", role: "Senior Technician", bio: "EPA certified, specializing in heat pumps" },
            ],
          },
          settings: { columns: 3 },
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
            heading: "Our HVAC Services",
            description: "From routine maintenance to emergency repairs, we've got you covered",
            showPricing: true,
            layout: "list",
          },
        },
        {
          type: "faq",
          content: {
            heading: "Frequently Asked Questions",
            items: [
              { question: "How often should I service my HVAC system?", answer: "We recommend annual maintenance — once in spring for AC and once in fall for heating." },
              { question: "Do you offer emergency services?", answer: "Yes! We offer 24/7 emergency HVAC services. Call us anytime for urgent heating or cooling issues." },
              { question: "How long does a typical installation take?", answer: "Most residential HVAC installations are completed within 1-2 days, depending on the complexity." },
              { question: "Do you offer financing?", answer: "Yes, we offer flexible financing options to make your comfort upgrades affordable." },
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
            heading: "Get in Touch",
            description: "Have a question or need service? We'd love to hear from you.",
            showPhone: true,
            showEmail: true,
          },
        },
        {
          type: "map",
          content: {
            heading: "Service Area",
            address: "Serving the greater metro area and surrounding communities",
          },
        },
      ],
    },
  ],
  services: [
    { name: "AC Repair", slug: "ac-repair", shortDescription: "Fast, reliable air conditioning repair", priceDisplay: "Starting at $89", isBookable: true, estimatedDuration: 120, icon: "❄️" },
    { name: "Heating Repair", slug: "heating-repair", shortDescription: "Furnace and heat pump repair services", priceDisplay: "Starting at $89", isBookable: true, estimatedDuration: 120, icon: "🔥" },
    { name: "AC Installation", slug: "ac-installation", shortDescription: "New air conditioning system installation", priceDisplay: "Call for quote", isBookable: true, estimatedDuration: 480, icon: "🏠" },
    { name: "Furnace Installation", slug: "furnace-installation", shortDescription: "High-efficiency furnace installation", priceDisplay: "Call for quote", isBookable: true, estimatedDuration: 480, icon: "🔧" },
    { name: "Maintenance Plan", slug: "maintenance-plan", shortDescription: "Annual HVAC maintenance and tune-ups", priceDisplay: "$149/year", isBookable: true, estimatedDuration: 90, icon: "📋" },
    { name: "Duct Cleaning", slug: "duct-cleaning", shortDescription: "Professional air duct cleaning", priceDisplay: "Starting at $299", isBookable: true, estimatedDuration: 180, icon: "💨" },
    { name: "Indoor Air Quality", slug: "indoor-air-quality", shortDescription: "Air purifiers, humidifiers, and filtration", priceDisplay: "Call for quote", isBookable: true, estimatedDuration: 120, icon: "🌿" },
  ],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Body — Inter Tight (RN requires exact registered font names per weight)
        sans: ["InterTight_400Regular"],
        "sans-medium": ["InterTight_500Medium"],
        "sans-semibold": ["InterTight_600SemiBold"],
        "sans-bold": ["InterTight_700Bold"],
        "sans-extrabold": ["InterTight_800ExtraBold"],
        // Headings — Libre Baskerville
        heading: ["LibreBaskerville_400Regular"],
        "heading-bold": ["LibreBaskerville_700Bold"],
      },
      colors: {
        // Signal design — warm stone + high-visibility orange
        signal: {
          // Accent orange
          accent: "#EA580C",
          "accent-dark": "#FB923C",
          // Backgrounds
          bg: "#FFFBF5",
          "bg-dark": "#1C1917",
          // Cards
          card: "#FFFFFF",
          "card-dark": "#292524",
          // Text
          primary: "#1C1917",
          "primary-dark": "#FAFAF9",
          secondary: "#57534E",
          "secondary-dark": "#A8A29E",
          muted: "#A8A29E",
          "muted-dark": "#78716C",
          // Borders
          border: "#F5F0EB",
          "border-dark": "#44403C",
        },
      },
    },
  },
  plugins: [],
};

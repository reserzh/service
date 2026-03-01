import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
});

const jetbrainsMono = localFont({
  src: "../fonts/JetBrainsMonoVF.woff2",
  variable: "--font-jetbrains-mono",
});

const spaceGrotesk = localFont({
  src: "../fonts/SpaceGroteskVF.woff2",
  variable: "--font-space-grotesk",
});

const dmSans = localFont({
  src: "../fonts/DMSansVF.woff2",
  variable: "--font-dm-sans",
});

const plusJakartaSans = localFont({
  src: "../fonts/PlusJakartaSansVF.woff2",
  variable: "--font-plus-jakarta-sans",
});

const barlow = localFont({
  src: [
    { path: "../fonts/Barlow-400.woff2", weight: "400" },
    { path: "../fonts/Barlow-500.woff2", weight: "500" },
    { path: "../fonts/Barlow-600.woff2", weight: "600" },
    { path: "../fonts/Barlow-700.woff2", weight: "700" },
  ],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: {
    default: "FieldService Pro",
    template: "%s | FieldService Pro",
  },
  description: "Modern field service management for growing service companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${dmSans.variable} ${plusJakartaSans.variable} ${barlow.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

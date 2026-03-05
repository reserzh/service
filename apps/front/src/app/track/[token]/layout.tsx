import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Technician",
  description: "Live technician tracking",
};

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

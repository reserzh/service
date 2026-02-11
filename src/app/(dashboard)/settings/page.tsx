import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  Wrench,
  Bell,
  Link2,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Settings" };

const settingsGroups = [
  {
    title: "Company Profile",
    description: "Business name, address, logo, and license info",
    icon: Building2,
    href: "/settings/company",
  },
  {
    title: "Team Members",
    description: "Invite users, manage roles and permissions",
    icon: Users,
    href: "/settings/team",
  },
  {
    title: "Services & Pricing",
    description: "Configure service types, tax rates, and business hours",
    icon: Wrench,
    href: "/settings/services",
  },
  {
    title: "Notifications",
    description: "Email and SMS notification preferences",
    icon: Bell,
    href: "/settings/notifications",
  },
  {
    title: "Integrations",
    description: "Connect QuickBooks, Stripe, and other services",
    icon: Link2,
    href: "/settings/integrations",
  },
  {
    title: "Billing",
    description: "Subscription plan, payment method, and invoices",
    icon: CreditCard,
    href: "/settings/billing",
  },
];

export default async function SettingsPage() {
  const ctx = await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your company configuration" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsGroups.map((group) => (
          <Link key={group.href} href={group.href}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className="rounded-md bg-muted p-2">
                  <group.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

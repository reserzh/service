import { requireAuth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/services/website";
import { listPages } from "@/lib/services/website";
import { listBookingRequests } from "@/lib/services/bookings";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe, FileText, CalendarCheck, ExternalLink } from "lucide-react";

export default async function WebsiteOverviewPage() {
  const ctx = await requireAuth();
  const [settings, pages, bookings] = await Promise.all([
    getSiteSettings(ctx),
    listPages(ctx),
    listBookingRequests(ctx, { pageSize: 5 }),
  ]);

  const publishedPages = pages.filter((p) => p.status === "published");
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const siteUrl = settings?.subdomainSlug
    ? `${settings.subdomainSlug}.yourplatform.com`
    : null;

  return (
    <>
      <PageHeader
        title="Website"
        description="Manage your public-facing business website"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Site Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Site Status</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {settings?.isPublished ? (
                <Badge variant="default">Published</Badge>
              ) : (
                <Badge variant="secondary">Draft</Badge>
              )}
            </div>
            {siteUrl && (
              <p className="mt-2 text-xs text-muted-foreground">
                {siteUrl}
              </p>
            )}
            {!settings && (
              <div className="mt-3">
                <Link href="/website/theme">
                  <Button size="sm">Set Up Website</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pages Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages.length}</div>
            <p className="text-xs text-muted-foreground">
              {publishedPages.length} published
            </p>
            <div className="mt-3">
              <Link href="/website/pages">
                <Button size="sm" variant="outline">Manage Pages</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              awaiting confirmation
            </p>
            <div className="mt-3">
              <Link href="/website/bookings">
                <Button size="sm" variant="outline">View Bookings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common website management tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/website/pages/new">
            <Button variant="outline">Create New Page</Button>
          </Link>
          <Link href="/website/theme">
            <Button variant="outline">Edit Theme</Button>
          </Link>
          <Link href="/website/services">
            <Button variant="outline">Manage Services</Button>
          </Link>
          {settings?.isPublished && siteUrl && (
            <a href={`https://${siteUrl}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live Site
              </Button>
            </a>
          )}
        </CardContent>
      </Card>
    </>
  );
}

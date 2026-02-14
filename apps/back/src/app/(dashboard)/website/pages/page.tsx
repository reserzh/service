import { requireAuth } from "@/lib/auth";
import { listPages } from "@/lib/services/website";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function PagesListPage() {
  const ctx = await requireAuth();
  const pages = await listPages(ctx);

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Pages" description="Manage your website pages" />
        <Link href="/website/pages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Navigation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No pages yet. Create your first page to get started.
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">
                      {page.title}
                      {page.isHomepage && (
                        <Badge variant="outline" className="ml-2">Homepage</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          page.status === "published"
                            ? "default"
                            : page.status === "archived"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {page.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {page.showInNav ? (
                        <span className="text-sm text-muted-foreground">
                          {page.navLabel || page.title}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Hidden</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/website/pages/${page.id}`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

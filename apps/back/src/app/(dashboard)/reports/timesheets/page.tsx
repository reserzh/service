import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getWeeklyReport } from "@/lib/services/time-tracking";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Timesheets" };

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function TimesheetsPage({ searchParams }: PageProps) {
  const { week } = await searchParams;
  const ctx = await requireAuth();

  // Default to current week Monday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weekStart = week || monday.toISOString().split("T")[0];
  const report = await getWeeklyReport(ctx, weekStart);

  const totalHours = report.reduce((sum, r) => sum + r.netHours, 0);
  const totalCost = report.reduce((sum, r) => sum + r.laborCost, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheets"
        description={`Week of ${new Date(weekStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
        breadcrumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Timesheets" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Technicians</p>
            <p className="text-2xl font-bold">{report.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Labor Cost</p>
            <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technician</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Labor Cost</TableHead>
              <TableHead className="text-right">Entries</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No time entries for this week
                </TableCell>
              </TableRow>
            ) : (
              report.map((r) => (
                <TableRow key={r.userId}>
                  <TableCell className="font-medium">
                    {r.firstName} {r.lastName}
                  </TableCell>
                  <TableCell className="text-right">{r.netHours.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">
                    {r.hourlyRate > 0 ? `$${r.hourlyRate.toFixed(2)}/hr` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {r.laborCost > 0 ? `$${r.laborCost.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">{r.entryCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {report.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-bold">{totalHours.toFixed(1)}h</TableCell>
                <TableCell />
                <TableCell className="text-right font-bold">${totalCost.toFixed(2)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}

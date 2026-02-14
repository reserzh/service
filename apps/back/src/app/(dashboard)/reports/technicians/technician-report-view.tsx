"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface TechnicianData {
  technicians: {
    id: string;
    firstName: string;
    lastName: string;
    color: string | null;
    totalJobs: number;
    completedJobs: number;
    totalRevenue: number;
    avgJobValue: number;
  }[];
}

interface Props {
  data: TechnicianData;
  from: string;
  to: string;
}

export function TechnicianReportView({ data, from, to }: Props) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  function applyFilters() {
    const params = new URLSearchParams();
    params.set("from", fromDate);
    params.set("to", toDate);
    router.push(`/reports/technicians?${params.toString()}`);
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  const totalJobs = data.technicians.reduce((s, t) => s + t.totalJobs, 0);
  const totalCompleted = data.technicians.reduce((s, t) => s + t.completedJobs, 0);
  const totalRevenue = data.technicians.reduce((s, t) => s + t.totalRevenue, 0);
  const techCount = data.technicians.length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
            </div>
            <Button onClick={applyFilters}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Technicians</p>
            <p className="text-2xl font-bold">{techCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Jobs Assigned</p>
            <p className="text-2xl font-bold">{totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-2xl font-bold">
              {totalJobs > 0 ? `${((totalCompleted / totalJobs) * 100).toFixed(1)}%` : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">${fmt(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Technician Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Technician Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {data.technicians.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No active technicians found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="w-[120px]">Completion</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg Job Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.technicians.map((tech) => {
                  const rate = tech.totalJobs > 0 ? (tech.completedJobs / tech.totalJobs) * 100 : 0;
                  return (
                    <TableRow key={tech.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: tech.color || "#6b7280" }}
                          />
                          <span className="font-medium">
                            {tech.firstName} {tech.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{tech.totalJobs}</TableCell>
                      <TableCell className="text-right">{tech.completedJobs}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={rate} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {rate.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">${fmt(tech.totalRevenue)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">${fmt(tech.avgJobValue)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="font-semibold">
                  <TableCell>Total ({techCount} techs)</TableCell>
                  <TableCell className="text-right">{totalJobs}</TableCell>
                  <TableCell className="text-right">{totalCompleted}</TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {totalJobs > 0 ? `${((totalCompleted / totalJobs) * 100).toFixed(1)}%` : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">${fmt(totalRevenue)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${fmt(totalCompleted > 0 ? totalRevenue / totalCompleted : 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

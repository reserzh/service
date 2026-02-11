"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { showToast } from "@/lib/toast";
import { assignJobAction, changeJobStatusAction } from "@/actions/jobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Clock,
  UserPlus,
  ArrowRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const priorityIcons: Record<string, React.ReactNode> = {
  emergency: <AlertTriangle className="h-3 w-3 text-destructive" />,
  high: <AlertTriangle className="h-3 w-3 text-amber-500" />,
};

interface UnassignedJob {
  id: string;
  jobNumber: string;
  summary: string;
  status: string;
  priority: string;
  jobType: string;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  assignedTo: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
}

interface TodayJob {
  id: string;
  jobNumber: string;
  summary: string;
  status: string;
  priority: string;
  jobType: string;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  assignedTo: string | null;
  assignedFirstName: string | null;
  assignedLastName: string | null;
  assignedColor: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
}

interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  color: string;
  phone: string | null;
}

interface Props {
  unassignedJobs: UnassignedJob[];
  technicians: Technician[];
  todaysJobs: TodayJob[];
}

const statusLabels: Record<string, string> = {
  new: "New",
  scheduled: "Scheduled",
  dispatched: "Dispatched",
  in_progress: "In Progress",
  completed: "Completed",
};

export function DispatchBoard({ unassignedJobs, technicians, todaysJobs }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAssign(jobId: string, techId: string) {
    startTransition(async () => {
      const result = await assignJobAction(jobId, techId);
      if (result.error) {
        showToast.error("Failed to assign job", result.error);
      } else {
        showToast.success("Job assigned", "Technician has been assigned to the job.");
        router.refresh();
      }
    });
  }

  function handleDispatch(jobId: string) {
    startTransition(async () => {
      const result = await changeJobStatusAction(jobId, "dispatched");
      if (result.error) {
        showToast.error("Failed to dispatch job", result.error);
      } else {
        showToast.success("Job dispatched", "The technician has been notified.");
        router.refresh();
      }
    });
  }

  // Group today's jobs by technician
  const jobsByTech = new Map<string, TodayJob[]>();
  for (const tech of technicians) {
    jobsByTech.set(tech.id, []);
  }
  for (const job of todaysJobs) {
    if (job.assignedTo && jobsByTech.has(job.assignedTo)) {
      jobsByTech.get(job.assignedTo)!.push(job);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Unassigned queue */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Unassigned Jobs
              <Badge variant="secondary">{unassignedJobs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {unassignedJobs.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  All jobs are assigned. Nice work!
                </p>
              ) : (
                <div className="space-y-2 p-4 pt-0">
                  {unassignedJobs.map((job) => (
                    <Card key={job.id} className="shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {priorityIcons[job.priority]}
                              <span className="text-[10px] text-muted-foreground">
                                {job.jobNumber}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {job.jobType}
                              </Badge>
                            </div>
                            <Link href={`/jobs/${job.id}`}>
                              <p className="text-sm font-medium truncate mt-0.5 hover:underline">
                                {job.summary}
                              </p>
                            </Link>
                            <p className="text-xs text-muted-foreground truncate">
                              {job.customerFirstName} {job.customerLastName}
                            </p>
                            {job.propertyCity && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {job.propertyAddress}, {job.propertyCity}
                                </span>
                              </div>
                            )}
                            {job.scheduledStart && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(job.scheduledStart), "h:mm a")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Assign dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                disabled={isPending}
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {technicians.length === 0 ? (
                                <DropdownMenuItem disabled>
                                  No technicians available
                                </DropdownMenuItem>
                              ) : (
                                technicians.map((tech) => (
                                  <DropdownMenuItem
                                    key={tech.id}
                                    onClick={() => handleAssign(job.id, tech.id)}
                                  >
                                    <Avatar className="h-5 w-5 mr-2">
                                      <AvatarFallback
                                        className="text-[9px] text-white"
                                        style={{ backgroundColor: tech.color }}
                                      >
                                        {tech.firstName[0]}{tech.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    {tech.firstName} {tech.lastName}
                                  </DropdownMenuItem>
                                ))
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Technician lanes */}
      <div className="lg:col-span-8">
        <div className="space-y-4">
          {technicians.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No technicians set up yet. Add team members in Settings and mark them
                  as dispatchable.
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/settings/team">Manage Team</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            technicians.map((tech) => {
              const techJobs = jobsByTech.get(tech.id) || [];

              return (
                <Card key={tech.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback
                          className="text-[10px] text-white"
                          style={{ backgroundColor: tech.color }}
                        >
                          {tech.firstName[0]}{tech.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {tech.firstName} {tech.lastName}
                      <Badge variant="secondary" className="text-[10px]">
                        {techJobs.length} {techJobs.length === 1 ? "job" : "jobs"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {techJobs.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No jobs today</p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {techJobs
                          .sort(
                            (a, b) =>
                              (a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0) -
                              (b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0)
                          )
                          .map((job) => (
                            <Link key={job.id} href={`/jobs/${job.id}`} className="shrink-0">
                              <div className="w-52 rounded-md border p-2.5 hover:shadow transition-shadow">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">
                                    {job.jobNumber}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {statusLabels[job.status] ?? job.status}
                                  </Badge>
                                </div>
                                <p className="text-xs font-medium truncate mt-1">{job.summary}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {job.customerFirstName} {job.customerLastName}
                                </p>
                                {job.scheduledStart && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {format(new Date(job.scheduledStart), "h:mm a")}
                                    {job.scheduledEnd &&
                                      ` – ${format(new Date(job.scheduledEnd), "h:mm a")}`}
                                  </p>
                                )}

                                {job.status === "scheduled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 h-6 text-[10px] w-full"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDispatch(job.id);
                                    }}
                                    disabled={isPending}
                                  >
                                    <ArrowRight className="mr-1 h-3 w-3" />
                                    Dispatch
                                  </Button>
                                )}
                              </div>
                            </Link>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

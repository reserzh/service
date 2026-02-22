"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { showToast } from "@/lib/toast";
import { assignJobAction, changeJobStatusAction } from "@/actions/jobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";

const priorityIcons: Record<string, React.ReactNode> = {
  emergency: <AlertTriangle className="h-3 w-3 text-status-overdue" />,
  high: <AlertTriangle className="h-3 w-3 text-status-in-progress" />,
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
              <span className="flex items-center gap-2">
                Unassigned Jobs
              </span>
              <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {unassignedJobs.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {unassignedJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="rounded-full bg-status-completed/10 p-3 mb-3">
                    <svg className="h-5 w-5 text-status-completed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">All jobs assigned</p>
                  <p className="text-xs text-muted-foreground mt-1">Nice work!</p>
                </div>
              ) : (
                <div className="space-y-2 p-4 pt-0">
                  {unassignedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-lg border bg-card p-3 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {priorityIcons[job.priority]}
                            <span className="text-[10px] text-muted-foreground">
                              {job.jobNumber}
                            </span>
                            <StatusBadge type="job" status={job.status} className="text-[9px] px-1 py-0" />
                          </div>
                          <Link href={`/jobs/${job.id}`}>
                            <p className="text-sm font-medium truncate mt-1 hover:text-primary transition-colors">
                              {job.summary}
                            </p>
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">
                            {job.customerFirstName} {job.customerLastName}
                          </p>
                          {job.propertyCity && (
                            <div className="flex items-center gap-1 mt-1">
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
                              aria-label="Assign technician"
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
                              technicians.map((tech) => {
                                const techJobCount = jobsByTech.get(tech.id)?.length ?? 0;
                                return (
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
                                    <span className="flex-1">{tech.firstName} {tech.lastName}</span>
                                    <span className="text-[10px] text-muted-foreground ml-2">
                                      {techJobCount} jobs
                                    </span>
                                  </DropdownMenuItem>
                                );
                              })
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
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
              const completedCount = techJobs.filter((j) => j.status === "completed").length;
              const completionRate = techJobs.length > 0 ? Math.round((completedCount / techJobs.length) * 100) : 0;

              return (
                <Card key={tech.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback
                            className="text-[10px] text-white"
                            style={{ backgroundColor: tech.color }}
                          >
                            {tech.firstName[0]}{tech.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span>{tech.firstName} {tech.lastName}</span>
                          {tech.phone && (
                            <p className="text-[10px] text-muted-foreground font-normal">{tech.phone}</p>
                          )}
                        </div>
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {completedCount}/{techJobs.length} done
                          </p>
                          <Progress value={completionRate} className="h-1.5 w-16 mt-0.5" />
                        </div>
                      </div>
                    </div>
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
                              <div className="w-56 rounded-lg border p-3 hover:shadow-md transition-all hover:border-primary/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">
                                    {job.jobNumber}
                                  </span>
                                  <StatusBadge type="job" status={job.status} className="text-[9px] px-1 py-0" />
                                </div>
                                <p className="text-xs font-medium truncate mt-1">{job.summary}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {job.customerFirstName} {job.customerLastName}
                                </p>
                                {job.scheduledStart && (
                                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {format(new Date(job.scheduledStart), "h:mm a")}
                                    {job.scheduledEnd &&
                                      ` – ${format(new Date(job.scheduledEnd), "h:mm a")}`}
                                  </p>
                                )}

                                {job.status === "scheduled" && (
                                  <Button
                                    size="sm"
                                    className="mt-2 h-7 text-[11px] w-full"
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

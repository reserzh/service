"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  format,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";

const statusBorderColors: Record<string, string> = {
  new: "border-l-status-new",
  scheduled: "border-l-status-scheduled",
  dispatched: "border-l-status-dispatched",
  en_route: "border-l-status-en-route",
  in_progress: "border-l-status-in-progress",
  completed: "border-l-status-completed",
  canceled: "border-l-status-canceled",
};

interface ScheduleEvent {
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

interface Props {
  events: ScheduleEvent[];
  technicians: { id: string; firstName: string; lastName: string; color: string }[];
  view: string;
  baseDate: string;
  from: string;
  to: string;
}

export function ScheduleView({ events, technicians, view, baseDate, from, to }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const base = new Date(baseDate);
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const days = eachDayOfInterval({ start: fromDate, end: toDate });

  function navigate(direction: "prev" | "next" | "today") {
    const params = new URLSearchParams(searchParams.toString());
    let newDate: Date;

    if (direction === "today") {
      newDate = new Date();
    } else if (view === "day") {
      newDate = direction === "next" ? addDays(base, 1) : subDays(base, 1);
    } else {
      newDate = direction === "next" ? addWeeks(base, 1) : subWeeks(base, 1);
    }

    params.set("date", format(newDate, "yyyy-MM-dd"));
    router.push(`/schedule?${params.toString()}`);
  }

  function setView(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.push(`/schedule?${params.toString()}`);
  }

  function eventsForDay(day: Date) {
    return events.filter(
      (e) => e.scheduledStart && isSameDay(new Date(e.scheduledStart), day)
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate("prev")} aria-label="Previous period">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("today")}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate("next")} aria-label="Next period">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            variant={view === "day" ? "default" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => setView("day")}
          >
            Day
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => setView("week")}
          >
            Week
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      {view === "week" ? (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayEvents = eventsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={day.toISOString()} className="min-h-[200px]">
                <div
                  className={`mb-2 text-center text-xs font-medium ${
                    isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <p className="uppercase tracking-wide text-[10px]">{format(day, "EEE")}</p>
                  <p
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>

                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <Link key={event.id} href={`/jobs/${event.id}`}>
                      <div
                        className={`rounded-md border-l-2 bg-card p-2 text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                          statusBorderColors[event.status] || "border-l-muted"
                        }`}
                      >
                        {event.scheduledStart && (
                          <p className="text-[10px] font-medium text-primary/70">
                            {format(new Date(event.scheduledStart), "h:mm a")}
                          </p>
                        )}
                        <p className="font-medium truncate leading-tight mt-0.5">{event.summary}</p>
                        <p className="text-muted-foreground truncate text-[10px]">
                          {event.customerFirstName} {event.customerLastName?.[0]}.
                        </p>
                        {event.assignedFirstName && (
                          <div className="flex items-center gap-1 mt-1">
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: event.assignedColor ?? "#6b7280" }}
                            />
                            <span className="text-[10px] text-muted-foreground truncate">
                              {event.assignedFirstName} {event.assignedLastName?.[0]}.
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  {dayEvents.length === 0 && (
                    <p className="text-center text-[10px] text-muted-foreground/30 py-6">No jobs</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Day view */
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{format(base, "EEEE, MMMM d, yyyy")}</h3>
          {events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <CalIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No jobs scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">No jobs scheduled for this day.</p>
              </CardContent>
            </Card>
          ) : (
            events
              .sort(
                (a, b) =>
                  (a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0) -
                  (b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0)
              )
              .map((event) => (
                <Link key={event.id} href={`/jobs/${event.id}`}>
                  <Card className={`border-l-4 ${statusBorderColors[event.status] || ""} hover:shadow-md transition-all hover:border-l-primary`}>
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="text-center min-w-[60px]">
                        {event.scheduledStart ? (
                          <>
                            <p className="text-sm font-semibold text-primary">
                              {format(new Date(event.scheduledStart), "h:mm")}
                            </p>
                            <p className="text-[10px] uppercase text-muted-foreground">
                              {format(new Date(event.scheduledStart), "a")}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">No time</p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{event.jobNumber}</span>
                          <StatusBadge type="job" status={event.status} className="text-[10px] px-1.5 py-0" />
                        </div>
                        <p className="font-medium truncate">{event.summary}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {event.customerFirstName} {event.customerLastName}
                          {event.propertyCity && ` — ${event.propertyAddress}, ${event.propertyCity}`}
                        </p>
                      </div>
                      {event.assignedFirstName && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback
                              className="text-[10px] text-white"
                              style={{ backgroundColor: event.assignedColor ?? "#6b7280" }}
                            >
                              {event.assignedFirstName[0]}{event.assignedLastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm hidden sm:inline">
                            {event.assignedFirstName}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))
          )}
        </div>
      )}
    </div>
  );
}

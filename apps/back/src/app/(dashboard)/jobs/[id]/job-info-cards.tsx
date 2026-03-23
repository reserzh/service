"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";
import type { JobData } from "./job-detail-content";

function haversineDistanceFt(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 20902231; // Earth radius in feet
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface JobInfoCardsProps {
  job: JobData;
}

export function JobInfoCards({ job }: JobInfoCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Customer */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-2">Customer</p>
          <Link href={`/customers/${job.customer.id}`} className="font-medium hover:underline text-sm">
            {job.customer.firstName} {job.customer.lastName}
          </Link>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              {job.customer.phone}
            </div>
            {job.customer.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                {job.customer.email}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Property */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-2">Service Location</p>
          <div className="flex items-start gap-1.5 text-sm">
            <MapPin className="mt-0.5 h-3 w-3 text-muted-foreground shrink-0" />
            <div>
              <p>{job.property.addressLine1}</p>
              {job.property.addressLine2 && <p>{job.property.addressLine2}</p>}
              <p className="text-muted-foreground">
                {job.property.city}, {job.property.state} {job.property.zip}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geofence distance warning */}
      {job.startLatitude && job.startLongitude && job.property.latitude && job.property.longitude && (() => {
        const dist = haversineDistanceFt(
          parseFloat(job.startLatitude), parseFloat(job.startLongitude),
          parseFloat(job.property.latitude), parseFloat(job.property.longitude)
        );
        if (dist > 500) {
          const miles = (dist / 5280).toFixed(1);
          return (
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Job started {miles} mi from property
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Technician was more than 500ft from the service location when they started this job.
                </p>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {/* Schedule & Tech */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-2">Schedule & Technician</p>
          {job.scheduledStart ? (
            <div className="flex items-center gap-1.5 text-sm mb-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {format(new Date(job.scheduledStart), "MMM d, yyyy 'at' h:mm a")}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-2">Not scheduled</p>
          )}
          {job.assignedUser ? (
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-5 w-5">
                <AvatarFallback
                  className="text-[9px] text-white"
                  style={{ backgroundColor: job.assignedUser.color }}
                >
                  {job.assignedUser.firstName[0]}{job.assignedUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {job.assignedUser.firstName} {job.assignedUser.lastName}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Unassigned</p>
          )}
        </CardContent>
      </Card>

      {/* Crew */}
      {job.assignments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Crew</p>
            <div className="space-y-2">
              {job.assignments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback
                      className="text-[9px] text-white"
                      style={{ backgroundColor: a.user.color }}
                    >
                      {a.user.firstName[0]}{a.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{a.user.firstName} {a.user.lastName}</span>
                  <Badge variant={a.role === "lead" ? "default" : "secondary"} className="text-[10px] h-4">
                    {a.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

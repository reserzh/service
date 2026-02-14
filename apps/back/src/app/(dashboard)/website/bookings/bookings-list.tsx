"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowRight, Check, X } from "lucide-react";

type Booking = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  preferredDate: string | null;
  preferredTimeSlot: string | null;
  message: string | null;
  convertedJobId: string | null;
  createdAt: string;
  service: { name: string } | null;
};

export function BookingsList({ initialBookings }: { initialBookings: Booking[] }) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings(
          bookings.map((b) =>
            b.id === bookingId ? { ...b, status } : b
          )
        );
        toast.success(`Booking ${status}`);
      }
    } catch {
      toast.error("Failed to update booking");
    }
  };

  const handleConvert = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Booking converted to job");
        router.push(`/jobs/${data.data.jobId}`);
      } else {
        toast.error(data.error?.message || "Failed to convert booking");
      }
    } catch {
      toast.error("Failed to convert booking");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "confirmed":
        return <Badge variant="default">Confirmed</Badge>;
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="mt-6">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Preferred Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No booking requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {booking.firstName} {booking.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.service?.name || "—"}
                    </TableCell>
                    <TableCell>
                      {booking.preferredDate ? (
                        <div>
                          <p className="text-sm">
                            {format(new Date(booking.preferredDate), "MMM d, yyyy")}
                          </p>
                          {booking.preferredTimeSlot && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {booking.preferredTimeSlot}
                            </p>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(booking.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(booking.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {booking.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                            title="Confirm"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateStatus(booking.id, "canceled")}
                            title="Cancel"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                      {booking.status === "confirmed" && !booking.convertedJobId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConvert(booking.id)}
                        >
                          <ArrowRight className="mr-1 h-4 w-4" />
                          Create Job
                        </Button>
                      )}
                      {booking.convertedJobId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/jobs/${booking.convertedJobId}`)}
                        >
                          View Job
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

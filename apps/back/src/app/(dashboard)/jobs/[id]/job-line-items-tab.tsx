"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { AddLineItemForm } from "./add-line-item-form";
import type { JobData } from "./job-detail-content";

interface JobLineItemsTabProps {
  job: JobData;
  onDeleteItem: (id: string) => void;
  isPending: boolean;
}

export function JobLineItemsTab({ job, onDeleteItem, isPending }: JobLineItemsTabProps) {
  return (
    <div className="space-y-4">
      {job.lineItems.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="w-20 text-right">Qty</TableHead>
                <TableHead className="w-28 text-right">Unit Price</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {job.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                  </TableCell>
                  <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                  <TableCell className="text-right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${Number(item.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDeleteItem(item.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  ${job.totalAmount ? Number(job.totalAmount).toFixed(2) : "0.00"}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      <AddLineItemForm jobId={job.id} />
    </div>
  );
}

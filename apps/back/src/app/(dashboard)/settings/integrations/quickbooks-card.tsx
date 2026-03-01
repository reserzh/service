"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Settings, Unplug, RefreshCw } from "lucide-react";
import { disconnectQuickBooksAction } from "@/actions/quickbooks";
import { showToast } from "@/lib/toast";

interface QBStatus {
  connected: boolean;
  companyName?: string | null;
  connectedAt?: Date;
  stats?: {
    total: number;
    success: number;
    failed: number;
    lastSyncAt: Date | null;
  };
}

export function QuickBooksCard({ status }: { status: QBStatus | null }) {
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnected = status?.connected === true;

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const result = await disconnectQuickBooksAction();
      if (result.error) {
        showToast.error("Disconnect failed", result.error);
      } else {
        showToast.success("QuickBooks disconnected");
        window.location.reload();
      }
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">QuickBooks Online</CardTitle>
        {isConnected ? (
          <Badge variant="default" className="bg-green-600">Connected</Badge>
        ) : (
          <Badge variant="secondary">Not Connected</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            {status.companyName && (
              <p className="text-sm text-muted-foreground">
                Connected to <span className="font-medium text-foreground">{status.companyName}</span>
              </p>
            )}

            {status.stats && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold">{status.stats.success}</p>
                  <p className="text-xs text-muted-foreground">Synced</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-destructive">{status.stats.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{status.stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/integrations/quickbooks">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Unplug className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect QuickBooks?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will stop syncing data to QuickBooks Online. Existing data in
                      QuickBooks will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {disconnecting ? "Disconnecting..." : "Disconnect"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Sync customers, invoices, payments, and estimates to QuickBooks Online automatically.
            </p>
            <Button asChild>
              <a href="/api/v1/integrations/quickbooks/connect">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect to QuickBooks
              </a>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

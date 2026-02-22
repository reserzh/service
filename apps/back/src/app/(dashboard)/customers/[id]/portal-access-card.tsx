"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, ShieldOff } from "lucide-react";
import { inviteCustomerAction, revokePortalAccessAction } from "@/actions/customer-portal";
import { showToast } from "@/lib/toast";

interface PortalAccessCardProps {
  customerId: string;
  portalAccessEnabled: boolean;
  invitedAt: string | null;
  lastPortalLoginAt: string | null;
  hasEmail: boolean;
}

export function PortalAccessCard({
  customerId,
  portalAccessEnabled,
  invitedAt,
  lastPortalLoginAt,
  hasEmail,
}: PortalAccessCardProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleInvite() {
    setIsPending(true);
    const result = await inviteCustomerAction(customerId);
    if (result.success) {
      showToast.created("Portal invitation");
      router.refresh();
    } else if (result.error) {
      showToast.error("Error", result.error);
    }
    setIsPending(false);
  }

  async function handleRevoke() {
    setIsPending(true);
    const result = await revokePortalAccessAction(customerId);
    if (result.success) {
      showToast.saved("Portal access revoked");
      router.refresh();
    } else if (result.error) {
      showToast.error("Error", result.error);
    }
    setIsPending(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4" />
          Customer Portal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {portalAccessEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default">Active</Badge>
              {lastPortalLoginAt && (
                <span className="text-xs text-muted-foreground">
                  Last login: {new Date(lastPortalLoginAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {invitedAt && (
              <p className="text-xs text-muted-foreground">
                Invited: {new Date(invitedAt).toLocaleDateString()}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevoke}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
              )}
              Revoke Access
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {hasEmail
                ? "Invite this customer to view jobs, invoices, and estimates online."
                : "An email address is required to invite a customer to the portal."}
            </p>
            <Button
              size="sm"
              onClick={handleInvite}
              disabled={isPending || !hasEmail}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Globe className="mr-1.5 h-3.5 w-3.5" />
              )}
              Invite to Portal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

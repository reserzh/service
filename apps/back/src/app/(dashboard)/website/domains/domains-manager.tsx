"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle, AlertCircle, Globe } from "lucide-react";

type Domain = {
  id: string;
  domain: string;
  status: string;
  verificationToken: string | null;
  verifiedAt: string | null;
  isPrimary: boolean;
};

export function DomainsManager({
  initialDomains,
  subdomainSlug,
}: {
  initialDomains: Domain[];
  subdomainSlug: string | null;
}) {
  const router = useRouter();
  const [domains, setDomains] = useState(initialDomains);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddDomain = async () => {
    if (!newDomain) return;
    setAdding(true);
    try {
      const res = await fetch("/api/v1/website/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to add domain");
      } else {
        toast.success("Domain added");
        setNewDomain("");
        router.refresh();
      }
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (domainId: string) => {
    try {
      const res = await fetch(`/api/v1/website/domains/${domainId}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Verification failed");
      } else {
        toast.success("Domain verified");
        router.refresh();
      }
    } catch {
      toast.error("Verification failed");
    }
  };

  const handleRemove = async (domainId: string) => {
    if (!confirm("Remove this domain?")) return;
    try {
      const res = await fetch(`/api/v1/website/domains/${domainId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDomains(domains.filter((d) => d.id !== domainId));
        toast.success("Domain removed");
      }
    } catch {
      toast.error("Failed to remove domain");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>;
      case "pending_verification":
        return <Badge variant="secondary"><AlertCircle className="mr-1 h-3 w-3" />Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Default Subdomain */}
      {subdomainSlug && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Default Subdomain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Your site is available at:{" "}
              <code className="rounded bg-muted px-2 py-1 text-sm">
                {subdomainSlug}.yourplatform.com
              </code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Domain</CardTitle>
          <CardDescription>
            Connect your own domain to your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="new-domain" className="sr-only">Domain</Label>
              <Input
                id="new-domain"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="yourbusiness.com"
              />
            </div>
            <Button onClick={handleAddDomain} disabled={adding || !newDomain}>
              <Plus className="mr-2 h-4 w-4" />
              {adding ? "Adding..." : "Add Domain"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Domain List */}
      {domains.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      {domain.domain}
                      {domain.isPrimary && (
                        <Badge variant="outline" className="ml-2">Primary</Badge>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(domain.status)}</TableCell>
                    <TableCell>
                      {domain.status === "pending_verification" && domain.verificationToken && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Add CNAME: <code className="rounded bg-muted px-1">sites.yourplatform.com</code>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Add TXT: <code className="rounded bg-muted px-1 break-all">{domain.verificationToken}</code>
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {domain.status === "pending_verification" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(domain.id)}
                          className="mr-2"
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemove(domain.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileText, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { updateQBSettingsAction, fetchQBAccountsAction, bulkSyncAction } from "@/actions/quickbooks";
import { showToast } from "@/lib/toast";

interface QBSettings {
  incomeAccountId?: string;
  expenseAccountId?: string;
  taxStrategy?: "global" | "per_line" | "none";
  syncEstimates?: boolean;
  defaultPaymentMethodId?: string;
}

interface QBAccount {
  Id: string;
  Name: string;
  AccountType: string;
}

interface Props {
  settings: QBSettings;
  stats?: {
    total: number;
    success: number;
    failed: number;
    lastSyncAt: Date | null;
  };
}

export function QuickBooksConfigForm({ settings, stats }: Props) {
  const [saving, setSaving] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [accounts, setAccounts] = useState<QBAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [incomeAccountId, setIncomeAccountId] = useState(settings.incomeAccountId ?? "");
  const [expenseAccountId, setExpenseAccountId] = useState(settings.expenseAccountId ?? "");
  const [taxStrategy, setTaxStrategy] = useState<"global" | "per_line" | "none">(
    settings.taxStrategy ?? "none"
  );
  const [syncEstimates, setSyncEstimates] = useState(settings.syncEstimates ?? true);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoadingAccounts(true);
    try {
      const result = await fetchQBAccountsAction();
      if ("accounts" in result && result.accounts) {
        setAccounts(result.accounts);
      }
    } catch {
      // Accounts are optional — don't block the form
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateQBSettingsAction({
        incomeAccountId: incomeAccountId || undefined,
        expenseAccountId: expenseAccountId || undefined,
        taxStrategy,
        syncEstimates,
      });
      if (result.error) {
        showToast.error("Save failed", result.error);
      } else {
        showToast.saved("QuickBooks settings");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkSync() {
    setBulkSyncing(true);
    try {
      const res = await bulkSyncAction();
      if ("error" in res) {
        showToast.error("Bulk sync failed", res.error);
      } else {
        const r = res.result;
        const parts: string[] = [];
        if (r.customers.synced > 0) parts.push(`${r.customers.synced} customers`);
        if (r.invoices.synced > 0) parts.push(`${r.invoices.synced} invoices`);
        if (r.payments.synced > 0) parts.push(`${r.payments.synced} payments`);
        if (r.pricebookItems.synced > 0) parts.push(`${r.pricebookItems.synced} pricebook items`);

        const totalFailed =
          r.customers.failed + r.invoices.failed + r.payments.failed + r.pricebookItems.failed;

        const message = parts.length > 0 ? `Synced ${parts.join(", ")}` : "No entities to sync";
        if (totalFailed > 0) {
          showToast.error("Bulk sync completed with errors", `${message}. ${totalFailed} failed.`);
        } else {
          showToast.saved(message);
        }
      }
    } finally {
      setBulkSyncing(false);
    }
  }

  const incomeAccounts = accounts.filter((a) => a.AccountType === "Income");
  const expenseAccounts = accounts.filter(
    (a) => a.AccountType === "Expense" || a.AccountType === "Cost of Goods Sold"
  );

  return (
    <div className="space-y-6">
      {/* Account Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Account Mapping</CardTitle>
          <CardDescription>
            Map QuickBooks accounts for synced transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-account">Income Account</Label>
            <Select value={incomeAccountId} onValueChange={setIncomeAccountId}>
              <SelectTrigger id="income-account">
                <SelectValue placeholder={loadingAccounts ? "Loading accounts..." : "Select income account"} />
              </SelectTrigger>
              <SelectContent>
                {incomeAccounts.map((a) => (
                  <SelectItem key={a.Id} value={a.Id}>
                    {a.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-account">Expense Account</Label>
            <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
              <SelectTrigger id="expense-account">
                <SelectValue placeholder={loadingAccounts ? "Loading accounts..." : "Select expense account"} />
              </SelectTrigger>
              <SelectContent>
                {expenseAccounts.map((a) => (
                  <SelectItem key={a.Id} value={a.Id}>
                    {a.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax-strategy">Tax Strategy</Label>
            <Select value={taxStrategy} onValueChange={(v) => setTaxStrategy(v as typeof taxStrategy)}>
              <SelectTrigger id="tax-strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No tax sync</SelectItem>
                <SelectItem value="global">Global tax rate</SelectItem>
                <SelectItem value="per_line">Per line item</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Entity Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>Choose which entities to sync</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Customers</Label>
              <p className="text-sm text-muted-foreground">Always synced when referenced by invoices</p>
            </div>
            <Switch checked disabled />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Invoices & Payments</Label>
              <p className="text-sm text-muted-foreground">Always synced</p>
            </div>
            <Switch checked disabled />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Pricebook Items</Label>
              <p className="text-sm text-muted-foreground">Always synced when referenced by invoices</p>
            </div>
            <Switch checked disabled />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sync-estimates">Estimates</Label>
              <p className="text-sm text-muted-foreground">Sync estimates to QuickBooks</p>
            </div>
            <Switch
              id="sync-estimates"
              checked={syncEstimates}
              onCheckedChange={setSyncEstimates}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sync Overview */}
      {stats && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Sync Overview</CardTitle>
              <CardDescription>
                {stats.lastSyncAt
                  ? `Last synced ${new Date(stats.lastSyncAt).toLocaleString()}`
                  : "No syncs yet"}
              </CardDescription>
            </div>
            {stats.failed > 0 && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/integrations/quickbooks/sync-log?status=error">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {stats.failed} Failed
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-semibold">{stats.success}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-semibold text-destructive">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/settings/integrations/quickbooks/sync-log">
                  <FileText className="mr-2 h-4 w-4" />
                  View Sync Log
                </Link>
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleBulkSync}
                disabled={bulkSyncing}
              >
                {bulkSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {bulkSyncing ? "Syncing..." : "Sync All Existing Data"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

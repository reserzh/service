"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Phone } from "lucide-react";

export default function VoiceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    twilioPhoneNumber: "",
    forwardingNumber: "",
    autoRecord: false,
    greetingMessage: "",
    voicemailEnabled: false,
    transcriptionEnabled: false,
  });

  useEffect(() => {
    fetch("/api/v1/settings/voice")
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then((res) => {
        if (res.data) {
          setSettings((prev) => ({ ...prev, ...res.data }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/settings/voice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        throw new Error("Failed to save settings");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save voice settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Voice Settings"
          breadcrumbs={[
            { label: "Settings", href: "/settings" },
            { label: "Voice" },
          ]}
        />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Settings"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Voice" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            Twilio Voice Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="twilioPhoneNumber">Twilio Phone Number</Label>
            <Input
              id="twilioPhoneNumber"
              value={settings.twilioPhoneNumber}
              onChange={(e) =>
                setSettings((s) => ({ ...s, twilioPhoneNumber: e.target.value }))
              }
              placeholder="+1234567890"
            />
            <p className="text-xs text-muted-foreground">
              Your Twilio phone number for inbound/outbound calls
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forwardingNumber">Forwarding Number</Label>
            <Input
              id="forwardingNumber"
              value={settings.forwardingNumber}
              onChange={(e) =>
                setSettings((s) => ({ ...s, forwardingNumber: e.target.value }))
              }
              placeholder="+1234567890"
            />
            <p className="text-xs text-muted-foreground">
              Office or personal number where inbound calls are forwarded
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoRecord">Auto-Record Calls</Label>
              <p className="text-xs text-muted-foreground">
                Automatically record all calls
              </p>
            </div>
            <Switch
              id="autoRecord"
              checked={settings.autoRecord}
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, autoRecord: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="voicemailEnabled">Voicemail</Label>
              <p className="text-xs text-muted-foreground">
                Enable voicemail when calls are not answered
              </p>
            </div>
            <Switch
              id="voicemailEnabled"
              checked={settings.voicemailEnabled}
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, voicemailEnabled: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="transcriptionEnabled">Transcription</Label>
              <p className="text-xs text-muted-foreground">
                Automatically transcribe recordings
              </p>
            </div>
            <Switch
              id="transcriptionEnabled"
              checked={settings.transcriptionEnabled}
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, transcriptionEnabled: v }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="greetingMessage">Greeting Message</Label>
            <Textarea
              id="greetingMessage"
              value={settings.greetingMessage}
              onChange={(e) =>
                setSettings((s) => ({ ...s, greetingMessage: e.target.value }))
              }
              placeholder="Thank you for calling. Please hold while we connect you."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Message played to callers on inbound calls
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">Saved</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { AutoCommentSettings } from "@/types";
import { Loader2, Save } from "lucide-react";

export default function AutoCommentPage() {
  const [settings, setSettings] = useState<AutoCommentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings/auto-comment");
      setSettings(res.data);
    } catch (err: any) {
      setError("Gagal memuat Auto Comment settings.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put("/settings/auto-comment", settings);
      showSuccess("Auto Comment settings saved!");
    } catch (err: any) {
      setError("Gagal menyimpan settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Auto Comment</h2>
        <p className="text-muted-foreground">Konfigurasi delay dan reaction untuk auto comment</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Auto Comment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Delay Min (detik)</Label>
              <Input
                type="number"
                value={settings?.delay_min ?? 0}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, delay_min: parseInt(e.target.value) || 0 } : prev)}
              />
            </div>
            <div className="space-y-2">
              <Label>Delay Max (detik)</Label>
              <Input
                type="number"
                value={settings?.delay_max ?? 0}
                onChange={(e) => setSettings((prev) => prev ? { ...prev, delay_max: parseInt(e.target.value) || 0 } : prev)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="reaction-toggle">Reaction Enabled</Label>
            <Switch
              id="reaction-toggle"
              checked={settings?.reaction_enabled ?? false}
              onCheckedChange={(checked) => setSettings((prev) => prev ? { ...prev, reaction_enabled: checked } : prev)}
            />
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

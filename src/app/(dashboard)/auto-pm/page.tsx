"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { AutoPMSettings, PMTaskLogItem } from "@/types";
import { Loader2, Save, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AutoPMPage() {
  const [settings, setSettings] = useState<AutoPMSettings | null>(null);
  const [logs, setLogs] = useState<PMTaskLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const limit = 50;

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings/auto-pm");
      setSettings(res.data);
    } catch (err: any) {
      setError("Gagal memuat Auto PM settings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await api.get("/logs/pm-tasks", { params: { page, limit } });
      const resData = response.data;
      if (Array.isArray(resData)) {
        setLogs(resData);
        setTotal(resData.length);
      } else if (resData && Array.isArray(resData.data)) {
        setLogs(resData.data);
        setTotal(resData.total || resData.data.length);
      } else {
        setLogs([]);
        setTotal(0);
      }
    } catch (err: any) {
      // silently fail for logs
    } finally {
      setLogsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put("/settings/auto-pm", settings);
      showSuccess("Auto PM settings saved!");
    } catch (err: any) {
      setError("Gagal menyimpan settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearCompleted = async () => {
    setClearing(true);
    try {
      await api.delete("/logs/pm-tasks/cleared");
      await fetchLogs();
      showSuccess("Completed logs cleared!");
    } catch (err: any) {
      setError("Gagal menghapus logs.");
    } finally {
      setClearing(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "SENT": return <Badge variant="default">Sent</Badge>;
      case "PENDING": return <Badge variant="secondary">Pending</Badge>;
      case "CLEARED": return <Badge variant="outline">Cleared</Badge>;
      case "FAILED": return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Auto PM</h2>
        <p className="text-muted-foreground">Konfigurasi dan log auto PM</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto PM Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pm-enabled">Enabled</Label>
            <Switch
              id="pm-enabled"
              checked={settings?.enabled ?? false}
              onCheckedChange={(checked) => setSettings((prev) => prev ? { ...prev, enabled: checked } : prev)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Akun per Cycle</Label>
              <Input type="number" value={settings?.accounts_per_cycle ?? 0} onChange={(e) => setSettings((prev) => prev ? { ...prev, accounts_per_cycle: parseInt(e.target.value) || 0 } : prev)} />
            </div>
            <div className="space-y-2">
              <Label>Delay Min (jam)</Label>
              <Input type="number" step="0.1" value={settings?.cycle_delay_min_hours ?? 0} onChange={(e) => setSettings((prev) => prev ? { ...prev, cycle_delay_min_hours: parseFloat(e.target.value) || 0 } : prev)} />
            </div>
            <div className="space-y-2">
              <Label>Delay Max (jam)</Label>
              <Input type="number" step="0.1" value={settings?.cycle_delay_max_hours ?? 0} onChange={(e) => setSettings((prev) => prev ? { ...prev, cycle_delay_max_hours: parseFloat(e.target.value) || 0 } : prev)} />
            </div>
            <div className="space-y-2">
              <Label>Clear Chat Hours</Label>
              <Input type="number" step="0.1" value={settings?.clear_chat_hours ?? 0} onChange={(e) => setSettings((prev) => prev ? { ...prev, clear_chat_hours: parseFloat(e.target.value) || 0 } : prev)} />
            </div>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* PM Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>PM Logs ({total})</CardTitle>
          <Button variant="destructive" size="sm" onClick={handleClearCompleted} disabled={clearing}>
            {clearing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
            Clear Completed
          </Button>
        </CardHeader>
        <CardContent>
          {logsLoading ? <Loading /> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">User ID</th>
                      <th className="px-3 py-2 text-left font-medium">Target</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">PM Sent</th>
                      <th className="px-3 py-2 text-left font-medium">Clear At</th>
                      <th className="px-3 py-2 text-center font-medium">Cleared</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="px-3 py-2 font-mono text-xs">{log.user_id}</td>
                        <td className="px-3 py-2 font-mono text-xs">{log.target_chat_id}</td>
                        <td className="px-3 py-2">{getStatusBadge(log.status)}</td>
                        <td className="px-3 py-2 text-xs">{log.pm_sent_at ? new Date(log.pm_sent_at).toLocaleString("id-ID") : "-"}</td>
                        <td className="px-3 py-2 text-xs">{log.clear_chat_at ? new Date(log.clear_chat_at).toLocaleString("id-ID") : "-"}</td>
                        <td className="px-3 py-2 text-center">{log.is_cleared ? "✅" : "❌"}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Tidak ada log.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

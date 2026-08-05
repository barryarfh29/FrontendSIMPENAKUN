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
import { Loader2, Save, Trash2, ChevronLeft, ChevronRight, Plus, Play, Square, Link2, Pencil } from "lucide-react";

export default function AutoPMPage() {
  const [settings, setSettings] = useState<AutoPMSettings | null>(null);
  const [logs, setLogs] = useState<PMTaskLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // PM Channels
  const [pmChannels, setPmChannels] = useState<(string | number)[]>([]);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [newPmChannel, setNewPmChannel] = useState("");
  const [savingChannels, setSavingChannels] = useState(false);

  // Edit invite link
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [editLinkValue, setEditLinkValue] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  // Run Now
  const [runMaxAccounts, setRunMaxAccounts] = useState(5);
  const [runDelayMin, setRunDelayMin] = useState(30);
  const [runDelayMax, setRunDelayMax] = useState(90);
  const [runClearHours, setRunClearHours] = useState(24);
  const [running, setRunning] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const limit = 50;

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 5000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("simpenakun_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchAll = async () => {
    try {
      const [settingsRes, channelsRes] = await Promise.all([
        api.get("/settings/auto-pm"),
        api.get("/settings/pm-channels").catch(() => ({ data: { channels: [], invite_links: {} } })),
      ]);
      setSettings(settingsRes.data);
      setPmChannels(channelsRes.data?.channels || []);
      setInviteLinks(channelsRes.data?.invite_links || {});
    } catch (err: any) {
      setError("Gagal memuat settings.");
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
      // silent
    } finally {
      setLogsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      await api.put("/settings/auto-pm", settings);
      showSuccess("Auto PM settings saved!");
    } catch (err: any) {
      setError("Gagal menyimpan settings.");
    } finally {
      setSaving(false);
    }
  };

  // PM Channels
  const savePmChannels = async () => {
    setSavingChannels(true);
    setError("");
    try {
      await api.put("/settings/pm-channels", { channels: pmChannels });
      showSuccess("PM channels saved!");
    } catch (err: any) {
      setError("Gagal menyimpan PM channels.");
    } finally {
      setSavingChannels(false);
    }
  };

  const addPmChannel = () => {
    const val = newPmChannel.trim();
    if (!val) return;
    const numVal = Number(val);
    setPmChannels((prev) => [...prev, isNaN(numVal) ? val : numVal]);
    setNewPmChannel("");
  };

  const removePmChannel = (index: number) => {
    const removed = pmChannels[index];
    setPmChannels((prev) => prev.filter((_, i) => i !== index));
    // Also remove invite link
    const key = String(removed);
    if (inviteLinks[key]) {
      const updated = { ...inviteLinks };
      delete updated[key];
      setInviteLinks(updated);
    }
  };

  // Invite Link
  const startEditLink = (channelId: string | number) => {
    const key = String(channelId);
    setEditingChannel(key);
    setEditLinkValue(inviteLinks[key] || "");
  };

  const saveInviteLink = async () => {
    if (!editingChannel) return;
    setSavingLink(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.simpenakun.site/api/settings/pm-channels/invite-link?channel_id=${editingChannel}&invite_link=${encodeURIComponent(editLinkValue)}`,
        { method: "PUT", headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setInviteLinks((prev) => ({ ...prev, [editingChannel!]: editLinkValue }));
      setEditingChannel(null);
      showSuccess("Invite link saved!");
    } catch (err: any) {
      setError("Gagal menyimpan invite link.");
    } finally {
      setSavingLink(false);
    }
  };

  // Run Now
  const handleRunNow = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("https://api.simpenakun.site/api/actions/trigger-pm", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          channel_id: 0,
          max_accounts: runMaxAccounts,
          clear_hours: runClearHours,
          delay_min: runDelayMin,
          delay_max: runDelayMax,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message || "PM trigger selesai!");
        await fetchLogs();
      } else {
        setError(data.message || "Trigger PM gagal.");
      }
    } catch (err: any) {
      setError("Gagal trigger PM.");
    } finally {
      setRunning(false);
    }
  };

  const handleStopPm = async () => {
    try {
      await fetch("https://api.simpenakun.site/api/actions/stop/pm", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      showSuccess("Stop signal sent. Menunggu proses berhenti...");
    } catch {
      setError("Gagal mengirim stop signal.");
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
        <p className="text-muted-foreground">Konfigurasi, trigger manual, dan log PM</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      {/* PM Channels */}
      <Card>
        <CardHeader>
          <CardTitle>PM Channels ({pmChannels.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Channel untuk scan target CS. Channel private HARUS punya invite link agar scanner bisa join dan baca post.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Channel ID (contoh: -100347158631)"
              value={newPmChannel}
              onChange={(e) => setNewPmChannel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPmChannel()}
            />
            <Button onClick={addPmChannel} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Channel list with invite links */}
          {pmChannels.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Channel ID</th>
                    <th className="px-3 py-2 text-left font-medium">Invite Link</th>
                    <th className="px-3 py-2 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pmChannels.map((id, index) => {
                    const key = String(id);
                    const link = inviteLinks[key];
                    const isEditing = editingChannel === key;
                    return (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2 font-mono text-xs">{id}</td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input
                                className="h-8 text-xs"
                                placeholder="https://t.me/+abcdef123"
                                value={editLinkValue}
                                onChange={(e) => setEditLinkValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveInviteLink()}
                              />
                              <Button size="sm" onClick={saveInviteLink} disabled={savingLink}>
                                {savingLink ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingChannel(null)}>
                                ✕
                              </Button>
                            </div>
                          ) : link ? (
                            <span className="text-xs text-muted-foreground font-mono">{link}</span>
                          ) : (
                            <span className="text-xs text-orange-500">⚠️ Tidak ada invite link</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isEditing && (
                              <Button size="sm" variant="ghost" onClick={() => startEditLink(id)}>
                                {link ? <Pencil className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => removePmChannel(index)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada channel.</p>
          )}

          <Button onClick={savePmChannels} disabled={savingChannels} size="sm">
            {savingChannels ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Channels
          </Button>
        </CardContent>
      </Card>

      {/* Run Now */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger PM Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Max Accounts</Label>
              <Input type="number" min={1} value={runMaxAccounts} onChange={(e) => setRunMaxAccounts(parseInt(e.target.value) || 5)} disabled={running} />
            </div>
            <div className="space-y-2">
              <Label>Clear Hours</Label>
              <Input type="number" min={1} value={runClearHours} onChange={(e) => setRunClearHours(parseInt(e.target.value) || 24)} disabled={running} />
            </div>
            <div className="space-y-2">
              <Label>Delay Min (detik)</Label>
              <Input type="number" min={5} value={runDelayMin} onChange={(e) => setRunDelayMin(parseInt(e.target.value) || 30)} disabled={running} />
            </div>
            <div className="space-y-2">
              <Label>Delay Max (detik)</Label>
              <Input type="number" min={5} value={runDelayMax} onChange={(e) => setRunDelayMax(parseInt(e.target.value) || 90)} disabled={running} />
            </div>
          </div>
          {!running ? (
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleRunNow}>
              <Play className="mr-2 h-4 w-4" />
              Run Now
            </Button>
          ) : (
            <Button variant="destructive" className="w-full" onClick={handleStopPm}>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}
          {running && (
            <p className="text-xs text-muted-foreground text-center">Proses berjalan, jangan tutup halaman...</p>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto PM Settings (Scheduler)</CardTitle>
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

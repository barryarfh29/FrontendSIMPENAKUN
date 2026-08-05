"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import { Loader2, Save, Plus, Trash2, Send, Square, Zap, Play } from "lucide-react";

interface ReactChannelProgress {
  status: "RUNNING" | "DONE" | "STOPPED" | "NONE";
  total: number;
  completed: number;
  remaining: number;
  started_at: string | null;
}

export default function AutoReactionPage() {
  const [channels, setChannels] = useState<(string | number)[]>([]);
  const [newChannel, setNewChannel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Trigger reaction (by link)
  const [reactionLink, setReactionLink] = useState("");
  const [reactionDelay, setReactionDelay] = useState(5);
  const [sendingReaction, setSendingReaction] = useState(false);

  // React channels
  const [reactLimit, setReactLimit] = useState(5);
  const [reactDelay, setReactDelay] = useState(5);
  const [reactingChannel, setReactingChannel] = useState<string | number | null>(null);

  // Progress
  const [progress, setProgress] = useState<ReactChannelProgress | null>(null);

  // Account count
  const [accountCount, setAccountCount] = useState(0);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("simpenakun_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // Poll progress
  useEffect(() => {
    const pollProgress = async () => {
      try {
        const res = await api.get("/actions/reaction-channel/progress");
        setProgress(res.data);
        const isRunning = res.data?.status === "RUNNING";
        setSendingReaction(isRunning);
      } catch {
        // fallback to status endpoint
        try {
          const res = await api.get("/actions/status");
          setSendingReaction(res.data?.running?.reaction || false);
        } catch { /* silent */ }
      }
    };
    pollProgress();
    const interval = setInterval(pollProgress, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAll();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 5000);
  };

  const fetchAll = async () => {
    try {
      const [channelsRes, accountsRes] = await Promise.all([
        api.get("/settings/reaction-channels"),
        api.get("/accounts/").catch(() => ({ data: [] })),
      ]);
      setChannels(channelsRes.data?.channels || []);
      const aData = accountsRes.data;
      const accts = Array.isArray(aData) ? aData : aData?.data || aData?.accounts || [];
      setAccountCount(accts.length);
    } catch (err: any) {
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const saveChannels = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put("/settings/reaction-channels", { channels });
      showSuccess("Reaction channels saved!");
    } catch (err: any) {
      setError("Gagal menyimpan channels.");
    } finally {
      setSaving(false);
    }
  };

  const addChannel = () => {
    const val = newChannel.trim();
    if (!val) return;
    const numVal = Number(val);
    setChannels((prev) => [...prev, isNaN(numVal) ? val : numVal]);
    setNewChannel("");
  };

  const removeChannel = (index: number) => {
    setChannels((prev) => prev.filter((_, i) => i !== index));
  };

  // React by link
  const handleSendReaction = async () => {
    if (!reactionLink.trim()) { setError("Link post harus diisi."); return; }
    setSendingReaction(true);
    setError("");
    try {
      const res = await fetch("https://api.simpenakun.site/api/actions/reaction", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ post_link: reactionLink.trim(), delay: reactionDelay }),
      });
      const data = await res.json();
      if (data.success) showSuccess(data.message || "Reaction selesai!");
      else setError(data.message || "Reaction gagal.");
    } catch { setError("Gagal mengirim reaction."); }
    finally { setSendingReaction(false); }
  };

  // React channel (new task)
  const handleReactChannel = async (channelId: number | string | 0) => {
    if (channelId !== 0) setReactingChannel(channelId);
    setSendingReaction(true);
    setError("");
    try {
      const res = await fetch("https://api.simpenakun.site/api/actions/reaction-channel", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          channel_id: Number(channelId) || 0,
          limit: reactLimit,
          delay: reactDelay,
        }),
      });
      const data = await res.json();
      if (data.success) showSuccess(data.message || "Reaction channel started!");
      else setError(data.message || "Reaction channel gagal.");
    } catch { setError("Gagal mengirim reaction channel."); }
    finally { setReactingChannel(null); }
  };

  // Resume
  const handleResume = async () => {
    setSendingReaction(true);
    setError("");
    try {
      const res = await fetch("https://api.simpenakun.site/api/actions/reaction-channel", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ resume: true }),
      });
      const data = await res.json();
      if (data.success) showSuccess(data.message || "Resumed!");
      else setError(data.message || "Resume gagal.");
    } catch { setError("Gagal resume."); }
  };

  // Stop
  const handleStopReaction = async () => {
    try {
      await fetch("https://api.simpenakun.site/api/actions/stop/reaction", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      showSuccess("Stop signal sent.");
    } catch { setError("Gagal mengirim stop signal."); }
  };

  const reactionEstimate = Math.ceil((accountCount * reactionDelay) / 60);
  const reactAllEstimate = Math.ceil((channels.length * reactLimit * accountCount * reactDelay) / 60);

  const progressPercent = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const showResume = progress && (progress.status === "STOPPED" || (progress.status === "RUNNING" && progress.remaining > 0));
  const isRunning = progress?.status === "RUNNING";

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Auto Reaction</h2>
        <p className="text-muted-foreground">Kelola channel dan trigger reaction</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      {/* Progress Bar */}
      {progress && progress.status !== "NONE" && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {progress.status === "RUNNING" && "⚡ Reaction sedang berjalan"}
                {progress.status === "STOPPED" && "⏸️ Reaction dihentikan"}
                {progress.status === "DONE" && "✅ Reaction selesai"}
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.completed}/{progress.total} posts ({progress.remaining} remaining)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress.status === "RUNNING" ? "bg-primary" :
                  progress.status === "DONE" ? "bg-green-500" : "bg-orange-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex gap-2">
              {isRunning && (
                <Button variant="destructive" size="sm" onClick={handleStopReaction}>
                  <Square className="mr-1 h-3 w-3" /> Stop
                </Button>
              )}
              {progress.status === "STOPPED" && progress.remaining > 0 && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleResume}>
                  <Play className="mr-1 h-3 w-3" /> Resume ({progress.remaining} remaining)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trigger Reaction by Link */}
      <Card>
        <CardHeader>
          <CardTitle>Kirim Reaction (by Link)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Link Post</Label>
            <Input
              placeholder="https://t.me/channel/123"
              value={reactionLink}
              onChange={(e) => setReactionLink(e.target.value)}
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label>Delay antar akun (detik)</Label>
            <Input
              type="number" min={1} max={60}
              value={reactionDelay}
              onChange={(e) => setReactionDelay(Math.max(1, parseInt(e.target.value) || 5))}
              disabled={isRunning}
            />
          </div>
          {accountCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Estimasi: ~{reactionEstimate} menit ({accountCount} akun × {reactionDelay}s)
            </p>
          )}
          {!isRunning && (
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleSendReaction}>
              <Send className="mr-2 h-4 w-4" /> Kirim Reaction
            </Button>
          )}
        </CardContent>
      </Card>

      {/* React Channels */}
      <Card>
        <CardHeader>
          <CardTitle>React Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            React ke post terakhir dari channel yang terdaftar.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Jumlah post terakhir (limit)</Label>
              <Input
                type="number" min={1} max={999}
                value={reactLimit}
                onChange={(e) => setReactLimit(Math.max(1, parseInt(e.target.value) || 5))}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label>Delay antar akun (detik)</Label>
              <Input
                type="number" min={1} max={60}
                value={reactDelay}
                onChange={(e) => setReactDelay(Math.max(1, parseInt(e.target.value) || 5))}
                disabled={isRunning}
              />
            </div>
          </div>
          {accountCount > 0 && channels.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Estimasi (all): ~{reactAllEstimate} menit ({channels.length} ch × {reactLimit} post × {accountCount} akun × {reactDelay}s)
            </p>
          )}
          {!isRunning && (
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => handleReactChannel(0)}
            >
              <Zap className="mr-2 h-4 w-4" /> React All Channels ({channels.length})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Reaction Channels List */}
      <Card>
        <CardHeader>
          <CardTitle>Reaction Channels ({channels.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Channel ID (contoh: -100347158631)"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addChannel()}
            />
            <Button onClick={addChannel} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {channels.map((id, index) => (
              <div key={index} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="font-mono text-sm">{id}</span>
                <div className="flex items-center gap-1">
                  {!isRunning && (
                    <Button
                      size="sm" variant="outline"
                      onClick={() => handleReactChannel(id)}
                      disabled={reactingChannel === id}
                    >
                      {reactingChannel === id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => removeChannel(index)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {channels.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada channel.</p>
            )}
          </div>

          <Button onClick={saveChannels} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Channels
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

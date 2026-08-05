"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [sendingLink, setSendingLink] = useState(false);

  // React channels
  const [reactLimit, setReactLimit] = useState(5);
  const [reactDelay, setReactDelay] = useState(5);
  const [reactingChannel, setReactingChannel] = useState<string | number | null>(null);

  // Progress
  const [progress, setProgress] = useState<ReactChannelProgress | null>(null);
  const [stopping, setStopping] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Account count
  const [accountCount, setAccountCount] = useState(0);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("simpenakun_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 5000);
  };

  // Polling
  const pollProgress = useCallback(async () => {
    try {
      const res = await api.get("/actions/reaction-channel/progress");
      setProgress(res.data);
      if (res.data?.status === "DONE" || res.data?.status === "NONE") {
        setStopping(false);
      }
      if (res.data?.status === "STOPPED") {
        setStopping(false);
      }
    } catch {
      // fallback
      try {
        const res = await api.get("/actions/status");
        if (!res.data?.running?.reaction) {
          setProgress((prev) => prev && prev.status === "RUNNING" ? { ...prev, status: "STOPPED" } : prev);
        }
      } catch { /* silent */ }
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(pollProgress, 3000);
  }, [pollProgress]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAll();
    pollProgress();
    startPolling();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Save channels
  const saveChannels = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put("/settings/reaction-channels", { channels });
      showSuccess("Reaction channels saved!");
    } catch { setError("Gagal menyimpan channels."); }
    finally { setSaving(false); }
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
    setSendingLink(true);
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
    finally { setSendingLink(false); }
  };

  // React channel (new task)
  const handleReactChannel = async (channelId: number | string | 0) => {
    // Immediately update UI
    setProgress({ status: "RUNNING", total: 0, completed: 0, remaining: 0, started_at: new Date().toISOString() });
    if (channelId !== 0) setReactingChannel(channelId);
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
      if (res.status === 400) {
        showSuccess(data.message || "Task sudah berjalan.");
      } else if (data.success) {
        showSuccess(data.message || "Reaction channel started!");
      } else {
        setError(data.message || "Reaction channel gagal.");
        setProgress(null);
      }
    } catch {
      setError("Gagal mengirim reaction channel.");
      setProgress(null);
    } finally {
      setReactingChannel(null);
    }
  };

  // Resume
  const handleResume = async () => {
    setProgress((prev) => prev ? { ...prev, status: "RUNNING" } : prev);
    setError("");
    try {
      const res = await fetch("https://api.simpenakun.site/api/actions/reaction-channel", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ resume: true }),
      });
      const data = await res.json();
      if (res.status === 400) {
        showSuccess(data.message || "Task sudah berjalan.");
      } else if (data.success) {
        showSuccess(data.message || "Resumed!");
      } else {
        setError(data.message || "Resume gagal.");
        await pollProgress();
      }
    } catch {
      setError("Gagal resume.");
      await pollProgress();
    }
  };

  // Stop
  const handleStopReaction = async () => {
    setStopping(true);
    try {
      await fetch("https://api.simpenakun.site/api/actions/stop/reaction", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      showSuccess("Stop signal sent. Menunggu proses berhenti...");
    } catch {
      setError("Gagal mengirim stop signal.");
      setStopping(false);
    }
  };

  // Reset task
  const [confirmReset, setConfirmReset] = useState(false);
  const handleResetTask = async () => {
    setError("");
    try {
      const res = await fetch("https://api.simpenakun.site/api/actions/reaction-channel/task", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setProgress(null);
        setConfirmReset(false);
        showSuccess(data.message || "Task cleared. Bisa mulai baru.");
      } else {
        setError(data.message || "Gagal reset task.");
      }
    } catch {
      setError("Gagal reset task.");
    }
  };

  // Derived state
  const isRunning = progress?.status === "RUNNING";
  const isStopped = progress?.status === "STOPPED";
  const isDone = progress?.status === "DONE";
  const hasProgress = progress && progress.status !== "NONE";
  const progressPercent = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const reactionEstimate = Math.ceil((accountCount * reactionDelay) / 60);
  const reactAllEstimate = Math.ceil((channels.length * reactLimit * accountCount * reactDelay) / 60);

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
      {hasProgress && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isRunning && (stopping ? "⏳ Menghentikan..." : "⚡ Reaction sedang berjalan")}
                {isStopped && "⏸️ Reaction dihentikan"}
                {isDone && "✅ Reaction selesai"}
              </span>
              <span className="text-sm text-muted-foreground">
                {progress!.completed}/{progress!.total} posts ({progress!.remaining} remaining)
              </span>
            </div>
            {/* Bar */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isRunning ? "bg-primary animate-pulse" :
                  isDone ? "bg-green-500" : "bg-orange-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progressPercent}% complete</p>
            {/* Actions */}
            <div className="flex gap-2">
              {isRunning && !stopping && (
                <Button variant="destructive" size="sm" onClick={handleStopReaction}>
                  <Square className="mr-1 h-3 w-3" /> Stop
                </Button>
              )}
              {isRunning && stopping && (
                <Button variant="outline" size="sm" disabled>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Menghentikan...
                </Button>
              )}
              {isStopped && progress!.remaining > 0 && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleResume}>
                  <Play className="mr-1 h-3 w-3" /> Resume ({progress!.remaining} remaining)
                </Button>
              )}
              {isStopped && !confirmReset && (
                <Button size="sm" variant="outline" onClick={() => setConfirmReset(true)}>
                  Mulai Baru
                </Button>
              )}
              {isStopped && confirmReset && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive">Hapus task lama?</span>
                  <Button size="sm" variant="destructive" onClick={handleResetTask}>Ya</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>Batal</Button>
                </div>
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
              disabled={isRunning || sendingLink}
            />
          </div>
          <div className="space-y-2">
            <Label>Delay antar akun (detik)</Label>
            <Input
              type="number" min={1} max={60}
              value={reactionDelay}
              onChange={(e) => setReactionDelay(Math.max(1, parseInt(e.target.value) || 5))}
              disabled={isRunning || sendingLink}
            />
          </div>
          {accountCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Estimasi: ~{reactionEstimate} menit ({accountCount} akun × {reactionDelay}s)
            </p>
          )}
          {!isRunning && (
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleSendReaction} disabled={sendingLink}>
              {sendingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {sendingLink ? "Mengirim..." : "Kirim Reaction"}
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
              <Label>Jumlah post (limit)</Label>
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

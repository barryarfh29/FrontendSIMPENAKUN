"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { AutoPMSettings, AutoCommentSettings, ReactionChannels } from "@/types";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [pmSettings, setPmSettings] = useState<AutoPMSettings | null>(null);
  const [commentSettings, setCommentSettings] = useState<AutoCommentSettings | null>(null);
  const [reactionChannels, setReactionChannels] = useState<ReactionChannels | null>(null);
  const [newChannel, setNewChannel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      const [pmRes, commentRes, channelsRes] = await Promise.all([
        api.get("/settings/auto-pm"),
        api.get("/settings/auto-comment"),
        api.get("/settings/reaction-channels"),
      ]);
      setPmSettings(pmRes.data);
      setCommentSettings(commentRes.data);
      setReactionChannels(channelsRes.data);
    } catch (err: any) {
      setError("Gagal memuat pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const savePmSettings = async () => {
    if (!pmSettings) return;
    setSaving("pm");
    try {
      await api.put("/settings/auto-pm", pmSettings);
      showSuccess("Auto PM settings saved!");
    } catch (err: any) {
      setError("Gagal menyimpan Auto PM settings.");
    } finally {
      setSaving(null);
    }
  };

  const saveCommentSettings = async () => {
    if (!commentSettings) return;
    setSaving("comment");
    try {
      await api.put("/settings/auto-comment", commentSettings);
      showSuccess("Auto Comment settings saved!");
    } catch (err: any) {
      setError("Gagal menyimpan Auto Comment settings.");
    } finally {
      setSaving(null);
    }
  };

  const saveReactionChannels = async () => {
    if (!reactionChannels) return;
    setSaving("channels");
    try {
      await api.put("/settings/reaction-channels", reactionChannels);
      showSuccess("Reaction channels saved!");
    } catch (err: any) {
      setError("Gagal menyimpan reaction channels.");
    } finally {
      setSaving(null);
    }
  };

  const addChannel = () => {
    if (!newChannel.trim() || !reactionChannels) return;
    setReactionChannels({
      channels: [...(reactionChannels.channels || []), newChannel.trim()],
    });
    setNewChannel("");
  };

  const removeChannel = (index: number) => {
    if (!reactionChannels) return;
    setReactionChannels({
      channels: (reactionChannels.channels || []).filter((_, i) => i !== index),
    });
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Konfigurasi bot SimpenAkun</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      {/* Auto PM Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto PM Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pm-enabled">Enabled</Label>
            <Switch
              id="pm-enabled"
              checked={pmSettings?.enabled ?? false}
              onCheckedChange={(checked) =>
                setPmSettings((prev) => prev ? { ...prev, enabled: checked } : prev)
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accounts-per-cycle">Akun per Cycle</Label>
              <Input
                id="accounts-per-cycle"
                type="number"
                value={pmSettings?.accounts_per_cycle ?? 0}
                onChange={(e) =>
                  setPmSettings((prev) =>
                    prev ? { ...prev, accounts_per_cycle: parseInt(e.target.value) || 0 } : prev
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delay-min">Delay Min (jam)</Label>
              <Input
                id="delay-min"
                type="number"
                step="0.1"
                value={pmSettings?.cycle_delay_min_hours ?? 0}
                onChange={(e) =>
                  setPmSettings((prev) =>
                    prev ? { ...prev, cycle_delay_min_hours: parseFloat(e.target.value) || 0 } : prev
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delay-max">Delay Max (jam)</Label>
              <Input
                id="delay-max"
                type="number"
                step="0.1"
                value={pmSettings?.cycle_delay_max_hours ?? 0}
                onChange={(e) =>
                  setPmSettings((prev) =>
                    prev ? { ...prev, cycle_delay_max_hours: parseFloat(e.target.value) || 0 } : prev
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clear-hours">Clear Chat Hours</Label>
              <Input
                id="clear-hours"
                type="number"
                step="0.1"
                value={pmSettings?.clear_chat_hours ?? 0}
                onChange={(e) =>
                  setPmSettings((prev) =>
                    prev ? { ...prev, clear_chat_hours: parseFloat(e.target.value) || 0 } : prev
                  )
                }
              />
            </div>
          </div>
          <Button onClick={savePmSettings} disabled={saving === "pm"}>
            {saving === "pm" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Auto PM
          </Button>
        </CardContent>
      </Card>

      {/* Auto Comment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto Comment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="comment-delay-min">Delay Min (detik)</Label>
              <Input
                id="comment-delay-min"
                type="number"
                value={commentSettings?.delay_min ?? 0}
                onChange={(e) =>
                  setCommentSettings((prev) =>
                    prev ? { ...prev, delay_min: parseInt(e.target.value) || 0 } : prev
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment-delay-max">Delay Max (detik)</Label>
              <Input
                id="comment-delay-max"
                type="number"
                value={commentSettings?.delay_max ?? 0}
                onChange={(e) =>
                  setCommentSettings((prev) =>
                    prev ? { ...prev, delay_max: parseInt(e.target.value) || 0 } : prev
                  )
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="reaction-enabled">Reaction Enabled</Label>
            <Switch
              id="reaction-enabled"
              checked={commentSettings?.reaction_enabled ?? false}
              onCheckedChange={(checked) =>
                setCommentSettings((prev) =>
                  prev ? { ...prev, reaction_enabled: checked } : prev
                )
              }
            />
          </div>
          <Button onClick={saveCommentSettings} disabled={saving === "comment"}>
            {saving === "comment" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Auto Comment
          </Button>
        </CardContent>
      </Card>

      {/* Reaction Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Reaction Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Channel ID"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addChannel()}
            />
            <Button onClick={addChannel} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {(reactionChannels?.channels || []).map((id, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="font-mono text-sm">{id}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeChannel(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {(!reactionChannels?.channels || reactionChannels.channels.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Belum ada channel yang ditambahkan.
              </p>
            )}
          </div>

          <Button onClick={saveReactionChannels} disabled={saving === "channels"}>
            {saving === "channels" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Channels
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

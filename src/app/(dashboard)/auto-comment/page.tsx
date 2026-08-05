"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { AutoCommentSettings, TemplateItem } from "@/types";
import { Loader2, Save, Send, Square } from "lucide-react";

export default function AutoCommentPage() {
  const [settings, setSettings] = useState<AutoCommentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Templates for dropdown
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  // Trigger comment form
  const [postLink, setPostLink] = useState("");
  const [templateIndex, setTemplateIndex] = useState(-1);
  const [useCustomText, setUseCustomText] = useState(false);
  const [customText, setCustomText] = useState("");
  const [commentDelay, setCommentDelay] = useState(90);
  const [commentReaction, setCommentReaction] = useState(true);
  const [sending, setSending] = useState(false);

  // Account count for estimation
  const [accountCount, setAccountCount] = useState(0);

  useEffect(() => {
    fetchAll();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 5000);
  };

  const fetchAll = async () => {
    try {
      const [settingsRes, templatesRes, accountsRes] = await Promise.all([
        api.get("/settings/auto-comment"),
        api.get("/templates/comments").catch(() => ({ data: [] })),
        api.get("/accounts/").catch(() => ({ data: [] })),
      ]);
      setSettings(settingsRes.data);
      const tData = templatesRes.data;
      setTemplates(Array.isArray(tData) ? tData : tData?.data || []);
      const aData = accountsRes.data;
      const accts = Array.isArray(aData) ? aData : aData?.data || aData?.accounts || [];
      setAccountCount(accts.length);
    } catch (err: any) {
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      await api.put("/settings/auto-comment", settings);
      showSuccess("Auto Comment settings saved!");
    } catch (err: any) {
      setError("Gagal menyimpan settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendComment = async () => {
    if (!postLink.trim()) {
      setError("Link post harus diisi.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const token = localStorage.getItem("simpenakun_token");
      const body: any = {
        post_link: postLink.trim(),
        template_index: useCustomText ? -1 : templateIndex,
        custom_text: useCustomText ? customText : "",
        delay: commentDelay,
        reaction_enabled: commentReaction,
      };
      const res = await fetch("https://api.simpenakun.site/api/actions/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message || "Comment selesai!");
      } else {
        setError(data.message || "Comment gagal.");
      }
    } catch (err: any) {
      setError("Gagal mengirim comment.");
    } finally {
      setSending(false);
    }
  };

  const handleStopComment = async () => {
    try {
      const token = localStorage.getItem("simpenakun_token");
      await fetch("https://api.simpenakun.site/api/actions/stop/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      showSuccess("Stop signal sent. Menunggu proses berhenti...");
    } catch {
      setError("Gagal mengirim stop signal.");
    }
  };

  const estimatedMinutes = Math.ceil((accountCount * commentDelay) / 60);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Auto Comment</h2>
        <p className="text-muted-foreground">Konfigurasi dan trigger auto comment</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
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
            <Label>Reaction Enabled</Label>
            <Switch
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

      {/* Trigger Comment */}
      <Card>
        <CardHeader>
          <CardTitle>Kirim Comment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Link Post</Label>
            <Input
              placeholder="https://t.me/channel/123"
              value={postLink}
              onChange={(e) => setPostLink(e.target.value)}
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <div className="flex items-center gap-2">
              <select
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={useCustomText ? "custom" : String(templateIndex)}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setUseCustomText(true);
                  } else {
                    setUseCustomText(false);
                    setTemplateIndex(Number(e.target.value));
                  }
                }}
                disabled={sending}
              >
                <option value="-1">Semua Template (tiap akun beda)</option>
                {templates.map((t, i) => (
                  <option key={i} value={String(i)}>{t.name}</option>
                ))}
                <option value="custom">Custom Text</option>
              </select>
            </div>
          </div>

          {useCustomText && (
            <div className="space-y-2">
              <Label>Custom Text</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Tulis comment custom..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                disabled={sending}
              />
            </div>
          )}

          {/* Template Preview */}
          {!useCustomText && templates.length > 0 && (
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-2">
                {templateIndex === -1
                  ? `${templates.length} template siap dikirim (random per akun):`
                  : "Template yang dipilih:"}
              </p>
              {templateIndex === -1 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {templates.map((t, i) => (
                    <p key={i} className="text-xs font-mono truncate">
                      {i + 1}. {t.text}
                    </p>
                  ))}
                </div>
              ) : templates[templateIndex] ? (
                <p className="text-sm font-mono">{templates[templateIndex].text}</p>
              ) : null}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Delay antar akun (detik)</Label>
              <Input
                type="number"
                min={10}
                max={600}
                value={commentDelay}
                onChange={(e) => setCommentDelay(Math.max(10, parseInt(e.target.value) || 90))}
                disabled={sending}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={commentReaction}
                onCheckedChange={setCommentReaction}
                disabled={sending}
              />
              <Label>Reaction</Label>
            </div>
          </div>

          {accountCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Estimasi: ~{estimatedMinutes} menit ({accountCount} akun × {commentDelay}s)
            </p>
          )}

          {!sending ? (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSendComment}
            >
              <Send className="mr-2 h-4 w-4" />
              Kirim Comment
            </Button>
          ) : (
            <Button variant="destructive" className="w-full" onClick={handleStopComment}>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}

          {sending && (
            <p className="text-xs text-muted-foreground text-center">
              Proses berjalan, jangan tutup halaman. Estimasi ~{estimatedMinutes} menit.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

export default function AutoReactionPage() {
  const [channels, setChannels] = useState<(string | number)[]>([]);
  const [newChannel, setNewChannel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchChannels();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchChannels = async () => {
    try {
      const res = await api.get("/settings/reaction-channels");
      setChannels(res.data?.channels || []);
    } catch (err: any) {
      setError("Gagal memuat reaction channels.");
    } finally {
      setLoading(false);
    }
  };

  const saveChannels = async () => {
    setSaving(true);
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

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Auto Reaction</h2>
        <p className="text-muted-foreground">Kelola channel untuk auto reaction</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

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
              <div
                key={index}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="font-mono text-sm">{id}</span>
                <Button variant="ghost" size="icon" onClick={() => removeChannel(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {channels.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Belum ada channel yang ditambahkan.
              </p>
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

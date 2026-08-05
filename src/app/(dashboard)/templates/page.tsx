"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { TemplateItem, NameItem } from "@/types";
import { Loader2, Save } from "lucide-react";

export default function TemplatesPage() {
  // Comment Templates (notepad style)
  const [templatesText, setTemplatesText] = useState("");
  const [templateCount, setTemplateCount] = useState(0);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateSaving, setTemplateSaving] = useState(false);

  // Saved Names
  const [namesText, setNamesText] = useState("");
  const [namesLoading, setNamesLoading] = useState(true);
  const [namesSaving, setNamesSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchTemplates();
    fetchNames();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  // Comment Templates
  const fetchTemplates = async () => {
    try {
      const response = await api.get("/templates/comments");
      const resData = response.data;
      const items: TemplateItem[] = Array.isArray(resData) ? resData : resData?.templates || resData?.data || [];
      const text = items.map((t) => t.text).join("\n");
      setTemplatesText(text);
      setTemplateCount(items.length);
    } catch (err: any) {
      setError("Gagal memuat comment templates.");
    } finally {
      setTemplateLoading(false);
    }
  };

  const saveTemplates = async () => {
    setTemplateSaving(true);
    setError("");
    try {
      const lines = templatesText.split("\n").filter((l) => l.trim());
      const payload: TemplateItem[] = lines.map((text, i) => ({
        name: `line_${i + 1}`,
        text: text.trim(),
      }));
      await api.put("/templates/comments", payload);
      setTemplateCount(payload.length);
      showSuccess(`${payload.length} template tersimpan!`);
    } catch (err: any) {
      setError("Gagal menyimpan templates.");
    } finally {
      setTemplateSaving(false);
    }
  };

  // Update count on text change
  const handleTemplatesTextChange = (value: string) => {
    setTemplatesText(value);
    setTemplateCount(value.split("\n").filter((l) => l.trim()).length);
  };

  // Saved Names
  const fetchNames = async () => {
    try {
      const response = await api.get("/templates/names");
      const resData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setNamesText(resData.map((n: NameItem) => `${n.first},${n.last}`).join("\n"));
    } catch (err: any) {
      // silent
    } finally {
      setNamesLoading(false);
    }
  };

  const saveNames = async () => {
    setNamesSaving(true);
    setError("");
    try {
      const parsed: NameItem[] = namesText
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [first, last] = line.split(",").map((s) => s.trim());
          return { first: first || "", last: last || "" };
        });
      await api.put("/templates/names", parsed);
      showSuccess("Saved names updated!");
    } catch (err: any) {
      setError("Gagal menyimpan names.");
    } finally {
      setNamesSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
        <p className="text-muted-foreground">Kelola comment templates dan saved names</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      <Tabs defaultValue="comments">
        <TabsList>
          <TabsTrigger value="comments">Comment Templates</TabsTrigger>
          <TabsTrigger value="names">Saved Names</TabsTrigger>
        </TabsList>

        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comment Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Satu baris = satu template comment. Tambah/hapus/edit langsung di textarea.
              </p>
              {templateLoading ? (
                <Loading />
              ) : (
                <>
                  <textarea
                    className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder={"Keren banget postingannya!\nMantap, lanjutkan!\nNice content 🔥"}
                    value={templatesText}
                    onChange={(e) => handleTemplatesTextChange(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Total: {templateCount} template
                    </p>
                    <Button onClick={saveTemplates} disabled={templateSaving}>
                      {templateSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Templates
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="names">
          <Card>
            <CardHeader>
              <CardTitle>Saved Names</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Format: satu nama per baris, format &quot;first,last&quot;
              </p>
              {namesLoading ? (
                <Loading />
              ) : (
                <>
                  <textarea
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder={"John,Doe\nJane,Smith"}
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button onClick={saveNames} disabled={namesSaving}>
                      {namesSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Names
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

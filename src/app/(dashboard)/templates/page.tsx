"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { TemplateItem, NameItem } from "@/types";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

export default function TemplatesPage() {
  // Comment Templates
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateText, setNewTemplateText] = useState("");
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateSaving, setTemplateSaving] = useState(false);

  // Saved Names
  const [, setNames] = useState<NameItem[]>([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [namesSaving, setNamesSaving] = useState(false);
  const [namesText, setNamesText] = useState("");

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
      const response = await api.get("/api/templates/comments");
      setTemplates(response.data);
    } catch (err: any) {
      setError("Gagal memuat comment templates.");
    } finally {
      setTemplateLoading(false);
    }
  };

  const addTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateText.trim()) return;
    setTemplateSaving(true);
    try {
      await api.post("/api/templates/comments", {
        name: newTemplateName,
        text: newTemplateText,
      });
      setNewTemplateName("");
      setNewTemplateText("");
      await fetchTemplates();
      showSuccess("Template ditambahkan!");
    } catch (err: any) {
      setError("Gagal menambahkan template.");
    } finally {
      setTemplateSaving(false);
    }
  };

  const deleteTemplate = async (name: string) => {
    try {
      await api.delete("/api/templates/comments", { data: { name } });
      await fetchTemplates();
    } catch (err: any) {
      setError("Gagal menghapus template.");
    }
  };

  // Saved Names
  const fetchNames = async () => {
    try {
      const response = await api.get("/api/templates/names");
      setNames(response.data);
      setNamesText(
        response.data.map((n: NameItem) => `${n.first},${n.last}`).join("\n")
      );
    } catch (err: any) {
      setError("Gagal memuat saved names.");
    } finally {
      setNamesLoading(false);
    }
  };

  const saveNames = async () => {
    setNamesSaving(true);
    try {
      const parsed: NameItem[] = namesText
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [first, last] = line.split(",").map((s) => s.trim());
          return { first: first || "", last: last || "" };
        });
      await api.put("/api/templates/names", parsed);
      showSuccess("Saved names updated!");
      await fetchNames();
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
        <p className="text-muted-foreground">
          Kelola comment templates dan saved names
        </p>
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
              {/* Add new template */}
              <div className="space-y-3 rounded-md border p-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Nama Template</Label>
                  <Input
                    id="template-name"
                    placeholder="Nama template"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-text">Teks Template</Label>
                  <textarea
                    id="template-text"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Isi template comment..."
                    value={newTemplateText}
                    onChange={(e) => setNewTemplateText(e.target.value)}
                  />
                </div>
                <Button onClick={addTemplate} disabled={templateSaving}>
                  {templateSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Tambah Template
                </Button>
              </div>

              {/* Template list */}
              {templateLoading ? (
                <Loading />
              ) : (
                <div className="space-y-2">
                  {templates.map((template, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-4 rounded-md border p-3"
                    >
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {template.text}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTemplate(template.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <p className="py-4 text-center text-muted-foreground">
                      Belum ada template.
                    </p>
                  )}
                </div>
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
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="John,Doe&#10;Jane,Smith"
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                  />
                  <Button onClick={saveNames} disabled={namesSaving}>
                    {namesSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Names
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

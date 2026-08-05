"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Send, MessageSquare, Eye, FileText } from "lucide-react";

const settingsLinks = [
  { href: "/auto-pm", label: "Auto PM", desc: "Konfigurasi auto PM dan lihat logs", icon: Send },
  { href: "/auto-comment", label: "Auto Comment", desc: "Delay dan reaction settings", icon: MessageSquare },
  { href: "/auto-reaction", label: "Auto Reaction", desc: "Kelola channel reaction", icon: Eye },
  { href: "/templates", label: "Templates", desc: "Comment templates dan saved names", icon: FileText },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Konfigurasi bot SimpenAkun</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-3">
                <item.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

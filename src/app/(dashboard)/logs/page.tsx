"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { PMTaskLogItem } from "@/types";
import { Loader2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function LogsPage() {
  const [logs, setLogs] = useState<PMTaskLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [clearing, setClearing] = useState(false);
  const limit = 50;

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/logs/pm-tasks", {
        params: { page, limit },
      });
      setLogs(response.data.data || response.data);
      setTotal(response.data.total || 0);
    } catch (err: any) {
      setError("Gagal memuat PM logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCompleted = async () => {
    setClearing(true);
    try {
      await api.delete("/logs/pm-tasks/cleared");
      await fetchLogs();
    } catch (err: any) {
      setError("Gagal menghapus completed logs.");
    } finally {
      setClearing(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "SENT":
        return <Badge variant="default">Sent</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "CLEARED":
        return <Badge variant="outline">Cleared</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading && logs.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">PM Logs</h2>
          <p className="text-muted-foreground">
            Riwayat pengiriman PM ({total} total)
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleClearCompleted}
          disabled={clearing}
        >
          {clearing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Clear Completed Logs
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">User ID</th>
                  <th className="px-4 py-3 text-left font-medium">Target</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">PM Sent</th>
                  <th className="px-4 py-3 text-left font-medium">Clear At</th>
                  <th className="px-4 py-3 text-center font-medium">Cleared</th>
                  <th className="px-4 py-3 text-center font-medium">Reloaded</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="px-4 py-3 font-mono">{log.user_id}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.target_chat_id}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                    <td className="px-4 py-3 text-xs">
                      {log.pm_sent_at
                        ? new Date(log.pm_sent_at).toLocaleString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.clear_chat_at
                        ? new Date(log.clear_chat_at).toLocaleString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.is_cleared ? "✅" : "❌"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.is_reloaded ? "✅" : "❌"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Tidak ada log ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

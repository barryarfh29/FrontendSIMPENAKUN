"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { AccountItem } from "@/types";
import { Loader2, ShieldBan, ShieldCheck } from "lucide-react";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get("/accounts");
      const resData = response.data;
      if (Array.isArray(resData)) {
        setAccounts(resData);
      } else if (resData && Array.isArray(resData.data)) {
        setAccounts(resData.data);
      } else if (resData && Array.isArray(resData.accounts)) {
        setAccounts(resData.accounts);
      } else {
        setAccounts([]);
      }
    } catch (err: any) {
      setError("Gagal memuat daftar akun.");
    } finally {
      setLoading(false);
    }
  };

  const handleBlacklist = async (userId: number, action: "add" | "remove") => {
    setActionLoading(userId);
    try {
      await api.post(`/accounts/blacklist/${action}`, { user_id: userId });
      await fetchAccounts();
    } catch (err: any) {
      setError(`Gagal ${action === "add" ? "menambahkan" : "menghapus"} blacklist.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loading />;

  if (error && accounts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
        <p className="text-muted-foreground">
          Kelola akun Telegram yang terdaftar
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">User ID</th>
                  <th className="px-4 py-3 text-left font-medium">Session</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.user_id} className="border-b">
                    <td className="px-4 py-3 font-mono">{account.user_id}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={account.session_exists ? "default" : "secondary"}
                      >
                        {account.session_exists ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={account.is_blacklisted ? "destructive" : "outline"}
                      >
                        {account.is_blacklisted ? "Blacklisted" : "Normal"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {account.is_blacklisted ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlacklist(account.user_id, "remove")}
                          disabled={actionLoading === account.user_id}
                        >
                          {actionLoading === account.user_id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="mr-1 h-3 w-3" />
                          )}
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleBlacklist(account.user_id, "add")}
                          disabled={actionLoading === account.user_id}
                        >
                          {actionLoading === account.user_id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <ShieldBan className="mr-1 h-3 w-3" />
                          )}
                          Blacklist
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Belum ada akun terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

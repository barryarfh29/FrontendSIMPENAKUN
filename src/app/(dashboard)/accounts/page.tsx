"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { AccountItem, AccountDetail } from "@/types";
import {
  Loader2,
  ShieldBan,
  ShieldCheck,
  X,
  Phone,
  User,
  Calendar,
  Key,
  Trash2,
} from "lucide-react";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Detail modal
  const [selectedAccount, setSelectedAccount] = useState<AccountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get("/accounts/");
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

  const fetchAccountDetail = async (userId: number) => {
    setDetailLoading(true);
    setShowModal(true);
    setError("");
    try {
      const token = localStorage.getItem("simpenakun_token");
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          redirect: "follow",
        }
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setSelectedAccount(data);
    } catch (err: any) {
      setError("Gagal memuat detail akun.");
      setShowModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBlacklist = async (userId: number, action: "add" | "remove") => {
    setActionLoading(userId);
    try {
      await api.post(`/accounts/blacklist/${action}`, { ids: [userId] });
      await fetchAccounts();
      if (selectedAccount && selectedAccount.user_id === userId) {
        setSelectedAccount({
          ...selectedAccount,
          is_blacklisted: action === "add",
        });
      }
    } catch (err: any) {
      setError(`Gagal ${action === "add" ? "menambahkan" : "menghapus"} blacklist.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("simpenakun_token");
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${selectedAccount.user_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setShowDeleteConfirm(false);
      closeModal();
      await fetchAccounts();
    } catch (err: any) {
      setError("Gagal menghapus akun.");
    } finally {
      setDeleting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAccount(null);
    setShowDeleteConfirm(false);
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
          Kelola akun Telegram yang terdaftar ({accounts.length} akun)
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
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Session</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.user_id}
                    className="border-b cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => fetchAccountDetail(account.user_id)}
                  >
                    <td className="px-4 py-3 font-mono">{account.user_id}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {account.phone_number || "-"}
                    </td>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlacklist(account.user_id, "remove");
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlacklist(account.user_id, "add");
                          }}
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
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Belum ada akun terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Account Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative z-50 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg mx-4">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={closeModal}
            >
              <X className="h-4 w-4" />
            </Button>

            <h3 className="text-lg font-semibold mb-4">Detail Akun</h3>

            {detailLoading ? (
              <Loading />
            ) : selectedAccount ? (
              <div className="space-y-4">
                {/* User ID */}
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="font-mono font-medium">{selectedAccount.user_id}</p>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <p className="font-mono">{selectedAccount.phone_number || "-"}</p>
                  </div>
                </div>

                {/* Old Phone Number */}
                {selectedAccount.old_phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Old Phone Number</p>
                      <p className="font-mono">{selectedAccount.old_phone_number}</p>
                    </div>
                  </div>
                )}

                {/* Password (2FA) */}
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Password (2FA)</p>
                    <p className="font-mono">{selectedAccount.password || "n/a"}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm">
                      {selectedAccount.date
                        ? new Date(selectedAccount.date).toLocaleString("id-ID")
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant={selectedAccount.session_exists ? "default" : "secondary"}>
                    Session: {selectedAccount.session_exists ? "Yes" : "No"}
                  </Badge>
                  <Badge variant={selectedAccount.is_blacklisted ? "destructive" : "outline"}>
                    {selectedAccount.is_blacklisted ? "Blacklisted" : "Normal"}
                  </Badge>
                  {selectedAccount.is_number_changed && (
                    <Badge variant="secondary">Number Changed</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t">
                  {/* Blacklist action */}
                  {selectedAccount.is_blacklisted ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleBlacklist(selectedAccount.user_id, "remove")}
                      disabled={actionLoading === selectedAccount.user_id}
                    >
                      {actionLoading === selectedAccount.user_id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      )}
                      Remove from Blacklist
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleBlacklist(selectedAccount.user_id, "add")}
                      disabled={actionLoading === selectedAccount.user_id}
                    >
                      {actionLoading === selectedAccount.user_id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldBan className="mr-2 h-4 w-4" />
                      )}
                      Add to Blacklist
                    </Button>
                  )}

                  {/* Delete / Clear Session */}
                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Sesi
                    </Button>
                  ) : (
                    <div className="rounded-md border border-destructive p-3 space-y-3">
                      <p className="text-sm text-destructive font-medium">
                        Yakin hapus akun ini dari database?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-3 w-3" />
                          )}
                          Ya, Hapus
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

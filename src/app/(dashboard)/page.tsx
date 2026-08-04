"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Send,
  CheckCircle,
  Clock,
} from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { Loading } from "@/components/loading";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/api/dashboard/stats");
      setStats(response.data);
    } catch (err: any) {
      setError("Gagal memuat statistik dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Ringkasan statistik bot SimpenAkun
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Akun"
          value={stats?.total_accounts ?? 0}
          icon={Users}
        />
        <StatsCard
          title="Akun Aktif"
          value={stats?.active_accounts ?? 0}
          icon={UserCheck}
        />
        <StatsCard
          title="Akun Blacklist"
          value={stats?.blacklisted_accounts ?? 0}
          icon={UserX}
        />
        <StatsCard
          title="PM Terkirim"
          value={stats?.total_pm_sent ?? 0}
          icon={Send}
        />
        <StatsCard
          title="PM Cleared"
          value={stats?.total_pm_cleared ?? 0}
          icon={CheckCircle}
        />
        <StatsCard
          title="PM Pending"
          value={stats?.total_pm_pending ?? 0}
          icon={Clock}
        />
      </div>
    </div>
  );
}

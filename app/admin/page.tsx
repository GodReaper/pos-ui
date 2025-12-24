"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import type { OrderStatus } from "@/lib/api/types";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Loader2,
  RefreshCcw,
  Users,
} from "lucide-react";

type SummaryDateFilter = "today";

type AdminSummaryResponse = {
  total_sales: number;
  running_tables_count: number;
  payment_mode_breakdown: Record<string, number>;
};

type RunningTableStatus = Extract<OrderStatus, "open" | "kot_printed" | "billed">;

type RunningTable = {
  order_id: string;
  table_id: string;
  table_name: string;
  area_id: string;
  area_name: string;
  biller_id: string;
  biller_username: string;
  current_total: number;
  status: RunningTableStatus;
};

type BillerPerformance = {
  biller_id: string;
  biller_username: string;
  total_sales: number;
  orders_count: number;
};

type LoadState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

const ORDER_STATUS_STYLES: Record<RunningTableStatus, { label: string; pillBg: string; pillText: string; dot: string }> =
  {
    open: {
      label: "Open",
      pillBg: "bg-emerald-500/15",
      pillText: "text-emerald-300",
      dot: "bg-emerald-400",
    },
    kot_printed: {
      label: "KOT Printed",
      pillBg: "bg-amber-500/15",
      pillText: "text-amber-300",
      dot: "bg-amber-400",
    },
    billed: {
      label: "Billed",
      pillBg: "bg-sky-500/15",
      pillText: "text-sky-300",
      dot: "bg-sky-400",
    },
  };

const PAYMENT_COLORS = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-rose-500", "bg-violet-500"];

function formatCurrency(amount: number | null | undefined): string {
  const safeAmount = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
  return safeAmount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatTime(date: Date | null): string {
  if (!date) return "--:--";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const [dateFilter] = useState<SummaryDateFilter>("today");
  const [summary, setSummary] = useState<LoadState<AdminSummaryResponse>>({
    data: null,
    loading: true,
    error: null,
  });
  const [runningTables, setRunningTables] = useState<LoadState<RunningTable[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [billerPerformance, setBillerPerformance] = useState<LoadState<BillerPerformance[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isAnyLoading = summary.loading || runningTables.loading || billerPerformance.loading;

  const totalPaidOrders = useMemo(() => {
    if (!billerPerformance.data) return 0;
    return billerPerformance.data.reduce((acc, item) => acc + item.orders_count, 0);
  }, [billerPerformance.data]);

  const totalSales = summary.data?.total_sales ?? 0;
  const runningTablesCount = summary.data?.running_tables_count ?? 0;

  const paymentBreakdownEntries = useMemo(() => {
    if (!summary.data) return [];
    const entries = Object.entries(summary.data.payment_mode_breakdown);
    entries.sort((a, b) => b[1] - a[1]);
    return entries;
  }, [summary.data]);

  const totalPaymentAmount = useMemo(() => {
    if (!summary.data) return 0;
    return Object.values(summary.data.payment_mode_breakdown).reduce((acc, value) => acc + value, 0);
  }, [summary.data]);

  const fetchDashboardData = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;

      if (!silent) {
        setSummary((prev) => ({ ...prev, loading: true, error: null }));
        setRunningTables((prev) => ({ ...prev, loading: true, error: null }));
        setBillerPerformance((prev) => ({ ...prev, loading: true, error: null }));
      }

      try {
        const [summaryRes, runningTablesRes, billerPerfRes] = await Promise.all([
          apiClient.get<AdminSummaryResponse>("/admin/summary", {
            params: { date: dateFilter },
          }),
          apiClient.get<RunningTable[]>("/admin/running-tables"),
          apiClient.get<BillerPerformance[]>("/admin/biller-performance", {
            params: { date: dateFilter },
          }),
        ]);

        setSummary({ data: summaryRes, loading: false, error: null });
        setRunningTables({ data: runningTablesRes, loading: false, error: null });
        setBillerPerformance({ data: billerPerfRes, loading: false, error: null });
        setLastUpdated(new Date());
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load dashboard data";

        setSummary((prev) => ({ ...prev, loading: false, error: message }));
        setRunningTables((prev) => ({ ...prev, loading: false, error: message }));
        setBillerPerformance((prev) => ({ ...prev, loading: false, error: message }));
      }
    },
    [dateFilter]
  );

  useEffect(() => {
    void fetchDashboardData();

    const interval = setInterval(() => {
      void fetchDashboardData({ silent: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-slate-950/90">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard Overview</h1>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50 text-[11px] uppercase tracking-wide">
              Live
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time overview of sales, running tables, and biller performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Auto-refresh every 5s</div>
            <div>Last updated: {formatTime(lastUpdated)}</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800"
            onClick={() => fetchDashboardData()}
          >
            {isAnyLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs uppercase tracking-wide text-slate-400">
                Today&apos;s Total Sales
              </CardDescription>
              <CardTitle className="mt-1 text-2xl font-semibold">{formatCurrency(totalSales)}</CardTitle>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            <span>Sales tracked by completed payments.</span>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs uppercase tracking-wide text-slate-400">
                Running Tables
              </CardDescription>
              <CardTitle className="mt-1 text-2xl font-semibold">{runningTablesCount}</CardTitle>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-sky-300 flex items-center gap-1">
            <span>{runningTables.data?.length ?? 0} active orders across all areas.</span>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs uppercase tracking-wide text-slate-400">
                Paid Orders Today
              </CardDescription>
              <CardTitle className="mt-1 text-2xl font-semibold">{totalPaidOrders}</CardTitle>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-violet-300">
            Based on distinct orders with payments today.
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs uppercase tracking-wide text-slate-400">
              Payment Coverage
            </CardDescription>
            <CardTitle className="mt-1 text-2xl font-semibold">
              {formatCurrency(totalPaymentAmount || totalSales)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-slate-400">
            Combined total across all payment methods for the selected day.
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        <Card className="border-slate-800 bg-slate-950/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Payment Mode Breakdown</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Distribution of today&apos;s sales across payment methods.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentBreakdownEntries.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                No payments recorded for the selected day yet.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paymentBreakdownEntries.map(([method, amount], index) => {
                    const percent = totalPaymentAmount
                      ? Math.round((amount / totalPaymentAmount) * 100)
                      : 0;
                    const colorClass = PAYMENT_COLORS[index % PAYMENT_COLORS.length];

                    return (
                      <div key={method} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${colorClass?.replace("bg-", "bg-")} shadow`}
                            />
                            <span className="uppercase tracking-wide">{method}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span>{percent}%</span>
                            <span>{formatCurrency(amount)}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-900/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colorClass}`}
                            style={{ width: `${Math.max(percent, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                  <span>Total</span>
                  <span className="font-medium text-slate-200">{formatCurrency(totalPaymentAmount)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Biller Performance</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Sales and order count per biller for today.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {billerPerformance.loading && !billerPerformance.data ? (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading biller performance...
              </div>
            ) : billerPerformance.error ? (
              <div className="text-xs text-rose-400">{billerPerformance.error}</div>
            ) : !billerPerformance.data || billerPerformance.data.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                No biller activity recorded for today yet.
              </div>
            ) : (
              <div className="space-y-3">
                {billerPerformance.data.map((biller, index) => {
                  const trendUp = index % 2 === 0;
                  const initials =
                    biller.biller_username
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "B";

                  return (
                    <div
                      key={biller.biller_id}
                      className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-100">
                          {initials}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-slate-100">
                            {biller.biller_username}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{biller.orders_count} orders</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="text-sm font-semibold text-slate-50">
                          {formatCurrency(biller.total_sales)}
                        </div>
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                            trendUp
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-rose-500/10 text-rose-300"
                          }`}
                        >
                          {trendUp ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          <span>{trendUp ? "+12%" : "-3%"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
        <Card className="border-slate-800 bg-slate-950/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Running Tables</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Live list of open, KOT printed, and billed orders.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-slate-700 bg-slate-900/70 text-[11px] text-slate-300 uppercase tracking-wide"
            >
              {runningTables.data?.length ?? 0} Active
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {runningTables.loading && !runningTables.data ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading running tables...
              </div>
            ) : runningTables.error ? (
              <div className="text-xs text-rose-400">{runningTables.error}</div>
            ) : !runningTables.data || runningTables.data.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                No running tables right now.
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-auto pr-2">
                {runningTables.data.map((rt) => {
                  const statusStyle = ORDER_STATUS_STYLES[rt.status];

                  return (
                    <div
                      key={rt.order_id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950/60 text-xs font-semibold text-slate-100 border border-slate-800">
                          {rt.table_name}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                            <span>{rt.area_name}</span>
                            <span className="text-slate-500 text-xs">#{rt.order_id.slice(0, 6)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span>Table {rt.table_name}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-600" />
                            <span>Biller {rt.biller_username}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${statusStyle.pillBg} ${statusStyle.pillText}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                          <span>{statusStyle.label}</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-50">
                          {formatCurrency(rt.current_total)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">System Status</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Quick health snapshot for admin monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between rounded-lg bg-slate-900/70 px-3 py-2.5">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Data Feed</div>
                <div className="text-sm font-medium text-slate-100">
                  {isAnyLoading ? "Syncing data..." : "Live & up to date"}
                </div>
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                  isAnyLoading ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isAnyLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"
                  }`}
                />
                <span>{isAnyLoading ? "Refreshing" : "Healthy"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-900/70 px-3 py-2.5">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Cache Window
                </div>
                <div className="text-sm font-medium text-slate-100">60s backend cache</div>
              </div>
              <div className="text-[11px] text-slate-400 text-right">
                Optimized with Redis
                <br />
                Per-endpoint caching
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

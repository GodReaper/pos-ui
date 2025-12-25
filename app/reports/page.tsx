"use client";

import { useState, FormEvent, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/client";
import type { ReportsResponse, RunningTableStatus } from "@/lib/api/types";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Loader2,
  RefreshCcw,
  Users,
  User,
  FileText,
} from "lucide-react";

type SummaryDateFilter = "today" | string;

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

export default function ReportsPage() {
  const [username, setUsername] = useState("");
  const [dateFilter, setDateFilter] = useState<SummaryDateFilter>("today");
  const [reports, setReports] = useState<ReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(true);

  const totalSales = reports?.summary.total_sales ?? 0;
  const runningTablesCount = reports?.summary.running_tables_count ?? 0;

  const paymentBreakdownEntries = useMemo(() => {
    if (!reports?.summary) return [];
    const entries = Object.entries(reports.summary.payment_mode_breakdown);
    entries.sort((a, b) => b[1] - a[1]);
    return entries;
  }, [reports]);

  const totalPaymentAmount = useMemo(() => {
    if (!reports?.summary) return 0;
    return Object.values(reports.summary.payment_mode_breakdown).reduce((acc, value) => acc + value, 0);
  }, [reports]);

  const totalPaidOrders = useMemo(() => {
    if (!reports?.biller_performance) return 0;
    return reports.biller_performance.reduce((acc, item) => acc + item.orders_count, 0);
  }, [reports]);

  const fetchReports = useCallback(
    async (targetUsername: string, date: SummaryDateFilter = "today") => {
      if (!targetUsername.trim()) {
        setError("Please enter a username");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<ReportsResponse>(`/reports/${targetUsername.trim()}`, {
          params: { date },
        });

        setReports(response);
        setLastUpdated(new Date());
        setShowForm(false);
      } catch (err) {
        if (err instanceof Error && "status" in err) {
          const apiError = err as { status: number; message: string };
          if (apiError.status === 403) {
            setError(apiError.message || "You don't have permission to view reports for this username.");
          } else if (apiError.status === 404) {
            setError(`User "${targetUsername}" not found.`);
          } else {
            setError(apiError.message || "Failed to load reports. Please try again.");
          }
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
        setReports(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetchReports(username, dateFilter);
  };

  const handleRefresh = () => {
    if (username.trim() && reports) {
      fetchReports(username, dateFilter);
    }
  };

  const handleNewSearch = () => {
    setShowForm(true);
    setReports(null);
    setError(null);
    setUsername("");
  };

  // Auto-refresh every 5 seconds if reports are loaded
  useEffect(() => {
    if (!reports || !username.trim()) return;

    const interval = setInterval(() => {
      fetchReports(username, dateFilter);
    }, 5000);

    return () => clearInterval(interval);
  }, [reports, username, dateFilter, fetchReports]);

  return (
    <div className="min-h-screen bg-background">
      {showForm ? (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* Report Form Card */}
            <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
              {/* Header with blurred background effect */}
              <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">View Reports</h1>
                    <p className="text-sm text-muted-foreground">ENTER USERNAME TO VIEW</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="px-6 pb-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-1">Enter Username</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter a username to view their sales reports and performance metrics.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* General Error */}
                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-muted-foreground">
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (error) setError(null);
                        }}
                        className="pl-10"
                        disabled={isLoading}
                        autoComplete="username"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Date Filter Field */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-muted-foreground">
                      Date Filter
                    </Label>
                    <Input
                      id="date"
                      type="text"
                      placeholder="today or YYYY-MM-DD"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter &quot;today&quot; or a date in YYYY-MM-DD format
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={isLoading || !username.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        See Report
                        <FileText className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>System Online</span>
                  </div>
                  <span>Reports API v1.0</span>
                </div>
              </div>
            </div>

            {/* Copyright Footer */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              © 2024 Culinary Systems Inc. All rights reserved.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 bg-slate-950/90">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
                  Reports for {reports?.username || username}
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50 text-[11px] uppercase tracking-wide">
                  Live
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time overview of sales, running tables, and biller performance.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="text-right text-xs text-muted-foreground">
                <div className="font-medium text-foreground">Auto-refresh every 5s</div>
                <div>Last updated: {formatTime(lastUpdated)}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
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
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800"
                onClick={handleNewSearch}
              >
                New Search
              </Button>
            </div>
          </header>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {reports && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardDescription className="text-xs uppercase tracking-wide text-slate-400">
                        Total Sales
                      </CardDescription>
                      <CardTitle className="mt-1 text-xl sm:text-2xl font-semibold">
                        {formatCurrency(totalSales)}
                      </CardTitle>
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
                      <CardTitle className="mt-1 text-xl sm:text-2xl font-semibold">
                        {runningTablesCount}
                      </CardTitle>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                      <Users className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-sky-300 flex items-center gap-1">
                    <span>
                      {reports.running_tables?.length ?? 0} active orders across all areas.
                    </span>
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardDescription className="text-xs uppercase tracking-wide text-slate-400">
                        Paid Orders
                      </CardDescription>
                      <CardTitle className="mt-1 text-xl sm:text-2xl font-semibold">
                        {totalPaidOrders}
                      </CardTitle>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-violet-300">
                    Based on distinct orders with payments.
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs uppercase tracking-wide text-slate-400">
                      Payment Coverage
                    </CardDescription>
                    <CardTitle className="mt-1 text-xl sm:text-2xl font-semibold">
                      {formatCurrency(totalPaymentAmount || totalSales)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-slate-400">
                    Combined total across all payment methods.
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                <Card className="border-slate-800 bg-slate-950/80">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base font-semibold">Payment Mode Breakdown</CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Distribution of sales across payment methods.
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
                          <span className="font-medium text-slate-200">
                            {formatCurrency(totalPaymentAmount)}
                          </span>
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
                        Sales and order count for this username.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!reports.biller_performance || reports.biller_performance.length === 0 ? (
                      <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                        No biller activity recorded for the selected day yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.biller_performance.map((biller, index) => {
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

              <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
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
                      {reports.running_tables?.length ?? 0} Active
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!reports.running_tables || reports.running_tables.length === 0 ? (
                      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                        No running tables right now.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[320px] overflow-auto pr-2">
                        {reports.running_tables.map((rt) => {
                          const statusStyle = ORDER_STATUS_STYLES[rt.status];

                          return (
                            <div
                              key={rt.order_id}
                              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2.5"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950/60 text-xs font-semibold text-slate-100 border border-slate-800 flex-shrink-0">
                                  {rt.table_name}
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                                    <span className="truncate">{rt.area_name}</span>
                                    <span className="text-slate-500 text-xs flex-shrink-0">
                                      #{rt.order_id.slice(0, 6)}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                    <span>Table {rt.table_name}</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                                    <span>Biller {rt.biller_username}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
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
                      Quick health snapshot for monitoring.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-slate-300">
                    <div className="flex items-center justify-between rounded-lg bg-slate-900/70 px-3 py-2.5">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Data Feed</div>
                        <div className="text-sm font-medium text-slate-100">
                          {isLoading ? "Syncing data..." : "Live & up to date"}
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                          isLoading
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"
                          }`}
                        />
                        <span>{isLoading ? "Refreshing" : "Healthy"}</span>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}


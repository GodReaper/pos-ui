import type { Table } from "@/lib/api/types";

export type TableStatus = Table["status"] | "unknown";

type StatusColors = {
  cardBg: string;
  cardBorder: string;
  pillBg: string;
  pillText: string;
};

const STATUS_COLOR_MAP: Record<TableStatus, StatusColors> = {
  available: {
    cardBg: "bg-slate-900/60",
    cardBorder: "border-sky-500/60",
    pillBg: "bg-sky-500/15",
    pillText: "text-sky-300",
  },
  occupied: {
    cardBg: "bg-slate-900/80",
    cardBorder: "border-emerald-500/70",
    pillBg: "bg-emerald-500/15",
    pillText: "text-emerald-300",
  },
  reserved: {
    cardBg: "bg-slate-900/70",
    cardBorder: "border-amber-500/70",
    pillBg: "bg-amber-500/15",
    pillText: "text-amber-300",
  },
  out_of_order: {
    cardBg: "bg-slate-950/80",
    cardBorder: "border-rose-500/70",
    pillBg: "bg-rose-500/15",
    pillText: "text-rose-300",
  },
  unknown: {
    cardBg: "bg-slate-900/70",
    cardBorder: "border-slate-700",
    pillBg: "bg-slate-700/40",
    pillText: "text-slate-200",
  },
};

export function getTableStatusColors(status: TableStatus): StatusColors {
  return STATUS_COLOR_MAP[status] ?? STATUS_COLOR_MAP.unknown;
}



"use client";

import { cn } from "@/lib/utils";
import type { Table } from "@/lib/api/types";
import { getTableStatusColors } from "@/lib/pos/statusColors";

export type BillerTable = Table & {
  /**
   * Optional running total from backend in major units (e.g. dollars).
   * Falls back to 0.0 if not provided.
   */
  running_total?: number | null;
};

interface TableCardProps {
  table: BillerTable;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TableCard({ table, isSelected, onClick }: TableCardProps) {
  const statusColors = getTableStatusColors(table.status);
  const total = typeof table.running_total === "number" ? table.running_total : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-stretch rounded-xl border px-4 py-3 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
        statusColors.cardBg,
        statusColors.cardBorder,
        isSelected && "ring-2 ring-sky-500 shadow-lg shadow-sky-900/40",
        !isSelected && "hover:border-sky-500/60 hover:bg-slate-900"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-slate-50">
            {table.name}
          </span>
          {table.capacity ? (
            <span className="mt-0.5 text-[11px] text-slate-400">
              {table.capacity} Seats
            </span>
          ) : null}
        </div>

        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            statusColors.pillBg,
            statusColors.pillText
          )}
        >
          {table.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400">Running Total</span>
          <span className="text-base font-semibold text-slate-50 tabular-nums">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </button>
  );
}



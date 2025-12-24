"use client";

import { TableCard, type BillerTable } from "@/components/TableCard";

interface TableGridProps {
  tables: BillerTable[];
  selectedTableId?: string | null;
  isLoading?: boolean;
  onSelectTable?: (table: BillerTable) => void;
  onOpenOrder?: (table: BillerTable) => void;
}

export function TableGrid({
  tables,
  selectedTableId,
  isLoading,
  onSelectTable,
  onOpenOrder,
}: TableGridProps) {
  if (isLoading && tables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 text-sm text-slate-400">
        Loading tables…
      </div>
    );
  }

  if (!isLoading && tables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-sm text-slate-500">
        No tables found in this area.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          isSelected={selectedTableId === table.id}
          onClick={() => onSelectTable?.(table)}
          onDoubleClick={() => onOpenOrder?.(table)}
        />
      ))}
    </div>
  );
}



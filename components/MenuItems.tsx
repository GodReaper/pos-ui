"use client";

import type { MenuItem } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrencyINR } from "@/lib/utils";

interface MenuItemsProps {
  items: MenuItem[];
  loading?: boolean;
  onAddItem: (item: MenuItem) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function MenuItems({
  items,
  loading,
  onAddItem,
  searchTerm,
  onSearchTermChange,
}: MenuItemsProps) {
  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/90 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-50">Mains</div>
        <div className="text-[11px] text-slate-500">Tap to add items</div>
      </div>
      <Input
        placeholder="Search items…"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="h-9 border-slate-800 bg-slate-900/80 text-xs placeholder:text-slate-500"
      />
      <div className="flex-1 overflow-y-auto pt-2">
        {loading && items.length === 0 ? (
          <div className="py-6 text-xs text-slate-500">Loading items…</div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-xs text-slate-500">No items match this search.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onAddItem(item)}
                className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-left text-xs transition-colors hover:border-sky-600 hover:bg-slate-900"
              >
                <div className="h-16 rounded-lg bg-slate-800/60" />
                <div className="mt-2">
                  <div className="line-clamp-2 text-[11px] font-medium text-slate-50">
                    {item.name}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-sky-300 tabular-nums">
                    {formatCurrencyINR(item.price)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full border border-slate-700 bg-slate-900/80 text-[11px] text-slate-50"
                  >
                    +
                  </Button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



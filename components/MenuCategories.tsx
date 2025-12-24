"use client";

import type { Category } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MenuCategoriesProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  loading?: boolean;
}

export function MenuCategories({
  categories,
  selectedCategoryId,
  onSelectCategory,
  loading,
}: MenuCategoriesProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/90 p-3">
      <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Categories
      </div>
      {loading && categories.length === 0 ? (
        <div className="flex-1 py-4 text-xs text-slate-500">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="flex-1 py-4 text-xs text-slate-500">
          No categories yet. Configure menu in admin.
        </div>
      ) : (
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          <Button
            variant={selectedCategoryId === null ? "default" : "ghost"}
            size="sm"
            className={cn(
              "mb-1 w-full justify-start rounded-xl px-3 py-2 text-xs",
              selectedCategoryId === null
                ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                : "text-slate-300 hover:bg-slate-900"
            )}
            onClick={() => onSelectCategory(null)}
          >
            All Items
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategoryId === cat.id ? "default" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start rounded-xl px-3 text-xs",
                selectedCategoryId === cat.id
                  ? "bg-sky-600 text-slate-50 hover:bg-sky-500"
                  : "text-slate-300 hover:bg-slate-900"
              )}
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}



import type { OrderStatus } from "@/lib/api/types";

type OrderStatusColors = {
  badge: string;
};

const ORDER_STATUS_COLORS: Record<string, OrderStatusColors> = {
  open: {
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
  },
  kot_printed: {
    badge: "bg-sky-500/10 text-sky-300 border-sky-500/40",
  },
  billed: {
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/40",
  },
  paid: {
    badge: "bg-lime-500/10 text-lime-300 border-lime-500/40",
  },
  closed: {
    badge: "bg-slate-500/10 text-slate-200 border-slate-500/40",
  },
  cancelled: {
    badge: "bg-rose-500/10 text-rose-300 border-rose-500/40",
  },
};

export function getOrderStatusLabel(status: OrderStatus | string): string {
  switch (status) {
    case "open":
      return "Running";
    case "kot_printed":
      return "KOT Printed";
    case "billed":
      return "Billed";
    case "paid":
      return "Paid";
    case "closed":
      return "Closed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function getOrderStatusColors(status: OrderStatus | string): OrderStatusColors {
  return (
    ORDER_STATUS_COLORS[status] ?? {
      badge: "bg-slate-700/40 text-slate-100 border-slate-600/60",
    }
  );
}



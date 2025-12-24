"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Table as TableIcon,
  Receipt,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";
import { clearToken } from "@/lib/auth/token";

export function BillerSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    document.cookie =
      "pos_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    router.push("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950/95">
      {/* Brand */}
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600">
            <TableIcon className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Shift: Evening</p>
            <h1 className="text-sm font-semibold text-slate-50">Biller POS</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 text-sm">
        <NavLink href="/biller" icon={TableIcon} active={pathname === "/biller"}>
          Tables
        </NavLink>
        <NavLink href="/biller/orders" icon={Receipt} active={pathname?.startsWith("/biller/orders")}>
          Orders
        </NavLink>
        <NavLink href="/biller/history" icon={Clock} active={pathname?.startsWith("/biller/history")}>
          History
        </NavLink>
        <NavLink href="/biller/settings" icon={Settings} active={pathname?.startsWith("/biller/settings")}>
          Settings
        </NavLink>
      </nav>

      {/* Collapse / Sign out */}
      <div className="border-t border-slate-800 px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-50"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
  active,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-medium transition-colors ${
        active
          ? "bg-sky-600 text-slate-950"
          : "text-slate-300 hover:bg-slate-900 hover:text-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  );
}



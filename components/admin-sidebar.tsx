"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  UtensilsCrossed,
  Settings,
  LogOut,
} from "lucide-react";
import { clearToken } from "@/lib/auth/token";
import { useRouter } from "next/navigation";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    document.cookie = "pos_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    router.push("/login");
  };

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">POS Admin</h1>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <NavLink href="/admin" icon={LayoutDashboard} active={pathname === "/admin"}>
          Dashboard
        </NavLink>
        <NavLink href="/admin/users" icon={Users} active={pathname?.startsWith("/admin/users")}>
          Users
        </NavLink>
        <NavLink href="/admin/areas" icon={MapPin} active={pathname?.startsWith("/admin/areas")}>
          Areas
        </NavLink>
        <NavLink href="/admin/menu" icon={UtensilsCrossed} active={pathname?.startsWith("/admin/menu")}>
          Menu
        </NavLink>
        <NavLink href="/admin/settings" icon={Settings} active={pathname === "/admin/settings"}>
          Settings
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors touch-manipulation"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
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
      className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors touch-manipulation ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{children}</span>
    </Link>
  );
}


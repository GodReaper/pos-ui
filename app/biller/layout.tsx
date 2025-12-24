import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { isBiller } from "@/lib/auth";
import { BillerSidebar } from "@/components/BillerSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Search, User } from "lucide-react";

/**
 * Biller layout - restricts access to biller role only
 * Includes left navigation sidebar and top search bar header.
 */
export default async function BillerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user || !isBiller(user)) {
    redirect("/login?redirect=/biller");
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <BillerSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-4 px-6 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Dining Area
            </div>
            <div className="mx-4 flex-1 max-w-xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search tables, orders, or guests..."
                  className="h-10 rounded-full border-slate-800 bg-slate-900/80 pl-9 text-xs placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full border border-slate-800 bg-slate-900/80 text-slate-300"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full border border-slate-800 bg-slate-900/80 text-slate-300"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button className="ml-2 h-9 rounded-full bg-sky-600 px-4 text-xs font-semibold text-slate-950 hover:bg-sky-500">
                + New Walk-in
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto px-4 py-4 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}


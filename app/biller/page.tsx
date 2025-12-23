import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { isBiller } from "@/lib/auth";

/**
 * Biller dashboard page
 * Only accessible by users with biller role
 */
export default async function BillerPage() {
  // Get user from server-side auth
  const user = await getServerUser();

  if (!user || !isBiller(user)) {
    redirect("/login?redirect=/biller");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Biller Dashboard</h2>
        <p className="text-muted-foreground">Process transactions and manage bills.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Biller dashboard content */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-2">Active Tables</h3>
          <p className="text-sm text-muted-foreground">View and manage active tables</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-2">Orders</h3>
          <p className="text-sm text-muted-foreground">Manage current orders</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-2">Payment Processing</h3>
          <p className="text-sm text-muted-foreground">Process payments and settle bills</p>
        </div>
      </div>
    </div>
  );
}

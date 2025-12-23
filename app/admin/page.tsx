import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { isAdmin } from "@/lib/auth";

/**
 * Admin dashboard page
 * Only accessible by users with admin role
 */
export default async function AdminPage() {
  // Get user from server-side auth
  const user = await getServerUser();

  if (!user || !isAdmin(user)) {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Manage your POS system settings and users.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Admin dashboard content */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-2">System Settings</h3>
          <p className="text-sm text-muted-foreground">Configure POS system settings</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-2">User Management</h3>
          <p className="text-sm text-muted-foreground">Manage users and permissions</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-2">Reports</h3>
          <p className="text-sm text-muted-foreground">View system reports and analytics</p>
        </div>
      </div>
    </div>
  );
}

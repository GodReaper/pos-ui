import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { isAdmin } from "@/lib/auth";

/**
 * Admin layout - restricts access to admin role only
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user || !isAdmin(user)) {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}


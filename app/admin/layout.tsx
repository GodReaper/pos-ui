import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { isAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ToastContainer } from "@/components/toast-container";

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
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}

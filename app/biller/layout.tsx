import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { isBiller } from "@/lib/auth";

/**
 * Biller layout - restricts access to biller role only
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Biller Dashboard</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}


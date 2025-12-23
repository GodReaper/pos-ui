import Link from "next/link";

/**
 * Unauthorized access page
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">403</h1>
        <h2 className="text-2xl font-semibold">Unauthorized Access</h2>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium transition-colors hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}


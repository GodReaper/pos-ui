## Tech Context

- **Framework**: Next.js (App Router, TypeScript, React server & client components).
- **Styling**: Tailwind CSS with dark theme by default (`dark` class on `<html>`), plus shadcn-style UI primitives.
- **API**:
  - Base URL from `NEXT_PUBLIC_API_BASE`.
  - `apiClient` wrapper in `lib/api/client.ts` handles JSON, auth headers, and error normalization.
- **Domain Types**:
  - `Area` and `Table` types defined in `lib/api/types.ts` aligned with backend contracts documented in `API_CONTRACTS_SUMMARY.md`.
- **Auth**:
  - Server-side cookies via `lib/auth/server.ts`.
  - Client token handling via `lib/auth/token.ts` (not yet reviewed in this context).



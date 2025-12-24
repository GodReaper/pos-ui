## System Patterns

- **Architecture**: Next.js App Router with server layouts for auth gating and client components for interactive views.
- **Auth**:
  - Server-side `getServerUser` + `isBiller` / `isAdmin` for role-gated layouts and pages.
  - Client-side API calls use `apiClient` which attaches bearer tokens from storage.
- **API Access**:
  - REST APIs under `/admin/*` for configuration (areas, tables, users) and `/menu/admin/*` for menu.
  - `lib/api/types.ts` defines TypeScript contracts for backend resources such as `Area`, `Table`, and menu entities.
- **UI**:
  - Tailwind-based, with shadcn-style primitives in `components/ui/*` (e.g., `Button`, `Card`, `Badge`).
  - Admin CRUD screens are client components that call `apiClient` directly and manage local loading/empty states.



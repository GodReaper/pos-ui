## Active Context

- **Current Feature**: Biller main screen - table canvas (`/biller`).
- **Requirements**:
  - Show area selector (tabs/segmented control) sourced from `/admin/areas`.
  - Display a table grid per area with cards that show name, running total, and a status color mapping.
  - Poll the selected area's tables every 2 seconds using `/admin/areas/{areaId}/tables`.
  - Clicking a table opens an inline order screen (placeholder panel for now) without modals.
  - Use inline loading and empty states that fit the dark POS theme.
- **Assumptions**:
  - Table objects may be extended with a running total field from backend; UI should gracefully handle missing totals (fallback to `$0.00`).
  - Biller layout (`app/biller/layout.tsx`) already handles access control; `/biller/page.tsx` can be a client component focused on UI and polling.



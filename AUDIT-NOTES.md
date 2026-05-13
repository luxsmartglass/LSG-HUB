# LSG Hub — Audit Notes (Aurora Redesign, 2026-05-12)

## Needs User Verification / Cannot Verify Without Live Browser or DB

- **Gmail integration (GmailSettings.jsx):** The `window.google.accounts.oauth2` flow and `sendEmail` via Gmail API requires a valid `VITE_GMAIL_CLIENT_ID` env var and the OAuth consent screen to be configured in GCP. Cannot verify without the live OAuth flow. The `google` global is loaded from `https://accounts.google.com/gsi/client` dynamically — this causes a pre-existing `no-undef` ESLint error that is intentional.

- **Stripe integration (StripeSettings.jsx):** Marked "Coming Soon" — no real integration exists. No verification needed.

- **Supabase RLS on contacts insert:** If `+ New Contact` returns a "new row violates row-level security policy" error, run this SQL in Supabase → SQL Editor:
  ```sql
  create policy "Authenticated users can manage contacts"
    on contacts for all
    to authenticated
    using (true)
    with check (true);
  ```

- **`daily_tasks` table:** Not created until the user runs `db/2026-05-12-daily_tasks.sql` in the Supabase SQL editor. The TasksWidget shows an ErrorBanner with instructions if the table is missing.

- **Invoice PDF output (InvoicePDF.jsx) and Estimate PDF output (EstimatePDF.jsx):** These are printable document components left intentionally untouched (no token migration). Visual output should be verified in the browser print preview.

- **Realtime subscriptions:** `useDailyTasks`, `useCounts`, and `useActivityFeed` use Supabase realtime. Verify that replication is enabled for `daily_tasks`, `pipeline`, and `invoices` tables in Supabase → Database → Replication.

- **OAuth callback / `Splash.jsx`:** The splash screen shows after every login via the auth callback. Cannot verify the exact timing without logging in.

- **`amount_due` column in invoices:** The invoice record saves `amount_due` (balance after deposit) which is NOT in the documented schema. The schema has `deposit_amount` (added in this audit). If the real DB does not have `amount_due` as a column, Supabase will reject the insert with a 42703 error. Remove `amount_due` from `buildRecord()` in `InvoiceGenerator.jsx` if this happens.

- **`hst_enabled` column in invoices:** The invoice record saves `hst_enabled` which is NOT in the documented schema. Remove it from `buildRecord()` if the DB rejects it.

- **`client_email` in invoices:** The documented schema has `client_email` but the invoice form has no email input. The column would be NULL for all new invoices. Verify if this is intentional.

## Minor Issues Left in Place (and Why)

- **`Estimator.jsx` `react-hooks/immutability` errors (pre-existing):** `loadSettings` and `loadEstimate` are `async function` declarations used in a `useEffect` before their declaration position. This is legal in JS due to hoisting of function declarations, and the effect always fires after mount, so there is no actual runtime issue. Restructuring would require moving the functions before the effect or converting to `useCallback`, which risks changing behavior. Left as pre-existing.

- **`Topbar.jsx` unused `session` prop (pre-existing):** `session` is passed but not used in the Topbar component. Left as pre-existing.

- **`gmailApi.js` `no-undef` for `google` (pre-existing):** `google` is a global injected by the GIS script loaded dynamically. The lint rule doesn't know about it. Left as pre-existing.

- **`ContactTable.jsx` source badge hardcoded hex:** `SOURCE_COLORS` for Apollo/Manual/CSV Import use static hex values (`#1e40af`, etc.) that don't adapt to light/dark mode. Since these are brand-like colors for source types (similar to the pipeline stage colors in `pricingDatabase.js`), they are left as-is. The badges still look fine in both modes. Could be converted to `c.accent`/`c.highlight` variants in a future pass.

- **`Skeleton.jsx` shimmer gradient hardcoded hex:** The shimmer gradient uses Aurora palette hex values directly (mode-aware: different values for dark vs. light). Could use `c.surface`/`c.surfaceHover` but the shimmer needs slightly more contrast. Left as-is.

- **`InvoiceGenerator.jsx` `invoice_number` column:** The form generates an `invoice_number` field (e.g. `INV-2605-123`) but `invoice_number` is not in the documented schema. This likely exists as an extra column in the real table (from the original app). If it causes a 42703 error, add it to the schema or remove it from `buildRecord()`.

- **Exhaustive-deps warnings (7 warnings remaining):** `react-hooks/exhaustive-deps` warnings in `Splash.jsx`, `ImportCSV.jsx`, `Dashboard.jsx`, `StatsCards.jsx`, `Estimator.jsx`, `Settings.jsx`, and `useRealtime.js`. Most are pre-existing. Not fixing to avoid unintended behavior changes from adding deps that would cause unnecessary re-runs.

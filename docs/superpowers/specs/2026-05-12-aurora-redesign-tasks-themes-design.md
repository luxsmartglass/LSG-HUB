# LSG Hub — Aurora Redesign, Theme System & Daily Tasks — Design

**Date:** 2026-05-12
**Status:** Approved (pending written-spec review)
**Branch:** `feat/aurora-redesign`

## 1. Goals

1. **Daily Tasks feature** — a dashboard widget where the team adds tasks, sets urgency, checks them off; incomplete tasks carry over to the next day automatically. The widget is expandable into a full-screen view.
2. **Light/dark theme system** — a real theming layer (currently everything hardcodes hex), a fresh "Aurora" palette (violet + cyan), and a sun/moon toggle in the top-right that persists.
3. **UI overhaul** — make it feel like premium software: a small primitive component library, consistent spacing/typography, purposeful motion, a rebuilt dashboard.
4. **Bug fixes & audit** — fix "+ New Contact" (currently broken), code-audit every route and fix obvious breakage, delete dead boilerplate.

## 2. Non-Goals

- Rewriting Estimator's pricing logic, the PDF generators, or the Supabase data model beyond adding `daily_tasks`.
- Ground-up rewrites of Estimator / EstimateList / Pipeline / Invoices / Products / Settings — those get a **token-swap + polish + transitions + bug fixes** pass only.
- Per-user task scoping, task assignment to people, recurring tasks, reminders/notifications, subtasks. (YAGNI for v1.)
- Mobile-specific layouts beyond not breaking on smaller widths.

## 3. Theming Architecture (A1: React `ThemeProvider` + semantic tokens)

### 3.1 Token files
- **`src/theme/tokens.js`** — exports `light` and `dark` token objects with *semantic* keys (not raw color names):
  - Surfaces: `bg`, `surface`, `surfaceHover`, `surfaceElevated`, `border`, `borderStrong`
  - Text: `textPrimary`, `textSecondary`, `textMuted`, `textInverse`
  - Accent: `accent`, `accentHover`, `accentSoft` (rgba), `accentText` (text color to use *on* an accent fill), `highlight` (cyan), `highlightSoft`
  - Status: `success`, `successSoft`, `warning`, `warningSoft`, `danger`, `dangerSoft`
  - Effects: `shadow.sm`, `shadow.md`, `shadow.lg`, `overlay` (modal backdrop), `gradientHero` (aurora gradient string)
  - Scales: `radius.sm/md/lg/pill`, `space` (4/8/12/16/20/24/32), `font.heading`, `font.body`
- **`src/theme/ThemeProvider.jsx`** — React context. State: `mode` (`'light' | 'dark'`). Reads initial value from `localStorage.getItem('lsg_theme')`, then `window.matchMedia('(prefers-color-scheme: dark)')`, defaulting to `'dark'`. On change: writes `localStorage`, sets `document.documentElement.dataset.theme = mode` (so global CSS / scrollbars can react), and exposes `{ mode, c, toggle, setMode }` where `c` is the active token object.
- **`src/theme/useTheme.js`** (or named export from the provider) — `const { c, mode, toggle } = useTheme()`.
- `<ThemeProvider>` wraps the app in `App.jsx` (inside or around `ToastProvider`).

### 3.2 The "Aurora" palette

**Dark (default):**
```
bg              #0c0a12   (violet-tinted near-black)
surface         #15121d
surfaceHover    #1c1828
surfaceElevated #221d2e
border          rgba(255,255,255,0.09)
borderStrong    rgba(255,255,255,0.16)
textPrimary     #ece9f2
textSecondary   #b6b0c4
textMuted       #8b85a0
textInverse     #15121d
accent          #8b5cf6   accentHover #7c4ddb   accentSoft rgba(139,92,246,0.16)   accentText #ffffff
highlight       #22d3ee   highlightSoft rgba(34,211,238,0.14)
success #34d399  successSoft rgba(52,211,153,0.14)
warning #fbbf24  warningSoft rgba(251,191,36,0.14)
danger  #f87171  dangerSoft  rgba(248,113,113,0.14)
overlay         rgba(7,5,12,0.6)
shadow.sm  0 1px 3px rgba(0,0,0,0.4)
shadow.md  0 4px 16px rgba(0,0,0,0.35)
shadow.lg  0 12px 40px rgba(0,0,0,0.5)
gradientHero  linear-gradient(135deg, #1c1330 0%, #0c0a12 45%, #0e1b2e 100%)  + a soft violet/cyan radial bloom
```

**Light:**
```
bg              #f7f6fb
surface         #ffffff
surfaceHover    #f3f1f9
surfaceElevated #ffffff
border          #e6e4ee
borderStrong    #d4d1e0
textPrimary     #1a1726
textSecondary   #4a4658
textMuted       #6b6680
textInverse     #ffffff
accent          #7c3aed   accentHover #6d28d9   accentSoft rgba(124,58,237,0.10)   accentText #ffffff
highlight       #0891b2   highlightSoft rgba(8,145,178,0.10)
success #059669  successSoft rgba(5,150,105,0.10)
warning #d97706  warningSoft rgba(217,119,6,0.10)
danger  #dc2626  dangerSoft  rgba(220,38,38,0.10)
overlay         rgba(26,23,38,0.4)
shadow.sm  0 1px 2px rgba(20,16,32,0.06)
shadow.md  0 4px 16px rgba(20,16,32,0.08)
shadow.lg  0 12px 40px rgba(20,16,32,0.12)
gradientHero  linear-gradient(135deg, #ede9fe 0%, #f7f6fb 50%, #e0f2fe 100%)
```

### 3.2a Typography — heavier, more presence

The current type is too thin: `DM Sans` is loaded with a 300 (Light) weight and labels sit at 400–600. We go bolder and more deliberate.

- **Display / hero / page titles:** keep **Playfair Display** but use **700** (and 600 for sub-display). Big, confident serif moments only — hero greeting, page H1s, modal titles, big numbers can stay serif or move to the UI font (decided per-component for legibility at size).
- **UI / body font:** switch from `DM Sans` to **Plus Jakarta Sans** (Google Fonts) — a geometric humanist sans with noticeably more weight presence and character than DM Sans, reads premium and modern. Load weights **500, 600, 700, 800** (drop 300/400 entirely). Agent has free rein to substitute an equivalent if it tests better (e.g. `Inter` 500–800, or a Fontshare face like `General Sans` / `Satoshi` loaded via their CDN) — the *requirement* is "no thin weights, strong but not heavy."
- **Weight scale (tokens, applied everywhere):** body text **500** (never below); secondary/meta **500**; buttons & interactive labels **600–700**; section/eyebrow labels **700**, uppercase, `letterSpacing 0.06–0.08em`; card/stat headings **700**; hero & H1 **700–800** (Playfair 700).
- **Sizing/rhythm:** establish a small type scale in tokens (`text.xs 11 / sm 12.5 / base 14 / md 15 / lg 18 / xl 22 / 2xl 28 / display 34–44`) and a consistent line-height set; stat numbers get tabular figures (`font-variant-numeric: tabular-nums`).
- Antialiasing on (`-webkit-font-smoothing: antialiased`), `text-rendering: optimizeLegibility`.

These belong in `tokens.js` (`font.heading`, `font.body`, `weight.*`, `text.*`, `leading.*`) so every component pulls them rather than hardcoding.

### 3.3 Migration of existing hardcoded colors
- Replace literal hex in inline styles with `c.*` across components. Where rgba-with-alpha was used (`rgba(255,255,255,0.08)` etc.), use the matching semantic token (`c.border`, `c.surfaceHover`, …) so it flips correctly in light mode.
- Add `transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease'` to top-level page/card containers so the toggle animates. Guard under `@media (prefers-reduced-motion: reduce)` in global CSS.
- `Layout` `<main>` background, `Sidebar`, `Topbar`, `body` background all read from the token (Layout/Sidebar/Topbar via `useTheme`; `body`/scrollbar via `[data-theme]` rules in `globals.css`).

### 3.4 Theme toggle UI
- A compact pill `IconButton` in `Topbar`'s right cluster (so it's top-right on **every** screen, including home). Sun icon in light mode, moon in dark; icon crossfades + a subtle rotate on click. `aria-label="Toggle theme"`, keyboard-focusable.

## 4. UI Overhaul (scope C)

### 4.1 Primitive component library — `src/components/ui/`
All consume `useTheme()`. New/standardized:
- `Button` — variants `primary | secondary | ghost | danger | subtle`; sizes `sm | md | lg`; `loading` (spinner, disabled), `icon` (leading), `fullWidth`; hover + active (press-down) feedback.
- `Card` / `Panel` — `surface` bg, `border`, `radius.lg`, optional `hover` lift, optional header slot.
- `Input`, `Textarea`, `Select` — themed; focus ring uses `accent`; consistent sizing; `error` state.
- `Modal` — fixed overlay (`c.overlay`, `backdrop-filter: blur(2px)`), centered panel with `scaleIn` animation, ESC + backdrop-click to close, focus trap, body-scroll lock, optional `size` (`sm|md|lg|full`).
- `Badge` / `Pill` — `tone` = `neutral|accent|success|warning|danger|highlight`, soft or solid.
- `IconButton`, `Tabs`, `Tooltip`, `Skeleton` (themed shimmer), `SegmentedControl` (used by the urgency picker), `CommandPalette` (⌘K — see §8).
- Existing `ui/` files (`Toast`, `Spinner`, `LoadingScreen`, `ErrorBanner`, `EmptyState`) — restyled to tokens, kept; `Toast` gains an optional `action` (used for "Undo" — see §8).

### 4.2 Motion
- Route-change transition: a wrapper around the routed content (`fadeIn` + small `translateY`) keyed on `location.pathname`.
- Staggered entrance for card grids (reuse `fadeUp` with incremental delays — already a pattern).
- Hover lifts on cards/buttons, button press feedback, animated stat numbers (exists), themed toasts, modal `scaleIn`, sidebar active-item left-bar slide.
- Global `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`.

### 4.3 Chrome
- **Sidebar** — token-themed; active item has accent left-bar + soft bg + smooth transition; hover state from `surfaceHover`.
- **Topbar** — token-themed; right cluster = `[ sync indicator ] [ theme toggle ] [ + New Estimate ]`.
- Better visible focus rings (`outline: 2px solid c.accent; outline-offset: 2px`) on interactive elements; respect `:focus-visible`.

### 4.4 Dashboard rebuild — `src/components/dashboard/` (the "first page")
**Every section on the home screen gets the full premium-interactive treatment** — no half-themed leftovers. Each card uses the `Card` primitive (token bg/border/shadow, `radius.lg`), staggered `fadeUp` on mount, a hover lift, and the heavier type scale; interactive elements have visible focus rings and press feedback.

- **Hero** — greeting + live clock + (optionally) a one-line "here's your day" summary (open tasks, active deals). Aurora gradient bg (token `gradientHero`) with a soft violet→cyan radial bloom; large Playfair 700 greeting; tabular clock. Subtle parallax/bloom shift on mouse-move (reduced-motion: off). The theme toggle also surfaces in the Topbar above it (works on every page).
- **Daily Tasks widget** (section 5) — first-class citizen, prominent placement.
- **Stat cards** — `Card` grid; each: eyebrow label (700 uppercase), animated value (tabular figures, Playfair or heavy sans at size), and a trend chip (▲/▼ % vs. a cheap prior-period heuristic where one exists; otherwise a plain count badge — never fabricate a trend). Hover lift + accent ring; clicking a card deep-links to the relevant page.
- **Charts** — `RevenueChart` (recharts area) and `FunnelChart` fully restyled to read tokens (axis/grid/tooltip/gradient from `c.*`, in both light & dark); animated draw-in; the daily-quote card kept and re-themed (not left on the old cream).
- **Quick actions** — `Card`/`Button` primitives, icon chips tinted from accent/highlight (not the old pastels), hover slide + accent border.
- **Recent activity** — currently "recent estimates"; upgrade to a small **activity feed** (recent estimates created / deals moved / invoices paid / contacts added — cheap union of recent rows across tables) rendered as a clean timeline with type icons and relative timestamps. Falls back to just recent estimates if the union proves expensive.
- Removes the unused stub files `dashboard/QuotesChart.jsx` and `dashboard/ClientTypeChart.jsx`.
- Responsive: grid collapses gracefully on narrow widths; nothing overflows.

### 4.5 Other pages
Estimator, EstimateList, Pipeline (+ AddDeal/Loss modals, DealCard, WarmHoldColumn), Invoices (+ Generator/List/PDF — PDF styling unchanged, only the page chrome), Products (+ ProductCatalog, MarginCalculator), Settings (+ Gmail/Stripe sub-panels), Contacts/ContactTable/ContactDetail/ImportCSV, ARIA chat, Login, Splash:
- Swap hardcoded colors → tokens; adopt `Button`/`Card`/`Modal`/`Input` primitives where it's low-risk; add entrance/hover transitions; fix bugs found in the audit.
- **Estimator pricing math, zone logic, transformer selection, and the PDF generators stay functionally untouched.**

## 5. Daily Tasks Feature

### 5.1 Data model — new Supabase table `daily_tasks`
SQL (delivered for the user to run in the Supabase SQL editor — agent cannot run migrations against the DB):
```sql
create table if not exists public.daily_tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  urgency      text not null default 'medium' check (urgency in ('low','medium','high')),
  due_date     date not null default current_date,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.daily_tasks enable row level security;
-- Match the app's existing access pattern (authenticated users get full access):
create policy "authenticated full access" on public.daily_tasks
  for all to authenticated using (true) with check (true);
-- Realtime:
alter publication supabase_realtime add table public.daily_tasks;
```
> Before finalizing the policy text, the agent will check how RLS/policies are defined on existing tables (`contacts`, `pipeline`, etc.) and mirror that exactly. If those tables actually use the `anon`/`service` role or no RLS, this SQL is adjusted to match.

### 5.2 Carryover semantics (no cron job)
- **"Today" list** = rows where `completed = false AND due_date <= current_date` **plus** rows where `completed = true AND completed_at::date = current_date` (today's checked-off items, shown struck through at the bottom).
- An unfinished task created on a prior day still satisfies `due_date <= current_date`, so it **automatically reappears each day** with no scheduled job. It renders with a small `↻ Nd` "carried over N days" badge (`N = current_date - due_date`).
- Checking a task → `completed = true, completed_at = now()`. Unchecking → `completed = false, completed_at = null`. A task completed on a past day disappears from "Today" (it lives on in the expanded view's history).
- `due_date` is **not** auto-bumped — the original date is preserved so the carried-over badge is meaningful.

### 5.3 Widget UX (on the dashboard)
- Header: "Today's Tasks" + an open-count badge + an expand affordance (clicking the header or an expand icon opens the full view).
- Add row at top: `Input` ("Add a task…") + a `SegmentedControl` urgency picker (Low / Medium / High, shown as three dots colored `textMuted` / `warning` / `danger`); Enter or a + button to add (`due_date` defaults to today).
- Task rows: checkbox (animated check), title (inline-editable on click), urgency shown as a colored left border (`textMuted`/`warning`/`danger`), `↻ Nd` badge if carried over, hover-revealed delete (×). Completed-today rows: checked, struck through, dimmed, sorted to the bottom.
- Sort: incomplete first — by urgency (high→low) then oldest `due_date`; then completed-today by `completed_at` desc.
- Shows up to ~5 incomplete rows + a "+N more" line if there are more; the rest live in the expanded view.
- High-urgency **overdue** (carried-over) tasks: subtle `pulse` on the left border.
- Empty state: a friendly `EmptyState` ("Nothing on the list — add your first task").

### 5.4 Expanded view — `Modal size="full"` "Tasks"
- All open tasks (same sort), with an urgency filter (`Tabs` or `SegmentedControl`: All / High / Medium / Low).
- Each row additionally lets you set a future `due_date` (a date input) — so you can schedule a task for later (it won't show in "Today" until then).
- A "Completed" section: last 30 days of completed tasks, grouped by `completed_at::date`, newest first.
- Add row identical to the widget's.
- No new sidebar route — this is a modal opened from the dashboard widget.

### 5.5 Code structure
- `src/components/dashboard/tasks/TasksWidget.jsx` — the dashboard panel.
- `src/components/dashboard/tasks/TasksModal.jsx` — the expanded full view.
- `src/components/dashboard/tasks/TaskRow.jsx` — shared row (checkbox / title / urgency / badge / delete / optional date picker).
- `src/components/dashboard/tasks/UrgencyPicker.jsx` — the segmented urgency control.
- `src/hooks/useDailyTasks.js` — loads tasks, exposes `{ tasks, loading, error, addTask, toggleTask, updateTask, deleteTask, reload }`, and subscribes to realtime via the existing `useRealtime` hook. All Supabase calls destructure `{ data, error }` and surface errors via toast.
- Shared across the team (no `user_id`), consistent with `contacts`/`pipeline`.

## 6. Bug Fixes & Audit (scope E)

### 6.1 Contact "+ New Contact"
- **Symptom:** clicking "+ New Contact" doesn't work. Current code inserts a placeholder `{name:'New Contact', source:'Manual'}` then `.select().single()`; it toasts `e.message` on failure.
- **Fix:**
  1. Change "+ New Contact" to open the **`ContactDetail` panel in "create" mode** — a real form (name / company / role / email / phone / source / tags), inserting only on Save. No more junk rows.
  2. Harden the insert: no `.single()` (RLS can hide the returned row → `.single()` throws); use `.select()` and read `data?.[0]`; on `error`, toast `error.message` (the real reason).
  3. While auditing, inspect the actual error / RLS policies on `contacts`. If inserts are blocked by RLS, deliver the corrective policy SQL alongside the `daily_tasks` SQL.

### 6.2 Full audit pass
Read each route's components and check: every handler is wired to a real function; every Supabase call destructures and checks `{ data, error }`; column names match the documented schema (`estimates` / `invoices` / `pipeline` / `contacts` / `settings`); no crash on empty data; navigation targets exist. Routes: Dashboard, Estimator (+ ZoneBuilder / TransformerSelector / QuoteSidebar / EstimatePDF), EstimateList, Pipeline (+ KanbanBoard / DealCard / WarmHoldColumn / loss modal), Invoices (+ InvoiceGenerator / InvoiceList / InvoicePDF), Products (+ ProductCatalog / MarginCalculator), Settings (+ GmailSettings / StripeSettings), Contacts (+ ContactTable / ContactDetail / ImportCSV), ARIA (Aria / AriaChat), Splash, Login, Layout / Sidebar / Topbar.
- Fix obvious breakage in place.
- For anything that can't be verified without the live browser / live DB, list it in the PR description / a follow-up note for the user to confirm.

### 6.3 Cleanup
- Delete the leftover Vite-template boilerplate: `src/index.css` (purple `--accent`, `#root { width: 1126px }`) and `src/App.css` (`.counter`, `.hero` demo styles). Replace `index.css`'s role with a minimal reset + the `[data-theme]` body/scrollbar rules; keep `globals.css` for fonts, Tailwind directives, keyframes, and the reduced-motion guard. Update `main.jsx` imports accordingly.
- Remove the unused `dashboard/QuotesChart.jsx` and `dashboard/ClientTypeChart.jsx` stubs.

## 7. Data Flow, Errors, Testing

- **Data flow** unchanged in shape: components → `src/lib/supabase` client → Postgres; `daily_tasks` follows the same `{ data, error }` pattern; realtime via `src/hooks/useRealtime`.
- **Errors:** new queries check `error` and toast the message; the Tasks widget has its own `ErrorBanner` with retry; theme init falls back `localStorage` → `prefers-color-scheme` → `dark`; `Modal` and theme code degrade gracefully if `localStorage`/`matchMedia` are unavailable.
- **Testing:**
  - `npm run build` must stay green at every commit (CI proxy).
  - Agent does a manual code-trace of each touched path.
  - User does the live click-through against the Vercel deploy using a checklist the agent provides: login → toggle theme (both modes, both persist on reload) → add a task / set urgency / check it off / leave one overnight to confirm carryover / expand the Tasks modal / set a future due date → add a contact via the new form → spot-check every page renders & primary actions work.
- **Accessibility:** focus-visible rings, `aria-label`s on icon buttons, `prefers-reduced-motion` honored, modal focus trap + ESC, color contrast checked for both palettes.

## 8. Recommended Add-ons (beyond the original ask)

Things that would meaningfully raise the "expensive software" feeling. Marked **[in]** = proposed to fold into this push (cheap, high signal), **[later]** = worth a separate round. Final include/exclude is the user's call.

- **[in] Command palette (⌘K / Ctrl-K)** — fuzzy "jump to page" + quick actions (new estimate / new contact / new task / new deal / new invoice / toggle theme). One small `CommandPalette` component + a global key listener. This single feature does the most to make the app feel pro.
- **[in] Global "+" quick-create** in the Topbar — same actions as ⌘K, mouse-reachable from anywhere; new task is creatable without going to the dashboard.
- **[in] Undo toasts on destructive actions** — deleting a contact / task / deal shows a toast with "Undo" for ~6s before the delete actually commits (or soft-delete + restore). Stops accidental data loss, feels polished.
- **[in] "All clear" micro-celebration** — checking off the last open task for the day fires a small, tasteful confetti burst (reuse `canvas-confetti`, already a dep). Subtle, dismissible, reduced-motion: off.
- **[in] Themed empty-state illustrations** — replace bare "no data" text with simple inline SVG illustrations tinted from the palette (used in tasks, contacts, estimates, pipeline, invoices).
- **[in] Sidebar badges** — small count chips: open/overdue task count near "Home", unpaid invoice count near "Invoices", active-deal count near "Pipeline". Live via realtime.
- **[in] Theme = light / dark / system** — the toggle cycles or offers a 3-way; "system" follows `prefers-color-scheme`. Trivial once the provider exists.
- **[later] Real activity feed page** — a dedicated `/activity` timeline of everything that happened (created/updated/paid/moved/deleted), filterable. (The dashboard gets a *mini* version now per §4.4.)
- **[later] Shareable client quote link** — a read-only public page for an estimate (`/q/:token`) the team can send to a client, branded, no login. High-value for a quoting business but a real feature with its own spec.
- **[later] PWA / installable + offline shell** — useful for using the hub on a phone/tablet in the field.
- **[later] Drag-to-reorder & pin tasks**, **per-page persisted filters/sort**, **keyboard shortcuts cheat-sheet (`?`)** — nice-to-haves.

## 9. Delivery Plan

One branch, `feat/aurora-redesign`, committed in reviewable chunks (rough order — `writing-plans` will produce the detailed step list):
1. Theme tokens (colors + **typography: fonts, weights, type scale**) + `ThemeProvider` + `useTheme` + Topbar theme toggle (light/dark/system); wire `body`/`Layout`/`Sidebar`/`Topbar` to tokens; load Plus Jakarta Sans; reduced-motion guard; remove `index.css`/`App.css` boilerplate.
2. `ui/` primitives (`Button`, `Card`, `Input`/`Select`/`Textarea`, `Modal`, `Badge`, `IconButton`, `Tabs`, `Tooltip`, `Skeleton`, `SegmentedControl`, `CommandPalette`); restyle existing `ui/` files; wire ⌘K + Topbar "+" quick-create; undo-toast helper.
3. Dashboard rebuild — **all sections** (hero w/ bloom, daily-tasks placement, stat cards w/ trend chips & deep-links, charts retheme + draw-in, quick actions, mini activity feed); remove stub chart files; sidebar badges.
4. Daily Tasks: `daily_tasks` SQL handed to user; `useDailyTasks` hook (realtime); `TasksWidget` + `TaskRow` + `UrgencyPicker`; "all clear" celebration; wire into dashboard.
5. Daily Tasks expanded view: `TasksModal` (urgency filters + 30-day history + future due dates).
6. Per-page token-swap + polish + primitive adoption + entrance/hover motion + empty-state illustrations; contact "+ New Contact" → `ContactDetail` create-mode form + hardened insert.
7. Audit fixes; final cleanup; build green; PR description with the manual-test checklist and any "needs-user-verification" items.

Then the user reviews and we merge to `main` (Vercel auto-deploys).

## 10. Open Items / Assumptions

- **RLS:** assumed `authenticated` role gets full access on app tables (per the original handoff doc). To be verified during the audit; the `daily_tasks` policy and any contacts-RLS fix will mirror whatever the existing tables actually use.
- **Tasks are team-shared** (no per-user scoping). If single-user-per-task is wanted later, add a `user_id` column + policy — out of scope now.
- **Trend indicators on stat cards:** if there's no meaningful prior-period data available cheaply, those cards show plain counts rather than fabricated trends.
- Light-mode review of charts/PDF-adjacent screens may surface contrast tweaks; handled during implementation.

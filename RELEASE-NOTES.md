# LSG Hub — Aurora Redesign Release Notes (2026-05-12)

## What's New

- **Aurora Theme System** — Light/dark/system toggle (sun/moon in topbar). Persists to `localStorage`. Entire app uses semantic tokens from `src/theme/tokens.js`.
- **Daily Tasks Widget** — Dashboard task list with urgency levels (low/medium/high/urgent), carryover for incomplete tasks, "all clear" confetti, and an expandable full modal with 30-day history.
- **UI Overhaul** — New primitive library (`Button`, `Card`, `Input`, `Modal`, `Badge`, `Tabs`, `Tooltip`, `Skeleton`, `EmptyState`, `CommandPalette`). Bolder typography (Plus Jakarta Sans), entrance animations.
- **⌘K Command Palette** — Press `Cmd+K` / `Ctrl+K` to navigate or quick-create anything.
- **Quick Create (+)** — Topbar button for new estimates; command palette for contacts, deals, invoices.
- **Sidebar Count Badges** — Live counts for open tasks, unpaid invoices, active deals.
- **Fixed: + New Contact** — Previously broken; now opens a proper create panel that writes to the DB.
- **Rethemed Pages** — Contacts, Estimator, Pipeline, Invoices, Products, Settings, Aria, Login, Splash all use Aurora tokens.

## Prerequisites

1. **Run `db/2026-05-12-daily_tasks.sql`** in Supabase → SQL Editor before using the tasks widget.
2. Supabase environment variables must be set (see README.md).

## Manual Test Checklist

Work through these steps after deploying or running `npm run dev`:

### Authentication
- [ ] Navigate to the app — redirects to login if not signed in
- [ ] Sign in with Google OAuth — lands on dashboard (or splash screen on first login)
- [ ] Splash screen plays then shows dashboard

### Theme Toggle
- [ ] Click the sun/moon icon in the top-right — cycles Light → Dark → System
- [ ] Reload the page — theme persists (localStorage)
- [ ] Set to "System" — matches OS dark/light preference
- [ ] Toggle between light and dark — all pages look correct (no invisible text or broken layouts)

### Command Palette
- [ ] Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) — palette opens
- [ ] Type "contact" — shows navigate to Contacts and New Contact
- [ ] Select "New Contact" — opens Contacts page with the create panel open
- [ ] Press Escape — closes palette

### Quick Create (Topbar "+")
- [ ] The "New Estimate" button in the topbar navigates to `/estimator`

### Daily Tasks
- [ ] Add a task with default urgency — appears in widget
- [ ] Set urgency (click urgency dot) — color indicator changes
- [ ] Check the task off — moves to "Done Today" section
- [ ] Uncheck — moves back to open
- [ ] Delete a task — removed immediately
- [ ] Add a task with a future due date (use the calendar in the Tasks modal) — appears as scheduled
- [ ] Leave some tasks unchecked overnight — they should appear the next day with a "carried over N days" indicator
- [ ] Complete all tasks — "All clear" confetti fires
- [ ] Click the expand icon — full TasksModal opens
- [ ] In modal: view "History" tab for 30-day completed tasks

### Contacts
- [ ] Click "+ New Contact" — create panel slides in
- [ ] Fill in name, email, phone — click Save
- [ ] Contact appears in the table — no junk row (name is populated)
- [ ] Click a contact — detail panel opens, inline editing works
- [ ] Delete a contact — removed from list

### Pipeline
- [ ] Navigate to Pipeline — kanban board loads
- [ ] Drag a deal to a different stage — stage updates
- [ ] Click "+ Add Deal" or navigate to `/pipeline?new=1` — add modal opens
- [ ] Add a deal — appears in the correct stage column

### Estimator
- [ ] Navigate to New Estimate
- [ ] Fill in client name, add a zone, proceed through steps
- [ ] Save — estimate saved, URL updates to `/estimator/:id`
- [ ] Navigate to All Estimates — estimate appears in list
- [ ] Click an estimate — loads in Estimator edit mode

### Invoices
- [ ] Navigate to Invoices
- [ ] Click "+ New Invoice" or navigate to `/invoices?new=1` — generator opens
- [ ] Fill in client name, line items — save draft
- [ ] Invoice appears in list
- [ ] Mark as paid — status updates

### Products
- [ ] Navigate to Products — film, transformer, and controller cards load with costs
- [ ] Margin Calculator tab — input sqm, zone type; calculated margins update live

### Settings
- [ ] Navigate to Settings — current tax rate and other settings load
- [ ] Save a setting — verify it persists on reload

### Build Verification
- [ ] `npm run build` — completes with `✓ built` (the "chunks larger than 500 kB" warning is expected)
- [ ] `npm run test` — 10 tests pass
- [ ] `npm run lint` — 4 pre-existing errors, 7 warnings (no new errors)

## Known Limitations

See `AUDIT-NOTES.md` for the full list of items that require live DB/browser verification.

---

# LSG Hub — Mobile & Motion (2026-05-13)

## What Shipped

- **Responsive chrome** — Off-canvas nav drawer with slide-in animation + backdrop dismiss on mobile (≤768px). Hamburger in the Topbar (left, mobile-only). Sidebar wider in drawer mode (`min(280px, 82vw)`), nav rows ≥44px, close button.
- **`useMediaQuery` / `useIsMobile` / `useIsNarrow` hooks** — SSR-safe, `matchMedia`-backed, unit-tested.
- **`framer-motion`** — Added as a dependency (~30 KB gz). Shared spring constants + `useReducedMotion` re-export in `src/lib/motion.js`.
- **Page transitions** — `<PageTransition>` wraps routed content; new pages fade+slide up on each navigation (reduced-motion-safe).
- **Spring modals** — `Modal` slides up from bottom on mobile (full-screen sheet, `borderRadius: 0`), scales in on desktop. Framer-motion spring entrance, reduced-motion gate. `ContactDetail` panel goes full-width on mobile.
- **`CommandPalette`** — Full-width on mobile, tighter `paddingTop`.
- **`Button` click glow** — Accent `box-shadow` pulse on mousedown (250ms); reduced-motion skips it.
- **`IconButton`** — `scale(1.08)` on hover, `scale(0.92)` on press; default size ≥40px on mobile (floor for tap comfort).
- **`Toast`** — Spring entrance (`framer-motion`), layout reflow when one dismisses; full reduced-motion path.
- **Dashboard responsive** — Stats grid `3→2→1` (768px/520px); charts and quick-actions/activity stack on mobile; hero font/padding scales down. `AnimatedNumber` promoted to `src/components/ui/` and used for hero counts.
- **List enter/exit** — Tasks widget + modal: add slides in, delete collapses out (`AnimatePresence`). Activity feed: staggered fade/slide on load. Contacts list: new/deleted contacts animate.
- **Tables → cards (≤520px)** — Contacts, Estimates, Invoices lists switch to stacked `<Card>` layout below 520px; tables have `.h-scroll` above.
- **Estimator mobile** — Stacks form + quote sidebar on mobile (collapsible summary section). Step grids single-column. `TransformerSelector` single-column. Step nav full-width.
- **Pipeline Kanban** — Touch-scroll (`-webkit-overflow-scrolling: touch`, `.h-scroll`), comfortable column `minWidth`.
- **Products / Settings / ARIA / Login** — Single-column layouts, form field pairs stack, chat fills width, login card capped.
- **`globals.css`** — `.h-scroll`, `.only-mobile`, `.only-desktop`, `slideInLeft`, `slideUp` keyframes; `@media (prefers-reduced-motion)` guard covers all CSS animations.

## Prerequisite SQL (unrelated to mobile/motion work)

Run **`db/2026-05-13-contacts-schema-fix.sql`** in the Supabase SQL Editor to add the `name` column to the `contacts` table. Without this, "+ New Contact" will silently fail on a fresh DB.

## Manual Test Checklist

Use Chrome/Edge DevTools → Device toolbar. Test at **390px** (iPhone 14 simulation) and **768px** (iPad portrait).

### Mobile — Navigation
- [ ] Sidebar is hidden; a hamburger icon appears at the top-left
- [ ] Tap hamburger → drawer slides in from the left with a backdrop
- [ ] Tap any nav link → drawer closes; the page loads
- [ ] Tap the backdrop → drawer closes
- [ ] Tap the X button inside the drawer → drawer closes

### Mobile — Every Page (spot-check each in DevTools at 390px)
- [ ] Dashboard — hero counts animate up; stat cards are 2-up; charts stack
- [ ] Contacts — list renders as stacked cards (not a table); search bar is full-width
- [ ] Estimator — wizard is single-column; step fields single-column; quote summary is collapsible below the form
- [ ] All Estimates — list is stacked cards; "New Estimate" header wraps
- [ ] Pipeline — Kanban board scrolls horizontally; deal cards are tappable (open popover/edit); columns feel comfortably wide
- [ ] Invoices — list is stacked cards; "+ New Invoice" modal is full-screen
- [ ] Products — catalog scrolls horizontally or wraps; Margin Calculator is single-column
- [ ] Settings — all form sections are single-column
- [ ] ARIA — chat fills width; input bar is comfortable
- [ ] Login — card is centered and not cramped
- [ ] **No page has horizontal overflow** (no scrollbar on the `<body>`, no content clipped outside the viewport)

### Mobile — Modals & Panels
- [ ] Open any `Modal` (New Contact, New Deal, New Invoice, Import CSV, etc.) → full-screen sheet that slides up from the bottom
- [ ] Open `ContactDetail` (tap a contact) → slides in full-width from the right
- [ ] Press `Cmd+K` / `Ctrl+K` → command palette is full-width

### Mobile — Tap Targets
- [ ] `IconButton`s (delete icons, theme toggle, hamburger) are ≥40px and easy to tap
- [ ] Task list delete buttons are always visible (reduced opacity) on mobile — not hidden behind hover
- [ ] Nav links have ≥44px vertical tap height in the drawer

### Desktop — Regression Check
- [ ] Sidebar is visible and in-flow; no hamburger; layout unchanged at ≥769px
- [ ] Modals scale in (not slide up); `ContactDetail` is 420px wide
- [ ] All pages look correct; stat cards are 3-up

### Motion — Interactions
- [ ] Route change (tap any nav link) → new page fades + slides up slightly
- [ ] Click a primary `Button` → brief accent glow (box-shadow pulse)
- [ ] Hover an `IconButton` → slightly larger; press → slightly smaller
- [ ] Add a task → row slides in at the top; delete → collapses out
- [ ] Dashboard hero counts count up from 0 on first load
- [ ] Trigger 2–3 toasts → they spring in; dismissing one causes the rest to smoothly reflow upward
- [ ] Add a contact and delete one → animate in / collapse out
- [ ] Complete all tasks → "all clear" confetti fires
- [ ] Move a deal to "Won" on the Pipeline → confetti fires

### Reduced Motion
- [ ] DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion: reduce"
- [ ] Route transitions, modal spring, toast spring, task list animations — all off
- [ ] App remains fully functional (no broken flows)
- [ ] Confetti (tasks all-clear, pipeline won) does not fire

### Build Verification
- [ ] `npm run build` — `✓ built` (the "chunks > 500 kB" warning is pre-existing and expected; bundle is ~376 KB gz)
- [ ] `npm run test` — 14 tests pass (includes `useMediaQuery` unit test)
- [ ] `npm run lint` — 10 problems (4 pre-existing errors in `Estimator.jsx` ×2, `gmailApi.js`, `useRealtime.js`; 6 warnings) — no new errors

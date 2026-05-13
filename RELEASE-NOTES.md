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

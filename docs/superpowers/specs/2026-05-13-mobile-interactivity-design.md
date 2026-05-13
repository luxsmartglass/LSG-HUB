# LSG Hub — Mobile Responsiveness + Motion/Micro-interactions — Design

**Date:** 2026-05-13
**Status:** Approved (pending written-spec review)
**Branch:** `feat/mobile-interactivity` (off `main`, which already has the Aurora redesign merged)

## 1. Goals

1. **Fully usable on phones** — the whole app reflows for small screens: an off-canvas nav drawer, stacking layouts, card-style mobile lists, full-width modals/panels, comfortable tap targets. It should look intentional on a phone, not a squished desktop.
2. **Motion & micro-interactions** — page transitions, hover/press feedback everywhere, list enter/exit animations, animated number counters, springy modals — the polish that makes it feel like premium software. All behind `prefers-reduced-motion`.

## 2. Non-Goals

- Drag-to-reorder anything (the user explicitly chose motion polish over drag features). The Pipeline Kanban keeps its existing `react-beautiful-dnd`; we don't add new drag.
- A mobile-first overhaul (bottom tab bar, swipe gestures, rebuilding flows for touch). We make the existing screens responsive, not redesigned-for-mobile.
- Changing any data logic, the Supabase schema, the PDF documents, or the Splash intro flow.
- Reworking the desktop layout — desktop stays as it is now; this adds the mobile/tablet path and layers motion on top.

## 3. Responsive Architecture (A1)

The codebase is 100% inline `style={{}}` objects. Media queries don't reach inline styles, so:

- **`src/hooks/useMediaQuery.js`** — `useMediaQuery(query)` returns a boolean, subscribing to `window.matchMedia(query)` changes (with SSR-safe fallback). Plus convenience exports: `useIsMobile()` = `useMediaQuery('(max-width: 768px)')`, `useIsNarrow()` = `useMediaQuery('(max-width: 520px)')`. (Optionally `useBreakpoint()` → `'mobile' | 'tablet' | 'desktop'` if a component needs three-way; only add if used.)
- **Per-component conditional styles** — components that reflow read `const isMobile = useIsMobile()` and branch their style objects (e.g. `gridTemplateColumns: isMobile ? '1fr' : '1fr 380px'`, `padding: isMobile ? 16 : 28`, `width: isMobile ? '100%' : 420`). Prefer computing a small `m` (mobile) overrides object and spreading it: `style={{ ...base, ...(isMobile ? mobile : {}) }}`.
- **A few pure-layout CSS classes** in `globals.css` with `@media (max-width: 768px)` for things that are awkward as inline conditionals (e.g. a `.dash-grid` / `.dash-grid-2` helper). Keep this minimal — the JS-hook path is the default.
- **Breakpoints:** `768px` = the main "mobile/tablet" cutoff (drawer, stacked layouts, full-width panels). `520px` = "narrow phone" extra tweaks (tables → cards, stat cards 3-up→2-up→1-up, tighter spacing). No other breakpoints.
- Resize re-renders are fine at this app's scale; `useMediaQuery` only re-renders the components that call it.

## 4. Mobile Layout Changes

### 4.1 Chrome — `Layout`, `Sidebar`, `Topbar`
- **`Layout`** owns a `drawerOpen` state (a `useState`, lifted here since both `Sidebar` and `Topbar` need it). On `≤768px`: the `<aside>`/`<div>` for `Sidebar` is rendered as a fixed off-canvas panel (`position: fixed; left: 0; transform: translateX(-100%)` when closed, `translateX(0)` when open, `transition: transform .25s`) plus a backdrop (`position: fixed; inset: 0; background: c.overlay`) that's only present when open and closes the drawer on click. On `>768px` the sidebar is the normal in-flow 220px column (unchanged). `<main>` padding: `isMobile ? 16 : 28`.
- **`Sidebar`** — accepts `open` + `onNavigate` (called when a nav link is tapped, so the drawer closes). On mobile it's wider-ish (e.g. `min(280px, 82vw)`) and has its own close `IconButton` at the top. Nav links get more vertical padding on mobile (≥44px tap height).
- **`Topbar`** — on mobile: a hamburger `IconButton` appears on the LEFT (opens the drawer); the page title shrinks (or is hidden if too tight); the right cluster condenses — keep the theme toggle and the `+` quick-create, but "New Estimate" becomes an icon-only `IconButton` (or drop it on mobile, since it's also a command-palette command and a quick-action). Topbar height/padding shrink slightly. The hamburger is hidden on desktop.

### 4.2 Dashboard
- Hero: `padding` and the greeting `fontSize` scale down on mobile; the parallax bloom stays (cheap, reduced-motion-guarded). The day-summary line wraps.
- `StatsCards`: `gridTemplateColumns` `repeat(3,1fr)` → `repeat(2,1fr)` on `≤768px` → `1fr` on `≤520px`.
- Charts grid (`1fr 380px`) → `1fr` stacked on `≤768px` (the 380px FunnelChart becomes full-width below RevenueChart).
- Quick-actions / activity grid (`1fr 1fr`) → `1fr` stacked on `≤768px`.
- The whole page already has `maxWidth: 1400` — fine; on mobile it's just full-width.

### 4.3 Tables → mobile cards
- **`ContactTable`, `EstimateList` list table, `InvoiceList`** — below `520px`, instead of `<table>`, render each row as a stacked `Card` (a `<div>` with the key fields as `label: value` rows, the primary field bold at top, action buttons at the bottom). Above `520px`, keep the table but ensure the wrapper is `overflow-x: auto`. Sorting controls: keep on the table view; on the card view, a small "Sort by ▾" select.
- **`ProductCatalog`** and any other dense table → `overflow-x: auto` on mobile (horizontal scroll), no card conversion (it's a reference table, less critical).
- **`ZoneBuilder`** (estimator) table → `overflow-x: auto` on mobile.

### 4.4 Modals & slide-over panels
- **`Modal`** (sizes `sm`/`md`/`lg`/`full`) — on `≤768px`, ALL sizes render as a near-full-screen sheet: `width: 100%; max-width: 100%; max-height: 100vh; border-radius: 0` (or a tiny top radius if it slides up from the bottom — keep it simple: full-screen). Animate from the bottom (`translateY` slide-up) on mobile vs. the desktop `scaleIn` — optional nicety; if it adds complexity, keep `scaleIn` everywhere.
- **`ContactDetail`** (the right slide-in panel, currently `width: 420`) — on mobile: `width: 100%`, slides in from the right (or bottom) full-screen; its internal padding tightens a bit.
- **`CommandPalette`** — on mobile: full-width (`maxWidth: 100%`), `paddingTop` smaller (e.g. `6vh`), `maxHeight` larger so the list isn't cramped.
- **`AddDealModal` / `LossReasonModal` / `InvoiceGenerator` / `ImportCSV`** — they already use the `Modal` primitive (after the Aurora work), so they inherit the responsive `Modal`. Just verify their internal forms don't overflow on narrow widths (single-column fields).

### 4.5 Estimator
- The wizard layout currently is presumably step-content + a `QuoteSidebar` side column. On `≤768px`: stack vertically — step content full-width, and the `QuoteSidebar` becomes either (a) a collapsible section below the step content, or (b) a sticky bottom bar showing the running total with a tap-to-expand. Go with (b) sticky bottom summary bar on mobile (running total + "View breakdown" → expands a sheet) — it keeps the total visible while scrolling the form. The step navigation (next/back) also full-width on mobile.
- `TransformerSelector` cards → single column on mobile.

### 4.6 Pipeline
- The Kanban board already overflows horizontally — ensure `-webkit-overflow-scrolling: touch` and that columns are a comfortable width on mobile (`min-width: ~280px` per column). `react-beautiful-dnd` drag-on-touch is unreliable; **best-effort** — if dragging is janky on touch we accept it for now; the edit-popover (tap a card → edit/move-stage/delete) and the per-stage controls remain the reliable path on mobile. Note this limitation in the spec; don't sink time into making touch-drag perfect.

### 4.7 Tap targets & spacing
- `IconButton` default size → `≥40px` on mobile (it's 32px now). Buttons (`sm`/`md`) get a bit more vertical padding on mobile. List rows (tasks, table-cards, nav links) get `≥44px` effective height. Hover-only affordances (e.g. the hover-revealed delete on `TaskRow`) become always-visible on touch (use `useIsMobile()` → render the delete button at reduced opacity always, since there's no hover on touch).

### 4.8 Login & Splash
- `Login.jsx` — the centered card already works on mobile; just cap its `maxWidth` and ensure padding. The decorative blurred blobs stay.
- `Splash.jsx` — already `100vw/100vh` with `clamp()` font sizes; verify the iris/text overlay looks right at phone aspect ratios (it should). No changes expected beyond a sanity check.

## 5. Motion & Micro-interactions

### 5.1 Library
Add **`framer-motion`** as a dependency (`npm i framer-motion`). Used for: list enter/exit (`AnimatePresence` + `<motion.div layout>`), springy modals, and any layout animations. Hand-rolled CSS keyframes (already in `globals.css`) cover route transitions, hover/press, mount-in for non-list elements, the hero parallax. A `src/lib/motion.js` exports shared constants (spring configs, durations, easings) and a `useReducedMotion()` re-export from framer-motion so non-framer code can branch too.
- **Reduced motion:** the global `@media (prefers-reduced-motion: reduce)` CSS guard already neutralizes CSS animations/transitions. For framer-motion, wrap motion props with `useReducedMotion()` (when true, render with no/instant transitions). `canvas-confetti` already gets `disableForReducedMotion: true`.

### 5.2 Route transitions
- A `<PageTransition>` wrapper around the routed content inside `<Layout>` (keyed on `location.pathname`): the new page fades + slides up slightly on entry. Implementation: a `motion.div` with `initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:.22 }}` keyed on the path. (No exit animation between routes — that needs `AnimatePresence mode="wait"` around `<Routes>` which complicates react-router 7 nesting; entry-only is the pragmatic, jank-free choice.)

### 5.3 Component-level motion
- **`Button`** — on click, a ripple/glow: a brief radial highlight expanding from the pointer, or (simpler & on-brand) a one-shot `box-shadow` pulse in `c.accentSoft`. Plus the existing press-down scale. Disabled buttons: no ripple.
- **`Card`** — keep the `hover` lift; add it to interactive cards consistently. (No tilt — can feel gimmicky.)
- **`IconButton`** — subtle scale-up on hover (`transform: scale(1.08)`), scale-down on press.
- **Nav links / sidebar items** — the active-item left-bar slides/grows in on activation (a `layoutId` shared element via framer-motion, or a CSS transition on the border).
- **`Modal`** — springy entrance (framer-motion spring) instead of the linear `scaleIn`; backdrop fades. On mobile, slide-up from the bottom.
- **`Toast`** — already slides in; add a slight overshoot/spring; stack reflow when one dismisses (framer `layout`).
- **`Skeleton`** — already shimmers; fine.

### 5.4 List enter/exit (`AnimatePresence`)
The lists that change frequently get item enter/exit animations:
- **Tasks widget & `TasksModal`** — adding a task: the row slides+fades in at the top; completing/deleting: it collapses (height → 0) + fades out. The "all clear" confetti stays.
- **Activity feed** — items fade/slide in on load (stagger).
- **Contacts list** (table-card view on mobile, and the table rows on desktop) — new contact animates in; deleted contact (with the 6s Undo) collapses out.
- **Pipeline cards** — adding/removing a deal animates (the dnd reorder itself stays as `react-beautiful-dnd` handles it; we only animate add/remove).
- Each `AnimatePresence` list uses `<motion.div key={id} layout initial=... animate=... exit=...>` with a shared spring from `src/lib/motion.js`.

### 5.5 Animated numbers & charts
- Promote the existing `AnimatedNumber` (currently inside `StatsCards`) to a shared `src/components/ui/AnimatedNumber.jsx` and reuse it for: invoice totals, estimate revenue figures, margin %, the dashboard hero's "active deals / open tasks" counts, the pipeline value totals. `prefers-reduced-motion` → render the final value instantly.
- Charts: `RevenueChart` (recharts area) already draws in (`isAnimationActive`); `FunnelChart` bars already have a `width` transition — make them animate from `0` on mount (they likely already do via render). Add a count-up on each chart's headline figure if it has one. No new chart library.

## 6. Data Flow / Errors / Testing

- No data-flow changes. `useMediaQuery` is pure client-side (`matchMedia`). `framer-motion` is purely presentational.
- Errors: `useMediaQuery` guards against `window`/`matchMedia` being undefined (returns a sensible default). `framer-motion` degrades to instant when reduced-motion is on. Nothing here can throw in a way that breaks data.
- Testing:
  - `npm run build` green at every commit; `npm run test` (the existing 10 unit tests) stays green; add a small unit test for `useMediaQuery` (mock `matchMedia`) — TDD that one.
  - `npm run lint` — no new errors vs. the current baseline.
  - Manual: a phone-width click-through (DevTools device emulation at ~390px and ~768px): drawer opens/closes, every page reflows without horizontal overflow or clipped content, modals/panels are full-screen, tables become cards, tap targets are comfortable; on desktop nothing regressed; animations are smooth and respect reduced-motion (toggle it in DevTools rendering settings). A checklist goes in `RELEASE-NOTES.md`.

## 7. Delivery Plan (phased, parallel agents on disjoint files)

`feat/mobile-interactivity` branch; commit per task; build green at every commit; PR at the end.

1. **Foundation** (one agent): `src/hooks/useMediaQuery.js` (+ TDD test); `src/lib/motion.js`; `npm i framer-motion`; `Layout` → responsive drawer + lifted `drawerOpen`; `Sidebar` → mobile drawer mode (close button, `onNavigate`); `Topbar` → hamburger + condensed mobile cluster; `Modal` → full-screen-sheet on mobile + spring entrance; `ContactDetail` panel → full-width on mobile; `CommandPalette` → full-width on mobile; `globals.css` responsive helpers + `.fade-up`-style additions; `<PageTransition>` wrapper wired into `Layout`.
2. **Dashboard** (one agent, after #1): responsive grids (stat cards 3→2→1, charts stack, actions/activity stack), hero scale-down; promote `AnimatedNumber` to `ui/`; list enter/stagger on the activity feed; hero counts use `AnimatedNumber`.
3. **UI primitives motion** (one agent, after #1): `Button` ripple/glow; `IconButton` hover scale; `Card` interaction consistency; `Toast` spring + layout reflow; `Skeleton`/misc. (Can run in parallel with #2 — disjoint: #2 = `dashboard/*`, #3 = `ui/*`.)
4. **Per-page responsive + motion** (3–4 parallel agents on disjoint folders): (a) Contacts (`contacts/*` — table→card on mobile, list enter/exit with `AnimatePresence`, hover-delete→always-visible on touch); (b) Estimator (`estimator/*` — stack form/sidebar, sticky mobile total bar, table scroll, TransformerSelector single-col); (c) Pipeline + Invoices (`pipeline/*` + `invoices/*` — Kanban touch-scroll & card add/remove animation; invoice list table→card on mobile, generator form single-col); (d) Products + Settings + ARIA + Login + Splash (`products/*` + `settings/*` + `aria/*` + `pages/Login.jsx` + `Splash.jsx` — table scroll, single-col forms, mobile padding, sanity checks).
5. **Audit + verify** (one agent): grep for remaining fixed-width / `100vw` / non-responsive bits; phone-width manual checklist; build/test/lint; update `RELEASE-NOTES.md` with the mobile/motion test checklist; PR description.

(Parallel agents follow the same rules as the Aurora round: each touches only its assigned files, commits explicitly with `git add <files>` not `-A`, retries on `index.lock`, and the controller verifies the merged result builds.)

## 8. Open Items / Assumptions

- **`framer-motion` dependency** approved (the one new dep; ~30 KB gz). If the user vetoes, fall back to hand-rolled CSS for list enter (mount-in only) and skip true exit animations.
- **Touch-drag on the Pipeline Kanban** is best-effort, not guaranteed — tap-based card actions remain the reliable path on mobile.
- **Estimator mobile layout** assumes a sticky bottom total bar; if the actual `Estimator.jsx` structure makes that awkward, fall back to a collapsible `QuoteSidebar` section below the form.
- Resize re-renders via `useMediaQuery` are accepted as negligible at this app's scale.
- The unrelated `contacts` schema fix (`db/2026-05-13-contacts-schema-fix.sql`) is also on this branch as a doc commit; the user runs it in Supabase independently of this work.

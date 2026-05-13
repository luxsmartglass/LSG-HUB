# LSG Hub — Mobile Responsiveness + Motion/Micro-interactions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Companion spec (read it):** `docs/superpowers/specs/2026-05-13-mobile-interactivity-design.md` — full detail on the responsive layout per area and the motion effects. This plan references it rather than restating every pixel.

**Goal:** Make LSG Hub fully usable on phones (off-canvas nav drawer, stacking layouts, card-style mobile lists, full-screen modals/panels, comfy tap targets) and add motion/micro-interactions (route transitions, hover/press feedback, list enter/exit animations, animated counters, springy modals) — all behind `prefers-reduced-motion`.

**Architecture:** Inline-style React app. Responsiveness via a `useMediaQuery` hook → components branch their inline style objects on `isMobile` (breakpoints 768px and 520px); a handful of pure-layout CSS classes in `globals.css`. Motion via `framer-motion` (`AnimatePresence`/`motion.div` for list enter/exit + springy modals) plus the existing hand-rolled CSS keyframes (route transitions, hover/press, mount-in). Shared motion constants + a `useReducedMotion` re-export live in `src/lib/motion.js`. Desktop layout is unchanged; this layers a mobile path + motion on top.

**Tech Stack:** React 19, react-router-dom 7, recharts 3, react-beautiful-dnd, canvas-confetti, framer-motion (NEW), @supabase/supabase-js 2, Vite 6, Vitest.

**Branch:** all work on `feat/mobile-interactivity` (already created, off `main`). Commit after every task. `npm run build` green at every commit.

**Conventions for this plan:**
- "Build-check" = `cd d:/downloads/lsg-hub && npm run build` → `✓ built` (pre-existing "chunks larger than 500 kB" warning is OK; it'll grow a bit from framer-motion — still fine).
- "Test-check" = `npm run test` → all tests pass (10 existing + 1 new for `useMediaQuery`).
- "Lint-check" = `npm run lint` → no NEW errors vs. the current baseline (~11 problems, 4 pre-existing errors). ESLint already ignores `dist`/`.vercel`.
- Colors come only from `useTheme()` → `c.*`. No new raw hex outside `tokens.js`/`icons.jsx`/`illustrations.jsx`/PDF files/`pricingDatabase.js`.
- `isMobile` = `useIsMobile()` (≤768px); `isNarrow` = `useIsNarrow()` (≤520px).
- Reduced motion: CSS animations are already neutralized by the global `@media (prefers-reduced-motion: reduce)` guard; for `framer-motion`, gate motion props with `useReducedMotion()` from `src/lib/motion.js`.

---

## File Structure

**New files:**
- `src/hooks/useMediaQuery.js` — `useMediaQuery(query)` + `useIsMobile()` + `useIsNarrow()`; SSR/`matchMedia`-undefined safe.
- `src/hooks/useMediaQuery.test.js` — unit test (mocks `matchMedia`).
- `src/lib/motion.js` — shared motion constants (`spring`, `springSoft`, durations, easings) + `export { useReducedMotion } from 'framer-motion'`.
- `src/components/ui/PageTransition.jsx` — wraps routed content; fades+slides the new page in (keyed on pathname).
- `src/components/ui/AnimatedNumber.jsx` — promoted from inside `StatsCards.jsx`; reused app-wide; reduced-motion → instant.

**Heavily modified:**
- `package.json` — `+ framer-motion`.
- `src/styles/globals.css` — responsive helper classes + any new keyframes; `-webkit-overflow-scrolling: touch` helper.
- `src/components/layout/Layout.jsx` — owns `drawerOpen`; renders Sidebar as off-canvas drawer + backdrop on mobile; mobile `<main>` padding; wraps children in `<PageTransition>`.
- `src/components/layout/Sidebar.jsx` — `open`/`onNavigate` props; mobile drawer mode (close button, ≥44px nav rows); active-item motion.
- `src/components/layout/Topbar.jsx` — hamburger `IconButton` (mobile only, left); condensed mobile cluster; smaller mobile padding.
- `src/components/ui/Modal.jsx` — full-screen sheet on mobile (`width:100%, maxHeight:100vh, borderRadius:0`, slide-up); springy entrance via framer-motion; backdrop fade.
- `src/components/ui/CommandPalette.jsx` — full-width + smaller `paddingTop` + larger `maxHeight` on mobile.
- `src/components/ui/Button.jsx` — click ripple/glow (accent pulse) + keep press scale.
- `src/components/ui/IconButton.jsx` — hover scale-up, press scale-down; `size` ≥40 on mobile (accept a `mobileSize`/auto via `useIsMobile`).
- `src/components/ui/Toast.jsx` — spring entrance + `layout` reflow on dismiss (framer-motion).
- `src/components/dashboard/Dashboard.jsx` — responsive grids; hero scale-down; hero counts use `AnimatedNumber`.
- `src/components/dashboard/StatsCards.jsx` — `import AnimatedNumber from '../ui/AnimatedNumber'` (remove the local copy); grid `3→2→1`.
- `src/components/dashboard/ActivityFeed.jsx` — staggered list enter (`AnimatePresence`/`motion.div`).
- `src/components/dashboard/RevenueChart.jsx`, `FunnelChart.jsx` — responsive (full-width on stack); bars animate from 0.
- `src/components/dashboard/tasks/TasksWidget.jsx`, `TasksModal.jsx`, `TaskRow.jsx` — list enter/exit (`AnimatePresence`); on mobile, the hover-revealed delete becomes always-visible (reduced opacity).
- `src/components/contacts/Contacts.jsx`, `ContactTable.jsx`, `ContactDetail.jsx`, `ImportCSV.jsx` — table→cards under 520px; `ContactDetail` full-width on mobile; list enter/exit; always-visible row actions on touch.
- `src/components/estimator/Estimator.jsx`, `EstimateList.jsx`, `ZoneBuilder.jsx`, `QuoteSidebar.jsx`, `TransformerSelector.jsx` — stack form/sidebar on mobile (sticky bottom total bar — fallback: collapsible `QuoteSidebar` section); `EstimateList` table→cards under 520px; `ZoneBuilder` table h-scroll; `TransformerSelector` single column.
- `src/components/pipeline/Pipeline.jsx`, `KanbanBoard.jsx`, `DealCard.jsx`, `WarmHoldColumn.jsx` — Kanban touch-scroll (`-webkit-overflow-scrolling`), comfortable column min-width on mobile; card add/remove animation.
- `src/components/invoices/Invoices.jsx`, `InvoiceList.jsx`, `InvoiceGenerator.jsx` — `InvoiceList` table→cards under 520px; generator form single-column on mobile; (`InvoicePDF.jsx` untouched).
- `src/components/products/Products.jsx`, `ProductCatalog.jsx`, `MarginCalculator.jsx` — catalog table h-scroll on mobile; tab bar wraps; margin calc single-column.
- `src/components/settings/Settings.jsx`, `GmailSettings.jsx`, `StripeSettings.jsx` — single-column forms / full-width cards on mobile.
- `src/components/aria/Aria.jsx`, `AriaChat.jsx` — chat fills width on mobile; input bar comfy.
- `src/pages/Login.jsx` — cap card width, mobile padding (mostly fine already).
- `src/components/Splash.jsx` — sanity-check at phone aspect ratios (likely no change; only adjust if something clips).

**Deleted:** none.

---

## Phase 0 — Foundation

### Task 0.1: `useMediaQuery` hook (TDD)

**Files:** Create `src/hooks/useMediaQuery.js`, `src/hooks/useMediaQuery.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMediaQuery, useIsMobile } from './useMediaQuery'

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),       // legacy
    removeListener: vi.fn(),    // legacy
    dispatchEvent: vi.fn(),
  }))
}

describe('useMediaQuery', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns true when the query matches', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('returns false when the query does not match', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('useIsMobile uses the 768px breakpoint', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 768px)')
    expect(result.current).toBe(true)
  })

  it('returns false when matchMedia is unavailable', () => {
    // @ts-ignore
    delete window.matchMedia
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(false)
  })
})
```

- [ ] **Step 2: Run → FAIL.** Run: `npm run test src/hooks/useMediaQuery.test.js` → "Cannot find module './useMediaQuery'".

- [ ] **Step 3: Implement `src/hooks/useMediaQuery.js`**

```js
import { useState, useEffect } from 'react'

/**
 * Subscribe to a CSS media query. SSR / no-matchMedia safe (returns false).
 */
export function useMediaQuery(query) {
  const get = () =>
    (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
      ? window.matchMedia(query).matches
      : false

  const [matches, setMatches] = useState(get)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange() // sync in case it changed between render and effect
    if (mql.addEventListener) mql.addEventListener('change', onChange)
    else mql.addListener(onChange) // legacy Safari
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange)
      else mql.removeListener(onChange)
    }
  }, [query])

  return matches
}

export function useIsMobile()  { return useMediaQuery('(max-width: 768px)') }
export function useIsNarrow()  { return useMediaQuery('(max-width: 520px)') }

export default useMediaQuery
```

- [ ] **Step 4: Run → PASS.** Run: `npm run test src/hooks/useMediaQuery.test.js`
- [ ] **Step 5: Commit** `git add src/hooks/useMediaQuery.js src/hooks/useMediaQuery.test.js && git commit -m "feat(responsive): useMediaQuery / useIsMobile / useIsNarrow hooks (tested)"`

### Task 0.2: Install framer-motion + `motion.js`

**Files:** Modify `package.json`; Create `src/lib/motion.js`

- [ ] **Step 1: Install.** Run: `cd d:/downloads/lsg-hub && npm i framer-motion` → updates `package.json`/`package-lock.json`. Expected: installs cleanly.
- [ ] **Step 2: Create `src/lib/motion.js`**

```js
// Shared motion constants for framer-motion. Keep effects calm and consistent.
export { useReducedMotion } from 'framer-motion'

// Springs
export const spring       = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }
export const springSoft   = { type: 'spring', stiffness: 220, damping: 28 }
export const springSnappy = { type: 'spring', stiffness: 520, damping: 34 }

// Tween durations / easings
export const ease = [0.22, 1, 0.36, 1]   // "easeOutExpo"-ish
export const dur  = { fast: 0.16, base: 0.22, slow: 0.32 }

// Common list-item enter/exit (use with <motion.div layout>)
export const listItem = {
  initial: { opacity: 0, y: -6, height: 0 },
  animate: { opacity: 1, y: 0, height: 'auto' },
  exit:    { opacity: 0, y: -6, height: 0 },
  transition: spring,
}
```

- [ ] **Step 3: Build-check.** Run: `npm run build` → `✓ built` (bundle grows ~25-35 KB gz — expected).
- [ ] **Step 4: Commit** `git add package.json package-lock.json src/lib/motion.js && git commit -m "chore: add framer-motion + shared motion constants"`

### Task 0.3: `PageTransition` wrapper + `globals.css` responsive helpers

**Files:** Create `src/components/ui/PageTransition.jsx`; Modify `src/styles/globals.css`

- [ ] **Step 1: `PageTransition.jsx`**

```jsx
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { dur, ease, useReducedMotion } from '../../lib/motion'

// Fade + slight slide-up of the routed content on each navigation.
export default function PageTransition({ children }) {
  const location = useLocation()
  const reduced = useReducedMotion()
  return (
    <motion.div
      key={location.pathname}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : dur.base, ease }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: `globals.css` additions** — append these (keep everything already there):

```css
/* Responsive helpers (used by Layout / Dashboard where a CSS class is cleaner than a JS branch) */
@media (max-width: 768px) {
  .only-desktop { display: none !important; }
}
@media (min-width: 769px) {
  .only-mobile { display: none !important; }
}
.h-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

/* Slide-in keyframes for the mobile drawer / bottom sheets */
@keyframes slideInLeft  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
@keyframes slideUp      { from { transform: translateY(100%);  } to { transform: translateY(0); } }
```

- [ ] **Step 3: Build-check.** Run: `npm run build` → `✓ built`.
- [ ] **Step 4: Commit** `git add src/components/ui/PageTransition.jsx src/styles/globals.css && git commit -m "feat(motion): PageTransition wrapper + globals responsive helpers"`

### Task 0.4: Responsive chrome — `Layout` + `Sidebar` + `Topbar` (drawer + hamburger)

**Files:** Modify `src/components/layout/Layout.jsx`, `Sidebar.jsx`, `Topbar.jsx`

- [ ] **Step 1: `Layout.jsx`** — own `const [drawerOpen, setDrawerOpen] = useState(false)`; `const isMobile = useIsMobile()`. On mobile: render `<Sidebar open={drawerOpen} isMobile onNavigate={() => setDrawerOpen(false)} onClose={() => setDrawerOpen(false)} />` as a fixed off-canvas panel — wrap it so it's `position:fixed; top:0; bottom:0; left:0; z-index:1000; transform: translateX(drawerOpen ? 0 : -100%); transition: transform .25s ease` — plus, when `drawerOpen`, a backdrop `<div onClick={()=>setDrawerOpen(false)} style={{ position:'fixed', inset:0, background:c.overlay, zIndex:999 }} />`. On desktop: the normal in-flow `<Sidebar />` (pass nothing new). Pass `onMenu={() => setDrawerOpen(true)}` + `isMobile` to `<Topbar>`. `<main>` `padding: isMobile ? 16 : 28`. Wrap `{children}` in `<PageTransition>{children}</PageTransition>`. `useTheme` for `c.overlay`/`c.bg`.

```jsx
import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import PageTransition from '../ui/PageTransition'
import { useTheme } from '../../theme/useTheme'
import { useIsMobile } from '../../hooks/useMediaQuery'

export default function Layout({ children, session }) {
  const { c } = useTheme()
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden' }}>
      {isMobile ? (
        <>
          {drawerOpen && (
            <div onClick={() => setDrawerOpen(false)}
                 style={{ position:'fixed', inset:0, background:c.overlay, zIndex:999 }} />
          )}
          <div style={{
            position:'fixed', top:0, bottom:0, left:0, zIndex:1000,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition:'transform .25s ease',
          }}>
            <Sidebar session={session} isMobile open={drawerOpen}
                     onNavigate={() => setDrawerOpen(false)}
                     onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      ) : (
        <Sidebar session={session} />
      )}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar session={session} isMobile={isMobile} onMenu={() => setDrawerOpen(true)} />
        <main id="content" style={{
          flex:1, overflowY:'auto', padding: isMobile ? 16 : 28,
          background:c.bg, color:c.textPrimary,
          transition:'background-color 0.25s ease, color 0.25s ease',
        }}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `Sidebar.jsx`** — accept `isMobile=false`, `open`, `onNavigate`, `onClose` (all optional; desktop callers pass none). When `isMobile`: width `min(280px, 82vw)`; add a header close `IconButton` (`<XIcon/>`, `onClick={onClose}`) next to the LSG logo; nav links call `onNavigate?.()` in addition to navigating (so the drawer closes — easiest: `onClick={() => onNavigate?.()}` on the `NavLink`); nav row vertical padding bumps to `14px` (≥44px tap). Keep `useCounts()` etc. as is. Everything else unchanged.
- [ ] **Step 3: `Topbar.jsx`** — accept `isMobile=false`, `onMenu`. When `isMobile`: render a hamburger `<IconButton label="Menu" onClick={onMenu}>` (a 3-line icon — add `MenuIcon` to `src/components/ui/icons.jsx` if not present) at the LEFT, before the title; shrink the title `fontSize` (or hide it under ~420px — use `useIsNarrow()`); drop the "New Estimate" `<Button>` (keep the `+` quick-create IconButton and the theme toggle — "New Estimate" is reachable via ⌘K / quick-actions); reduce horizontal padding to `0 12px` and height to `52`. Desktop unchanged. (Add `MenuIcon` to `icons.jsx`: 24×24, three `<line>`s, `size` prop default 16.)
- [ ] **Step 4: Build + lint check.** Run: `npm run build` && `npm run lint`. Manual: at desktop width nothing changes; at ≤768px the sidebar is gone, a hamburger appears, tapping it slides the drawer in with a backdrop, tapping a link or the backdrop closes it.
- [ ] **Step 5: Commit** `git add src/components/layout/*.jsx src/components/ui/icons.jsx && git commit -m "feat(responsive): off-canvas nav drawer + hamburger; mobile-condensed topbar"`

### Task 0.5: Responsive `Modal`, `ContactDetail` panel, `CommandPalette`

**Files:** Modify `src/components/ui/Modal.jsx`, `src/components/contacts/ContactDetail.jsx`, `src/components/ui/CommandPalette.jsx`

- [ ] **Step 1: `Modal.jsx`** — `const isMobile = useIsMobile()`. On mobile: the panel is `width:'100%', maxWidth:'100%', maxHeight:'100vh', borderRadius:0` regardless of `size`; the overlay has no padding (`padding:0`). Replace the `scaleIn` CSS animation on the panel with a framer-motion `<motion.div>`: desktop `initial={{opacity:0, scale:.96}} animate={{opacity:1, scale:1}}` with `springSnappy`; mobile `initial={{y:'100%'}} animate={{y:0}}` with `spring` (slide up). Backdrop: `<motion.div initial={{opacity:0}} animate={{opacity:1}}>`. Gate all of it with `useReducedMotion()` (→ no animation). Keep ESC/backdrop-click/scroll-lock/focus behavior exactly as is.
- [ ] **Step 2: `ContactDetail.jsx`** — `const isMobile = useIsMobile()`. The slide-in panel: `width: isMobile ? '100%' : 420`; on mobile it covers the screen (`right:0, top:0, height:'100%'`); internal padding tightens slightly on mobile (`'16px'` instead of `'24px'` for the body sections). Optionally animate the panel in with framer-motion (`initial={{x:'100%'}} animate={{x:0}}` + reduced-motion gate) — nice-to-have; if it complicates things, keep it static. Everything else (create form, edit fields, the bug-fixed insert) stays.
- [ ] **Step 3: `CommandPalette.jsx`** — `const isMobile = useIsMobile()`. The inner panel: `maxWidth: isMobile ? '100%' : 560`; `paddingTop: isMobile ? '6vh' : '12vh'`; `maxHeight: isMobile ? '80vh' : '60vh'`. (Keep the `fadeIn`/`scaleIn` CSS animations — fine on mobile too.)
- [ ] **Step 4: Build + lint check.** Manual: open any modal on a phone width → it's a full-screen sheet that slides up; `ContactDetail` is full-width; ⌘K palette is full-width.
- [ ] **Step 5: Commit** `git add src/components/ui/Modal.jsx src/components/ui/CommandPalette.jsx src/components/contacts/ContactDetail.jsx && git commit -m "feat(responsive): full-screen Modal/ContactDetail/CommandPalette on mobile; spring entrances"`

---

## Phase 1 — Dashboard (responsive + motion)

### Task 1.1: Promote `AnimatedNumber` to `ui/`

**Files:** Create `src/components/ui/AnimatedNumber.jsx`; Modify `src/components/dashboard/StatsCards.jsx`

- [ ] **Step 1: `src/components/ui/AnimatedNumber.jsx`** — extract the `AnimatedNumber` currently defined inside `StatsCards.jsx` (the `requestAnimationFrame` count-up with `prefix`/`suffix`/`decimals`), keep it identical, but: import `useReducedMotion` from `../../lib/motion` and if `reduced`, set the textContent to the final value immediately (skip the rAF loop). Keep `fontVariantNumeric: 'tabular-nums'` on the span.
- [ ] **Step 2: `StatsCards.jsx`** — remove the local `AnimatedNumber` function; `import AnimatedNumber from '../ui/AnimatedNumber'`. (No other change in this task.)
- [ ] **Step 3: Build + lint check.**
- [ ] **Step 4: Commit** `git add src/components/ui/AnimatedNumber.jsx src/components/dashboard/StatsCards.jsx && git commit -m "refactor(ui): promote AnimatedNumber to ui/ + reduced-motion aware"`

### Task 1.2: Dashboard responsive grids + hero scale + animated counts

**Files:** Modify `src/components/dashboard/Dashboard.jsx`, `StatsCards.jsx`, `RevenueChart.jsx`, `FunnelChart.jsx`

- [ ] **Step 1: `Dashboard.jsx`** — `const isMobile = useIsMobile()`. Hero: `padding: isMobile ? '22px 18px' : '34px 38px'`; greeting `fontSize: isMobile ? c.text.xl : c.text.display`; the clock `fontSize: isMobile ? 26 : 34`. Charts grid: `gridTemplateColumns: isMobile ? '1fr' : '1fr 380px'`. Quick-actions/activity grid: `gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'`. Hero "active deals / open tasks" counts: render with `<AnimatedNumber value={stats?.activeDeals||0} />` and `<AnimatedNumber value={openTaskCount} />` inline in the day-summary line. Keep the parallax bloom (already reduced-motion-guarded). `import AnimatedNumber from '../ui/AnimatedNumber'`.
- [ ] **Step 2: `StatsCards.jsx`** — `const isNarrow = useIsNarrow(); const isMobile = useIsMobile()`. `gridTemplateColumns: isNarrow ? '1fr' : isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'`. Keep the rest.
- [ ] **Step 3: `RevenueChart.jsx` / `FunnelChart.jsx`** — they're already inside `<Card>` and use `ResponsiveContainer` (Revenue) — they'll fill whatever width the stacked grid gives them, so likely no change needed beyond confirming the `ResponsiveContainer width="100%"` is present (it is). For `FunnelChart`, ensure the bars have `transition: 'width .8s cubic-bezier(.22,1,.36,1)'` and start from a 0-width on first render (mount with `width: 0` then set actual after a `useEffect` tick — small change for a draw-in; OR accept React's initial render already animates because the `transition` is on the element). Keep it simple — if the bars already visibly animate, leave them.
- [ ] **Step 4: Build + lint check.** Manual: at ≤768px the dashboard is a single stacked column; stat cards 2-up (1-up under 520px); hero shrinks; numbers count up.
- [ ] **Step 5: Commit** `git add src/components/dashboard/*.jsx && git commit -m "feat(responsive): dashboard stacks on mobile; animated hero counts"`

### Task 1.3: List enter/stagger — Tasks widget/modal + Activity feed

**Files:** Modify `src/components/dashboard/ActivityFeed.jsx`, `src/components/dashboard/tasks/TasksWidget.jsx`, `TasksModal.jsx`, `TaskRow.jsx`

- [ ] **Step 1: `ActivityFeed.jsx`** — wrap the items list in a framer-motion stagger: the container `<motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}>` and each row a `<motion.div variants={{ hidden: { opacity:0, y:8 }, show: { opacity:1, y:0 } }} transition={spring}>`. Gate with `useReducedMotion()` (→ render plain `<div>`s). Import `spring`, `useReducedMotion` from `../../lib/motion`.
- [ ] **Step 2: `TasksWidget.jsx` + `TasksModal.jsx`** — wrap the rendered `<TaskRow>` lists (open list, done-today list, modal sections) in `<AnimatePresence>`; render each `<TaskRow>` inside a `<motion.div key={task.id} layout {...listItem}>` (from `../../lib/motion`). Gate with `useReducedMotion()` (→ plain `div`s, no `AnimatePresence`). Import `AnimatePresence`, `motion` from `framer-motion`, `listItem`, `useReducedMotion` from `../../../lib/motion`.
- [ ] **Step 3: `TaskRow.jsx`** — `const isMobile = useIsMobile()`. The hover-revealed delete `IconButton`: on mobile (no hover), render it always at `opacity: 0.55` (not `0`); on desktop keep the `hover ? 1 : 0` behavior. Also bump the checkbox to 22px and row vertical padding to `12px` on mobile.
- [ ] **Step 4: Build + lint check.** Manual: adding a task → it slides in at the top; completing/deleting → it collapses out; activity feed items stagger in on load; reduced-motion off shows no animation. Confetti on all-clear still works.
- [ ] **Step 5: Commit** `git add src/components/dashboard/ActivityFeed.jsx src/components/dashboard/tasks/*.jsx && git commit -m "feat(motion): list enter/exit on tasks + activity feed; touch-friendly task rows"`

---

## Phase 2 — UI primitives motion (parallel-safe with Phase 1: disjoint files)

### Task 2.1: `Button` ripple/glow + `IconButton` hover/press + mobile sizing

**Files:** Modify `src/components/ui/Button.jsx`, `src/components/ui/IconButton.jsx`

- [ ] **Step 1: `Button.jsx`** — add a click "glow pulse": on `onClick`/`onMouseDown`, set a transient state that applies `boxShadow: '0 0 0 4px ' + c.accentSoft` for ~250ms then clears it (a small `useState` + `setTimeout`, cleared on unmount). Keep the existing press-down `transform: scale(0.97)` on mousedown/up. Don't apply to `disabled`/`loading`. Gate the pulse with `useReducedMotion()` (skip if reduced). (A radial ripple from the pointer is also fine if cleanly done, but the accent box-shadow pulse is on-brand and simpler — prefer that.)
- [ ] **Step 2: `IconButton.jsx`** — add `transform: hover ? 'scale(1.08)' : 'scale(1)'` (already has hover state) with `transition` including `transform .12s`; on mousedown `scale(0.92)`. `const isMobile = useIsMobile()`; default `size` becomes `Math.max(size ?? 32, isMobile ? 40 : 32)` (so callers that pass nothing get 40 on mobile, 32 on desktop; explicit `size` props are respected but floored at 40 on mobile). Gate transforms with reduced-motion via CSS (transitions already neutralized globally — fine, no JS gate needed since it's CSS transitions).
- [ ] **Step 3: Build + lint check.**
- [ ] **Step 4: Commit** `git add src/components/ui/Button.jsx src/components/ui/IconButton.jsx && git commit -m "feat(motion): Button click glow; IconButton hover/press scale + mobile tap size"`

### Task 2.2: `Toast` spring + layout reflow

**Files:** Modify `src/components/ui/Toast.jsx`

- [ ] **Step 1:** In the rendered `ToastList`, wrap the toast stack in a framer-motion list: each toast is a `<motion.div layout initial={{ opacity:0, y:12, scale:.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:8, scale:.96 }} transition={springSnappy}>` inside an `<AnimatePresence>`. So when one dismisses, the others reflow smoothly. Gate with `useReducedMotion()` (→ plain `div`s). Keep the `useTheme()`-based colors, the `action` button, the auto-dismiss `setTimeout`, and the `useToast`/`ToastProvider` API exactly as is. Import `motion`, `AnimatePresence` from `framer-motion`, `springSnappy`, `useReducedMotion` from `../../lib/motion`.
- [ ] **Step 2: Build + lint check.** Manual: trigger 2-3 toasts; dismissing one slides the rest up smoothly.
- [ ] **Step 3: Commit** `git add src/components/ui/Toast.jsx && git commit -m "feat(motion): toast spring entrance + layout reflow on dismiss"`

---

## Phase 3 — Per-page responsive + motion (parallel agents, disjoint folders)

> Each agent: read the spec §4–§5 for its area; reflow with `useIsMobile()`/`useIsNarrow()`; add list enter/exit where lists change; **no data/logic changes**; PDF render files untouched; build + lint check before each commit; commit explicitly (`git add <files>`).

### Task 3.1: Contacts — table→cards on mobile, list enter/exit, touch actions

**Files:** Modify `src/components/contacts/Contacts.jsx`, `ContactTable.jsx`, `ImportCSV.jsx`

- [ ] **Step 1: `ContactTable.jsx`** — `const isNarrow = useIsNarrow()`. When `isNarrow`: instead of `<table>`, render a list of `<Card pad={12}>` per contact — top row: name (bold, `c.textPrimary`) + the delete `IconButton` (always visible on mobile); then `Company · Role`, `Email`, `Phone` as small label:value lines, and the tag badges. Tap the card → `onSelect(contact)`. Above `isNarrow`: keep the table, wrapped in `<div className="h-scroll">`. Sorting: above-narrow keeps the clickable headers; on the card view, add a small "Sort: ▾" `<Select>` (Name / Company / Newest). Wrap the contact list (cards or rows) in `<AnimatePresence>` with `<motion.div key={contact.id} layout {...listItem}>` so new/deleted contacts animate (gate with `useReducedMotion()`).
- [ ] **Step 2: `Contacts.jsx`** — `const isMobile = useIsMobile()`; the header (search input + Import + New Contact buttons) wraps on mobile (`flexWrap:'wrap'`, the search input goes full-width on its own line under ~520px). Page padding already comes from `<main>`. Nothing else.
- [ ] **Step 3: `ImportCSV.jsx`** — it's a `Modal` now, so it inherits the responsive Modal; just ensure its internal preview table / file picker fit a narrow width (single column; the preview table gets `className="h-scroll"`).
- [ ] **Step 4: Build + lint check.** Manual at ≤520px: contacts render as cards; new contact animates in; deleting a contact (with Undo) collapses it out; CSV import modal is full-screen and usable.
- [ ] **Step 5: Commit** `git add src/components/contacts/*.jsx && git commit -m "feat(responsive): contacts list → mobile cards; list enter/exit; touch-visible actions"`

### Task 3.2: Estimator — stack on mobile, sticky total bar, table scroll

**Files:** Modify `src/components/estimator/Estimator.jsx`, `EstimateList.jsx`, `ZoneBuilder.jsx`, `QuoteSidebar.jsx`, `TransformerSelector.jsx`

- [ ] **Step 1:** Read all five files first to learn the current layout. `Estimator.jsx`: `const isMobile = useIsMobile()`. If the step content + `QuoteSidebar` are side-by-side (a flex/grid with two columns), make it stack on mobile (`flexDirection: isMobile ? 'column' : 'row'` / single-column grid). On mobile, instead of the inline `QuoteSidebar`, render a **sticky bottom bar** fixed to the viewport bottom: shows the running total + a "View breakdown" button that opens the full `QuoteSidebar` content in a `Modal` (or a bottom sheet). If wiring that sticky bar cleanly is awkward given the actual structure, fall back to rendering `QuoteSidebar` as a full-width collapsible `<details>`-style section below the step content. Step nav (Next/Back) buttons go full-width on mobile.
- [ ] **Step 2: `ZoneBuilder.jsx`** — wrap its table in `<div className="h-scroll">`; on `isNarrow`, consider stacking each zone row's inputs vertically (only if it's badly cramped — otherwise h-scroll is fine).
- [ ] **Step 3: `TransformerSelector.jsx`** — its option cards: `gridTemplateColumns: isMobile ? '1fr' : <current>`.
- [ ] **Step 4: `QuoteSidebar.jsx`** — make its container width-flexible (`width: '100%'` when used on mobile / inside the modal); no other change. `EstimateList.jsx`: same table→cards-under-520px treatment as ContactTable (per-estimate `<Card>`: client name + total bold, then status badge / margin / date / actions); above 520px keep the table in `<div className="h-scroll">`.
- [ ] **Step 5: Build + lint check.** Manual at ≤768px: the estimator wizard is single-column; the running total is visible (sticky bar or collapsible); zone table scrolls; estimate list is cards on narrow. **Confirm the save/pricing logic is untouched.**
- [ ] **Step 6: Commit** `git add src/components/estimator/*.jsx && git commit -m "feat(responsive): estimator stacks on mobile + sticky/collapsible total; estimate list → cards"`

### Task 3.3: Pipeline + Invoices — Kanban touch-scroll, list cards, mobile forms

**Files:** Modify `src/components/pipeline/Pipeline.jsx`, `KanbanBoard.jsx`, `DealCard.jsx`, `WarmHoldColumn.jsx`; `src/components/invoices/Invoices.jsx`, `InvoiceList.jsx`, `InvoiceGenerator.jsx`

- [ ] **Step 1: Pipeline** — ensure the Kanban scroll container has `overflow-x:auto; -webkit-overflow-scrolling: touch` (use `className="h-scroll"` or inline) and that each column has a comfortable `minWidth` (≈ `280px`) on mobile so columns don't get tiny. The `AddDealModal`/`LossReasonModal` are `Modal`s → inherit responsive. On `isMobile`, the page header (title + filters + Add Deal) wraps. Card add/remove: wrap each column's card list in `<AnimatePresence>` with `<motion.div key={deal.id} layout {...listItem}>` — **but** check it doesn't fight `react-beautiful-dnd`'s own DOM management; if it does (drag breaks), drop the `layout` prop and use only `initial/animate/exit` on a non-droppable wrapper, or skip the framer wrapper inside `<Droppable>` and only animate the column-level add/remove. Best-effort; if any conflict, prefer keeping dnd working over the animation. Reduced-motion gate as usual.
- [ ] **Step 2: Invoices** — `InvoiceList.jsx`: table→cards-under-520px (per-invoice `<Card>`: client + total bold, status badge, paid date, actions); above keep the table in `<div className="h-scroll">`. `InvoiceGenerator.jsx`: it's a `Modal` → responsive; ensure its form fields are single-column on narrow widths. `Invoices.jsx`: header wraps on mobile.
- [ ] **Step 3: Build + lint check.** Manual at ≤768px: Kanban scrolls horizontally with comfy columns; tapping a card opens its popover; invoice list is cards on narrow; the invoice generator modal is full-screen and single-column. **Drag-on-touch is best-effort — note in the report if it's janky; tap-edit must work.**
- [ ] **Step 4: Commit** `git add src/components/pipeline/*.jsx src/components/invoices/*.jsx && git commit -m "feat(responsive): pipeline touch-scroll + card add/remove animation; invoices → mobile cards"`

### Task 3.4: Products + Settings + ARIA + Login + Splash — mobile reflow

**Files:** Modify `src/components/products/Products.jsx`, `ProductCatalog.jsx`, `MarginCalculator.jsx`; `src/components/settings/Settings.jsx`, `GmailSettings.jsx`, `StripeSettings.jsx`; `src/components/aria/Aria.jsx`, `AriaChat.jsx`; `src/pages/Login.jsx`; `src/components/Splash.jsx`

- [ ] **Step 1: Products** — `ProductCatalog.jsx`: wrap its table in `<div className="h-scroll">`; the tab bar (`SegmentedControl`) wraps if needed. `MarginCalculator.jsx`: its two-column layout → single column on `isMobile`. `Products.jsx`: header/tabs wrap.
- [ ] **Step 2: Settings** — `Settings.jsx`/`GmailSettings.jsx`/`StripeSettings.jsx`: form sections (`Card`s) are already block-stacked; just ensure any side-by-side field pairs go single-column on `isMobile`, and the cards have no fixed widths that overflow. Buttons full-width on mobile if they look cramped.
- [ ] **Step 3: ARIA** — `AriaChat.jsx`: the chat column fills width on mobile (remove any fixed `maxWidth` that's too narrow, or keep but `width:'100%'`); the input bar gets comfy padding and the send button is ≥44px on mobile. `Aria.jsx`: page reflows.
- [ ] **Step 4: Login** — `Login.jsx`: the centered card `maxWidth: 'min(420px, 92vw)'`, padding `clamp(...)`; the decorative blobs stay. (Mostly already fine — small tweak.)
- [ ] **Step 5: Splash** — open `Splash.jsx`, check the iris/text overlay at a tall phone aspect ratio mentally; the fonts already use `clamp()`. Only change something if it clips/overflows on narrow widths. Likely no change.
- [ ] **Step 6: Build + lint check.** Manual at ≤768px: products catalog scrolls; margin calc single-column; settings forms single-column; ARIA chat usable; login centered and not cramped; splash unaffected.
- [ ] **Step 7: Commit** `git add src/components/products/*.jsx src/components/settings/*.jsx src/components/aria/*.jsx src/pages/Login.jsx src/components/Splash.jsx && git commit -m "feat(responsive): products/settings/aria/login/splash mobile reflow"`

---

## Phase 4 — Audit + verification

### Task 4.1: Responsive/motion audit + final verification

**Files:** read-only sweep + fix-as-found; Modify `RELEASE-NOTES.md`

- [ ] **Step 1:** Sweep for leftover non-responsive bits: `grep -rn "width: *100vw\|width:'100vw'\|width: 220\|maxWidth: *[0-9]\|gridTemplateColumns" src/components src/pages` — for each, confirm it's either fine (e.g. a `maxWidth` cap that doesn't overflow) or wrap it in an `isMobile` branch / `h-scroll`. Check that every `Modal`/`ContactDetail`/`CommandPalette` is full-width on mobile. Check no page has horizontal overflow at 390px (read the layout-defining styles). Fix obvious issues in place; commit per fix (`git commit -am "fix(responsive): <thing>"`).
- [ ] **Step 2:** Confirm reduced-motion: the global CSS guard is intact in `globals.css`; every framer-motion usage either uses `useReducedMotion()` or is purely cosmetic (a `layout` reflow with no transition is fine). Confconfetti uses `disableForReducedMotion`. (No code change unless something's missing.)
- [ ] **Step 3:** `npm run test` → all pass (11). `npm run lint` → no new errors. `npm run build` → `✓ built`.
- [ ] **Step 4:** Append a "Mobile & Motion" section to `RELEASE-NOTES.md` with the manual test checklist: at ~390px and ~768px (DevTools device emulation) — hamburger opens/closes the drawer; every page reflows with no horizontal overflow or clipped content; modals/`ContactDetail`/⌘K are full-screen sheets; Contacts/Estimates/Invoices lists are cards; tap targets comfortable; estimator total is visible (sticky/collapsible); Kanban scrolls and cards are tappable. On desktop: nothing regressed. With reduced-motion on (DevTools → Rendering → Emulate CSS prefers-reduced-motion): animations are off, app still works. List add/remove animates (tasks, contacts); route changes fade in; buttons glow on click; toasts spring + reflow.
- [ ] **Step 5: Commit** `git add RELEASE-NOTES.md && git commit -m "docs: mobile + motion test checklist in RELEASE-NOTES"`
- [ ] **Step 6:** Push the branch: `git push -u origin feat/mobile-interactivity`. Then follow `superpowers:finishing-a-development-branch` (offer merge / PR / keep / discard). Since `main` auto-deploys, **recommend PR + preview verification on a phone first**.

---

## Self-Review (completed by plan author)

- **Spec coverage:** §3 responsive architecture → Task 0.1 (`useMediaQuery`) + the per-component `isMobile` branches throughout + the `globals.css` helpers in 0.3. §4.1 chrome → 0.4. §4.2 dashboard → 1.2. §4.3 tables→cards → 3.1 (contacts), 3.2 (estimates), 3.3 (invoices), 3.4 (products h-scroll). §4.4 modals/panels → 0.5. §4.5 estimator → 3.2. §4.6 pipeline → 3.3. §4.7 tap targets → 0.4 (nav), 2.1 (IconButton), 1.3 (task rows), 3.1 (contact actions). §4.8 login/splash → 3.4. §5.1 library → 0.2 (`framer-motion` + `motion.js`). §5.2 route transitions → 0.3 (`PageTransition`) + wired in 0.4 (Layout). §5.3 component motion → 0.5 (Modal spring), 2.1 (Button/IconButton), 2.2 (Toast), 0.4 (sidebar active item — *note: the spec mentions a `layoutId` shared-element for the active nav bar; that's optional polish — 0.4 does a CSS-transition version; add the framer `layoutId` only if cheap*). §5.4 list enter/exit → 1.3 (tasks/activity), 3.1 (contacts), 3.3 (pipeline cards). §5.5 animated numbers/charts → 1.1 (promote `AnimatedNumber`) + 1.2 (hero counts) + 1.2 step 3 (chart bars). §6 testing → 0.1 (TDD `useMediaQuery`) + 4.1. §7 delivery → the phase/parallel structure here. **No gaps.**
- **Placeholder scan:** the "best-effort"/"fall back to X if awkward" notes (estimator sticky bar, pipeline `layout` vs dnd, ContactDetail panel animation) are deliberate, bounded fallbacks with a stated default — not hand-waves. No "TBD"/"add error handling". The Splash task legitimately may be a no-op (it's a sanity check) — stated as such. OK.
- **Type/name consistency:** `useIsMobile()`/`useIsNarrow()`/`useMediaQuery()` used consistently; `Layout` passes `isMobile`+`onMenu` to `Topbar` and `isMobile`+`open`+`onNavigate`+`onClose` to `Sidebar` — matches the Topbar/Sidebar task specs; `motion.js` exports `spring`/`springSoft`/`springSnappy`/`ease`/`dur`/`listItem`/`useReducedMotion` — referenced consistently in PageTransition/ActivityFeed/Tasks/Toast tasks; `AnimatedNumber` moves to `src/components/ui/AnimatedNumber.jsx` and is imported from `'../ui/AnimatedNumber'` (dashboard) — consistent. `h-scroll` CSS class defined in 0.3, used in 3.1/3.2/3.3/3.4. OK.

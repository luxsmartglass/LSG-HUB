# LSG Hub — Aurora Redesign, Theme System & Daily Tasks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Companion spec (read it):** `docs/superpowers/specs/2026-05-12-aurora-redesign-tasks-themes-design.md` — has the full visual/palette/UX detail. This plan references it rather than duplicating every pixel.

**Goal:** Add a Daily Tasks dashboard widget (with carryover + expandable full view), a light/dark theme system with a fresh "Aurora" palette, a premium UI overhaul (primitive component library, bolder type, motion), seven add-ons (⌘K palette, quick-create, undo toasts, "all clear" confetti, empty-state art, sidebar badges, light/dark/system), fix the broken "+ New Contact", and audit/fix the rest of the app.

**Architecture:** React 19 + Vite. Theming via a `ThemeProvider` context exposing a semantic-token object `c` consumed by inline styles (no CSS-in-JS lib; the app is already inline-styled). New `src/components/ui/` primitive library, all token-driven. Daily Tasks backed by a new `daily_tasks` Supabase table; carryover is query-driven (`due_date <= today`), no cron. Pure logic (task partitioning/sorting, theme mode resolution) is unit-tested with Vitest; everything else is verified by `npm run build` + `npm run lint` + a manual checklist.

**Tech Stack:** React 19, react-router-dom 7, recharts 3, react-beautiful-dnd, canvas-confetti, @supabase/supabase-js 2, Vite 6, Tailwind 4 (utilities only, mostly unused), Vitest (added in Phase 0).

**Branch:** all work on `feat/aurora-redesign` (already created). Commit after every task. Keep `npm run build` green at every commit.

**Conventions for this plan:**
- "Build-check" = `cd d:/downloads/lsg-hub && npm run build` → expect `✓ built` with no errors (the existing "chunks larger than 500 kB" warning is pre-existing and OK).
- "Lint-check" = `npm run lint` → expect no new errors (there may be pre-existing warnings; do not regress).
- Supabase rule (from the project handoff): **Supabase never throws.** Always `const { data, error } = await supabase…` then `if (error) { toast(error.message,'error'); return }`.
- Never use `??` for numeric defaults that must catch `NaN` — use `||`.
- Reference colors only via `c.*` from `useTheme()` in any file you touch — do not introduce new raw hex.

---

## File Structure

**New files:**
- `vitest.config.js` — test runner config
- `src/test/setup.js` — test setup (jsdom globals if needed)
- `src/theme/tokens.js` — `light` / `dark` semantic token objects + `weight` / `text` / `leading` / `radius` / `space` scales; `resolveMode(stored, prefersDark)` pure helper
- `src/theme/tokens.test.js` — tests for `resolveMode` and token shape parity
- `src/theme/ThemeProvider.jsx` — context provider, `localStorage` persistence, `<html data-theme>` sync, exposes `{ mode, setMode, cycleMode, c }`
- `src/theme/useTheme.js` — `useTheme()` hook (re-export from provider)
- `src/components/ui/Button.jsx`
- `src/components/ui/Card.jsx`
- `src/components/ui/Input.jsx` (exports `Input`, `Textarea`, `Select`, `Field` label-wrapper)
- `src/components/ui/Modal.jsx`
- `src/components/ui/Badge.jsx`
- `src/components/ui/IconButton.jsx`
- `src/components/ui/Tabs.jsx` (exports `Tabs`, `SegmentedControl`)
- `src/components/ui/Tooltip.jsx`
- `src/components/ui/Skeleton.jsx`
- `src/components/ui/CommandPalette.jsx` — ⌘K palette
- `src/components/ui/EmptyState.jsx` — **replaces** the current one (token-driven, optional inline SVG illustration)
- `src/components/ui/illustrations.jsx` — small set of palette-tinted inline SVGs (`<EmptyTasks/>`, `<EmptyContacts/>`, `<EmptyEstimates/>`, `<EmptyPipeline/>`, `<EmptyInvoices/>`, `<EmptyGeneric/>`)
- `src/components/ui/icons.jsx` — shared stroke-icon set used by primitives/palette/sidebar (sun, moon, plus, search, check, etc.) — only if not already centralized; otherwise extend existing
- `src/lib/tasks.js` — pure task helpers: `carriedOverDays(task, today)`, `partitionTodayTasks(tasks, today)`, `sortOpenTasks(tasks)`, `URGENCY_ORDER`, `URGENCY_META`
- `src/lib/tasks.test.js` — tests for the above
- `src/hooks/useDailyTasks.js` — load/add/toggle/update/delete tasks + realtime subscription
- `src/hooks/useActivityFeed.js` — recent cross-table activity for the dashboard
- `src/hooks/useCounts.js` — sidebar badge counts (open/overdue tasks, unpaid invoices, active deals) + realtime
- `src/components/dashboard/tasks/TasksWidget.jsx`
- `src/components/dashboard/tasks/TasksModal.jsx`
- `src/components/dashboard/tasks/TaskRow.jsx`
- `src/components/dashboard/tasks/UrgencyPicker.jsx`
- `src/components/dashboard/ActivityFeed.jsx` — dashboard mini activity feed
- `db/2026-05-12-daily_tasks.sql` — the SQL the user runs in the Supabase SQL editor (kept in-repo for reference)

**Heavily modified:**
- `src/main.jsx` — wrap in `<ThemeProvider>`, import order
- `src/App.jsx` — `<ThemeProvider>`, mount `<CommandPalette>` globally, themed loading/auth-callback screens
- `src/styles/globals.css` — fonts (Plus Jakarta Sans), `[data-theme]` body/scrollbar rules, reduced-motion guard, keep keyframes
- `src/components/layout/Layout.jsx`, `Sidebar.jsx`, `Topbar.jsx` — token-driven; Sidebar gets count badges; Topbar gets theme toggle + "+" quick-create
- `src/components/dashboard/Dashboard.jsx`, `StatsCards.jsx`, `RevenueChart.jsx`, `FunnelChart.jsx` — full rebuild to tokens/primitives/motion
- `src/components/ui/Toast.jsx` — token-driven; support `action` ({label,onClick}) for undo
- `src/components/ui/Spinner.jsx`, `LoadingScreen.jsx`, `ErrorBanner.jsx` — token-driven
- `src/components/contacts/Contacts.jsx`, `ContactDetail.jsx`, `ContactTable.jsx`, `ImportCSV.jsx` — token-driven + "+ New Contact" → create-mode panel + hardened insert
- `src/components/estimator/*`, `src/components/pipeline/*`, `src/components/invoices/*` (page chrome only — **not** PDF render logic or pricing math), `src/components/products/*`, `src/components/settings/*`, `src/components/aria/*`, `src/pages/Login.jsx`, `src/components/Splash.jsx` — token-driven + entrance/hover motion + bug fixes from the audit

**Deleted:**
- `src/index.css` (Vite-template boilerplate — confirm it's only imported by `main.jsx`; it isn't currently imported there, so likely already orphaned — verify with grep before delete)
- `src/App.css` (Vite-template boilerplate — confirm not imported)
- `src/components/dashboard/QuotesChart.jsx`, `src/components/dashboard/ClientTypeChart.jsx` (unused stubs)

---

## Phase 0 — Tooling

### Task 0.1: Add Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `src/test/setup.js`

- [ ] **Step 1: Install Vitest + jsdom**

Run: `cd d:/downloads/lsg-hub && npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom`
Expected: installs without errors; `package.json` devDependencies updated.

- [ ] **Step 2: Add test scripts to `package.json`**

In `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
```

- [ ] **Step 4: Create `src/test/setup.js`**

```js
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Sanity test — create `src/test/sanity.test.js`**

```js
import { describe, it, expect } from 'vitest'
describe('vitest', () => { it('runs', () => { expect(1 + 1).toBe(2) }) })
```

- [ ] **Step 6: Run tests**

Run: `npm run test`
Expected: 1 passing test.

- [ ] **Step 7: Delete `src/test/sanity.test.js`, build-check**

Run: `npm run build`
Expected: `✓ built`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.js src/test/setup.js
git commit -m "chore: add vitest test runner"
```

---

## Phase 1 — Theme foundation

### Task 1.1: Theme tokens + `resolveMode` (TDD)

**Files:**
- Create: `src/theme/tokens.js`
- Test: `src/theme/tokens.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { light, dark, resolveMode, weight, text } from './tokens'

describe('resolveMode', () => {
  it('uses stored value when valid', () => {
    expect(resolveMode('light', true)).toBe('light')
    expect(resolveMode('dark', false)).toBe('dark')
  })
  it("'system' or null falls back to OS preference", () => {
    expect(resolveMode('system', true)).toBe('dark')
    expect(resolveMode('system', false)).toBe('light')
    expect(resolveMode(null, true)).toBe('dark')
    expect(resolveMode(undefined, false)).toBe('light')
  })
  it('garbage stored value falls back to dark', () => {
    expect(resolveMode('banana', false)).toBe('dark')
  })
})

describe('token parity', () => {
  it('light and dark expose the same keys', () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort())
  })
  it('exposes weight and text scales', () => {
    expect(weight.body).toBeGreaterThanOrEqual(500)
    expect(text.base).toBe(14)
  })
})
```

- [ ] **Step 2: Run test → FAIL** (`Cannot find module './tokens'`). Run: `npm run test src/theme/tokens.test.js`

- [ ] **Step 3: Implement `src/theme/tokens.js`**

Use the exact palette from spec §3.2 and the type scale from §3.2a.

```js
// Semantic design tokens. Components read these via useTheme() -> `c`.
// NEVER hardcode raw hex in components; add a token here instead.

export const weight = { body: 500, meta: 500, label: 700, button: 600, strong: 700, hero: 800 }
export const text = { xs: 11, sm: 12.5, base: 14, md: 15, lg: 18, xl: 22, '2xl': 28, display: 38 }
export const leading = { tight: 1.2, snug: 1.35, normal: 1.55 }
export const radius = { sm: 6, md: 8, lg: 12, xl: 16, pill: 999 }
export const space = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48]
export const font = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif",
}

const dark = {
  mode: 'dark',
  bg: '#0c0a12',
  surface: '#15121d',
  surfaceHover: '#1c1828',
  surfaceElevated: '#221d2e',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.16)',
  textPrimary: '#ece9f2',
  textSecondary: '#b6b0c4',
  textMuted: '#8b85a0',
  textInverse: '#15121d',
  accent: '#8b5cf6',
  accentHover: '#7c4ddb',
  accentSoft: 'rgba(139,92,246,0.16)',
  accentText: '#ffffff',
  highlight: '#22d3ee',
  highlightSoft: 'rgba(34,211,238,0.14)',
  success: '#34d399', successSoft: 'rgba(52,211,153,0.14)',
  warning: '#fbbf24', warningSoft: 'rgba(251,191,36,0.14)',
  danger: '#f87171', dangerSoft: 'rgba(248,113,113,0.14)',
  overlay: 'rgba(7,5,12,0.6)',
  shadowSm: '0 1px 3px rgba(0,0,0,0.4)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.35)',
  shadowLg: '0 12px 40px rgba(0,0,0,0.5)',
  gradientHero: 'radial-gradient(120% 140% at 80% -20%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(100% 120% at -10% 120%, rgba(34,211,238,0.12), transparent 55%), linear-gradient(135deg, #1c1330 0%, #0c0a12 45%, #0e1b2e 100%)',
  font, weight, text, leading, radius, space,
}

const light = {
  mode: 'light',
  bg: '#f7f6fb',
  surface: '#ffffff',
  surfaceHover: '#f3f1f9',
  surfaceElevated: '#ffffff',
  border: '#e6e4ee',
  borderStrong: '#d4d1e0',
  textPrimary: '#1a1726',
  textSecondary: '#4a4658',
  textMuted: '#6b6680',
  textInverse: '#ffffff',
  accent: '#7c3aed',
  accentHover: '#6d28d9',
  accentSoft: 'rgba(124,58,237,0.10)',
  accentText: '#ffffff',
  highlight: '#0891b2',
  highlightSoft: 'rgba(8,145,178,0.10)',
  success: '#059669', successSoft: 'rgba(5,150,105,0.10)',
  warning: '#d97706', warningSoft: 'rgba(217,119,6,0.10)',
  danger: '#dc2626', dangerSoft: 'rgba(220,38,38,0.10)',
  overlay: 'rgba(26,23,38,0.4)',
  shadowSm: '0 1px 2px rgba(20,16,32,0.06)',
  shadowMd: '0 4px 16px rgba(20,16,32,0.08)',
  shadowLg: '0 12px 40px rgba(20,16,32,0.12)',
  gradientHero: 'radial-gradient(120% 140% at 80% -20%, rgba(124,58,237,0.10), transparent 55%), radial-gradient(100% 120% at -10% 120%, rgba(8,145,178,0.08), transparent 55%), linear-gradient(135deg, #ede9fe 0%, #f7f6fb 50%, #e0f2fe 100%)',
  font, weight, text, leading, radius, space,
}

export const THEMES = { light, dark }
export { light, dark }

export function resolveMode(stored, prefersDark) {
  if (stored === 'light' || stored === 'dark') return stored
  return prefersDark ? 'dark' : 'light'
}
```

- [ ] **Step 4: Run test → PASS.** Run: `npm run test src/theme/tokens.test.js`

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens.js src/theme/tokens.test.js
git commit -m "feat(theme): aurora design tokens + resolveMode (tested)"
```

### Task 1.2: `ThemeProvider` + `useTheme`

**Files:**
- Create: `src/theme/ThemeProvider.jsx`
- Create: `src/theme/useTheme.js`

- [ ] **Step 1: Implement `src/theme/ThemeProvider.jsx`**

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { THEMES, resolveMode } from './tokens'

const KEY = 'lsg_theme'           // stored value: 'light' | 'dark' | 'system'
const ThemeContext = createContext(null)

function prefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
}
function readStored() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(() => readStored() || 'system')   // user preference
  const [mode, setMode] = useState(() => resolveMode(readStored(), prefersDark()))

  // keep `mode` in sync when pref changes or when OS theme changes (only while pref === 'system')
  useEffect(() => {
    setMode(resolveMode(pref === 'system' ? null : pref, prefersDark()))
    if (pref !== 'system' || typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setMode(prefersDark() ? 'dark' : 'light')
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [pref])

  // persist + reflect on <html data-theme> for global CSS (scrollbars, body bg)
  useEffect(() => {
    try { localStorage.setItem(KEY, pref) } catch { /* ignore */ }
  }, [pref])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const setPreference = useCallback((p) => setPref(p), [])           // 'light'|'dark'|'system'
  const cycleMode = useCallback(() => {
    setPref(p => (p === 'light' ? 'dark' : p === 'dark' ? 'system' : 'light'))
  }, [])

  const value = { mode, pref, c: THEMES[mode], setPreference, cycleMode }
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
```

- [ ] **Step 2: Implement `src/theme/useTheme.js`** (convenience re-export)

```js
export { useTheme, ThemeProvider } from './ThemeProvider'
```

- [ ] **Step 3: Build-check.** Run: `npm run build` → `✓ built`.

- [ ] **Step 4: Commit**

```bash
git add src/theme/ThemeProvider.jsx src/theme/useTheme.js
git commit -m "feat(theme): ThemeProvider + useTheme (light/dark/system, persisted)"
```

### Task 1.3: Wire `ThemeProvider` into the app + global CSS

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/globals.css`
- Delete: `src/index.css`, `src/App.css` (after grep-confirming they're unused)

- [ ] **Step 1: Confirm `index.css` / `App.css` are unimported**

Run: `cd d:/downloads/lsg-hub && grep -rn "index.css\|App.css" src/` → expect no import lines (only `globals.css` is imported, in `main.jsx`). If `App.css` is imported somewhere, remove that import instead of deleting blindly. Then delete the orphans:
`git rm src/index.css src/App.css`

- [ ] **Step 2: Rewrite `src/styles/globals.css`**

Keep the keyframes/util classes; replace the fixed palette with `[data-theme]` rules; load Plus Jakarta Sans; add reduced-motion guard.

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root { --sidebar-width: 220px; }

/* App-shell background follows the theme; React components set their own via tokens. */
html[data-theme='dark']  { color-scheme: dark;  background: #0c0a12; }
html[data-theme='light'] { color-scheme: light; background: #f7f6fb; }
html:not([data-theme]) { background: #0c0a12; } /* pre-hydration default */

body {
  font-family: 'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  background: inherit;
}

/* Scrollbars */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
html[data-theme='dark']  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }
html[data-theme='light'] ::-webkit-scrollbar-thumb { background: rgba(26,23,38,0.18); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.5); }

/* Animations (kept from before) */
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.0); } 50% { box-shadow: 0 0 0 3px rgba(248,113,113,0.25); } }

.fade-up { animation: fadeUp 0.4s cubic-bezier(.22,1,.36,1) both; }
.fade-in { animation: fadeIn 0.3s ease both; }
.scale-in { animation: scaleIn 0.22s cubic-bezier(.22,1,.36,1) both; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
}
```

- [ ] **Step 3: Update `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './theme/ThemeProvider'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
```

- [ ] **Step 4: Update `src/App.jsx`** — make the two inline fallback screens (`session === undefined` and `AuthCallback`) read from `useTheme()` instead of hardcoded `#0f1d35` / `#c9a84c`. (Leave routing structure as-is; `CommandPalette` mount comes in Phase 2.) Example for the loading screen:

```jsx
import { useTheme } from './theme/useTheme'
// ...
function FullScreenBrand({ label }) {
  const { c } = useTheme()
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:c.bg }}>
      <div style={{ fontFamily:c.font.heading, fontSize:48, fontWeight:c.weight.hero, color:c.accent, letterSpacing:8 }}>LSG</div>
      {label && <span style={{ marginLeft:16, color:c.textMuted, fontFamily:c.font.body }}>{label}</span>}
    </div>
  )
}
```
Use `<FullScreenBrand/>` for `session === undefined`; use `<FullScreenBrand label="Signing in…" />` inside `AuthCallback`.

- [ ] **Step 5: Build-check + run app sanity**

Run: `npm run build` → `✓ built`. (Manual: `npm run dev`, confirm app loads, no console errors. The app will still look mostly like the old theme until later tasks — that's expected.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(theme): wire ThemeProvider, new global CSS + fonts, remove vite boilerplate"
```

### Task 1.4: Token-drive Layout / Sidebar / Topbar + theme toggle

**Files:**
- Modify: `src/components/layout/Layout.jsx`, `Sidebar.jsx`, `Topbar.jsx`
- Create: `src/components/ui/icons.jsx` (if no central icon module exists — check first; Sidebar already has inline icon components, you may export those)

- [ ] **Step 1: `icons.jsx`** — export small stroke-based icon components needed app-wide. At minimum: `SunIcon`, `MoonIcon`, `MonitorIcon`, `PlusIcon`, `SearchIcon`, `CheckIcon`, `XIcon`, `ChevronDownIcon`, `RefreshIcon`. Pattern (24×24, `fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"`), `size` prop defaulting to 16. (If `Sidebar.jsx` already defines nav icons inline, leave those; this module is for shared UI icons.)

- [ ] **Step 2: `Layout.jsx`** — `<main id="content">` background `c.bg`; add `transition:'background-color 0.25s ease'`. Pass nothing new down.

```jsx
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useTheme } from '../../theme/useTheme'

export default function Layout({ children, session }) {
  const { c } = useTheme()
  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden' }}>
      <Sidebar session={session} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar session={session} />
        <main id="content" style={{ flex:1, overflowY:'auto', padding:28, background:c.bg, color:c.textPrimary, transition:'background-color 0.25s ease, color 0.25s ease' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `Sidebar.jsx`** — replace all hardcoded colors with `c.*`:
  - container bg `c.surface`; logo `c.accent` (`fontFamily:c.font.heading`, `fontWeight:c.weight.hero`); divider `c.border`
  - nav links: active → `color:c.textPrimary, background:c.accentSoft, borderLeft:'3px solid '+c.accent`; inactive → `color:c.textSecondary`; hover → `background:c.surfaceHover`
  - user footer text `c.textSecondary`; avatar fallback bg `c.accentSoft`, text `c.accent`
  - **Count badges** (placeholder until Phase 3 Task 3.6 wires real data — for now accept an optional `counts` prop, default `{}`, and render a small pill only when `counts[key] > 0`). Add a `badge` field to relevant `NAV` entries: `/` → `counts.tasks` (open+overdue), `/invoices` → `counts.invoices` (unpaid), `/pipeline` → `counts.deals` (active). Badge style: `background:c.accent, color:c.accentText, fontSize:10, fontWeight:c.weight.label, borderRadius:c.radius.pill, padding:'1px 6px', marginLeft:'auto'`.

- [ ] **Step 4: `Topbar.jsx`** — token-drive; right cluster becomes `[ sync indicator ] [ QuickCreateButton placeholder ] [ ThemeToggle ] [ + New Estimate ]`:
  - bar bg `c.surface`, border-bottom `c.border`, title `c.textPrimary` (`fontFamily:c.font.heading, fontWeight:c.weight.strong`), shadow `c.shadowSm`
  - **ThemeToggle**: an `IconButton`-styled `<button>` (until `IconButton` exists in Phase 2, inline it) showing `SunIcon` when `mode==='light'`, `MoonIcon` when `'dark'`. On click: `cycleMode()` (light→dark→system→light). Title attr reflects `pref` ("Theme: dark — click for system"). Icon rotates 180° on press (`transition:'transform 0.3s'`).
  - "+ New Estimate" button: `background:c.accent, color:c.accentText`, hover `c.accentHover`.
  - The QuickCreate "+" button is added in Phase 2 Task 2.11 (leave a clear spot / TODO comment is fine *here only because it's wired two tasks later in the same plan* — actually: add a non-functional disabled `+` IconButton now and enable it in 2.11. Prefer that over a TODO.)

- [ ] **Step 5: Build-check.** Run: `npm run build` → `✓ built`. Manual: app chrome (sidebar/topbar/main bg) now uses Aurora colors; theme toggle flips light↔dark↔system and persists across reload.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(theme): token-drive Layout/Sidebar/Topbar; add theme toggle"
```

---

## Phase 2 — UI primitive library

> Each primitive: implement → `npm run build` → `npm run lint` → commit. Group small ones per commit where noted. All read `useTheme()`. Keep props minimal (YAGNI). Use `React.forwardRef` only where focus management needs it (`Input`, `Modal` content).

### Task 2.1: `Button`

**Files:** Create `src/components/ui/Button.jsx`

- [ ] **Step 1: Implement.** Props: `variant='primary'|'secondary'|'ghost'|'danger'|'subtle'`, `size='sm'|'md'|'lg'` (default `md`), `loading`, `icon` (ReactNode, leading), `fullWidth`, `as` (default `'button'`), plus passthrough. Styling from tokens:
  - `primary`: bg `c.accent`, color `c.accentText`, hover bg `c.accentHover`; `secondary`: bg `c.surfaceHover`, color `c.textPrimary`, border `c.border`; `ghost`: transparent, color `c.textSecondary`, border `c.border`, hover bg `c.surfaceHover`; `danger`: bg `c.danger`, color `#fff`; `subtle`: transparent, color `c.textSecondary`, no border, hover bg `c.surfaceHover`.
  - sizes: sm `padding:'6px 12px', fontSize:c.text.sm`; md `padding:'9px 16px', fontSize:c.text.base`; lg `padding:'12px 22px', fontSize:c.text.md`.
  - common: `fontFamily:c.font.body, fontWeight:c.weight.button, borderRadius:c.radius.md, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, transition:'background-color .15s, transform .08s, box-shadow .15s', border: variant uses border ? '1px solid '+c.border : 'none'`. Active/press: `:active` via `onMouseDown/Up` → `transform:'scale(0.97)'`. Disabled or `loading`: `opacity:0.6, cursor:'not-allowed'`, no hover.
  - `loading`: render a small spinning ring (reuse `Spinner` once it's token-driven, or an inline `<span>` with `animation:'spin .6s linear infinite'`) in place of `icon`; keep label.
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Commit** `git add src/components/ui/Button.jsx && git commit -m "feat(ui): Button primitive"`

### Task 2.2: `Card`

**Files:** Create `src/components/ui/Card.jsx`

- [ ] **Step 1: Implement.** Props: `as='div'`, `hover` (bool — adds lift), `pad=20`, `header` (ReactNode, rendered in a `c.surfaceHover`-ish strip with bottom border `c.border`), `interactive` (adds `cursor:pointer` + focus ring), passthrough `style`/`onClick`. Base: `background:c.surface, border:'1px solid '+c.border, borderRadius:c.radius.lg, boxShadow:c.shadowSm, transition:'background-color .25s, border-color .25s, box-shadow .2s, transform .2s'`. `hover` → on mouse enter `boxShadow:c.shadowMd, transform:'translateY(-2px)', borderColor:c.borderStrong`.
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Commit** `git commit -am "feat(ui): Card primitive"`

### Task 2.3: `Input` / `Textarea` / `Select` / `Field`

**Files:** Create `src/components/ui/Input.jsx` (named exports `Input`, `Textarea`, `Select`, `Field`)

- [ ] **Step 1: Implement.**
  - Shared input style: `width:'100%', background:c.mode==='dark' ? 'rgba(255,255,255,0.06)' : c.bg, border:'1px solid '+c.border, borderRadius:c.radius.md, padding:'9px 12px', color:c.textPrimary, fontSize:c.text.base, fontFamily:c.font.body, fontWeight:c.weight.body, outline:'none', transition:'border-color .15s, box-shadow .15s'`. Focus (`onFocus/onBlur` state): `borderColor:c.accent, boxShadow:'0 0 0 3px '+c.accentSoft`. `error` prop → `borderColor:c.danger`. Placeholder color `c.textMuted` (via a tiny injected `<style>` or accept it's browser-default; prefer a `::placeholder` rule added to `globals.css`: `input::placeholder, textarea::placeholder { color: var(--ph); }` — but we don't have CSS vars for tokens; simplest: set `style` won't do placeholders. **Decision:** add to `globals.css`: `html[data-theme='dark'] ::placeholder{color:#8b85a0;} html[data-theme='light'] ::placeholder{color:#6b6680;}` — do this here.)
  - `Input` = `forwardRef` `<input>`. `Textarea` = `<textarea>` (+ `minHeight:80, resize:'vertical'`). `Select` = `<select>` with a chevron background-image (use `c.textMuted` for the stroke; `appearance:'none'`, `paddingRight:32`).
  - `Field` = label wrapper: renders `<label style={{display:'block'}}>` with an uppercase eyebrow `<span style={{fontSize:c.text.xs, fontWeight:c.weight.label, color:c.textMuted, letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:6}}>{label}</span>` then `children`; optional `hint`/`error` line below in `c.textMuted`/`c.danger`.
- [ ] **Step 2:** add the `::placeholder` rules to `globals.css`.
- [ ] **Step 3: Build + lint check.**
- [ ] **Step 4: Commit** `git add src/components/ui/Input.jsx src/styles/globals.css && git commit -m "feat(ui): Input/Textarea/Select/Field primitives"`

### Task 2.4: `Modal`

**Files:** Create `src/components/ui/Modal.jsx`

- [ ] **Step 1: Implement.** Props: `open`, `onClose`, `title`, `size='sm'|'md'|'lg'|'full'` (default `md`; widths 420 / 560 / 820 / `min(1100px, 94vw)`; `full` also `maxHeight:'92vh'`), `children`, `footer` (ReactNode). Behavior: render `null` when `!open`. Portal not required (inline fixed overlay is fine — match the existing `ContactDetail` approach). Overlay: `position:'fixed', inset:0, background:c.overlay, backdropFilter:'blur(3px)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center', padding:24, animation:'fadeIn .2s ease both'`. Panel: `background:c.surface, border:'1px solid '+c.border, borderRadius:c.radius.xl, boxShadow:c.shadowLg, width:<size>, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', animation:'scaleIn .22s cubic-bezier(.22,1,.36,1) both'`. Header strip: title (`c.font.heading`, `c.weight.strong`, `c.textPrimary`) + close `IconButton`. Body: `padding:24, overflowY:'auto'`. Footer (if given): top border `c.border`, `padding:'14px 24px'`, right-aligned. Effects: on mount, `document.body.style.overflow='hidden'` (restore on unmount/close); `keydown` listener for `Escape` → `onClose`; backdrop click (target === overlay) → `onClose`; move focus to the panel on open (`ref.focus()` with `tabIndex={-1}`). Reduced-motion handled globally.
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Commit** `git commit -am "feat(ui): Modal primitive"`

### Task 2.5: `Badge` + `IconButton`

**Files:** Create `src/components/ui/Badge.jsx`, `src/components/ui/IconButton.jsx`

- [ ] **Step 1: `Badge`.** Props: `tone='neutral'|'accent'|'success'|'warning'|'danger'|'highlight'`, `solid` (bool), `children`. Soft (default): `background:c[tone+'Soft'] || c.surfaceHover, color: tone==='neutral'?c.textSecondary:c[tone]`. Solid: `background:c[tone]||c.accent, color:'#fff'` (neutral solid → `c.surfaceElevated`/`c.textPrimary`). Common: `display:'inline-flex', alignItems:'center', gap:4, fontSize:c.text.xs, fontWeight:c.weight.label, padding:'2px 8px', borderRadius:c.radius.pill, lineHeight:1.6, whiteSpace:'nowrap'`.
- [ ] **Step 2: `IconButton`.** Props: `label` (→ `aria-label` + `title`), `size=32`, `variant='ghost'|'subtle'|'solid'`, `children` (the icon), passthrough. Style: square `size`×`size`, `borderRadius:c.radius.md`, `display:'inline-flex', alignItems:'center', justifyContent:'center', color:c.textSecondary, cursor:'pointer', border:variant==='ghost'?'1px solid '+c.border:'none', background:variant==='solid'?c.accent:'transparent', transition:'background-color .15s, color .15s'`. Hover: `background:c.surfaceHover, color:c.textPrimary` (solid → `c.accentHover`). Focus-visible ring `0 0 0 3px c.accentSoft`.
- [ ] **Step 3: Build + lint check.**
- [ ] **Step 4: Commit** `git add src/components/ui/Badge.jsx src/components/ui/IconButton.jsx && git commit -m "feat(ui): Badge + IconButton primitives"`

### Task 2.6: `Tabs` + `SegmentedControl`

**Files:** Create `src/components/ui/Tabs.jsx` (named exports `Tabs`, `SegmentedControl`)

- [ ] **Step 1: `Tabs`.** Props: `tabs:[{key,label,badge?}]`, `active`, `onChange`. Render a row of buttons; active → `color:c.accent, borderBottom:'2px solid '+c.accent`; inactive → `color:c.textMuted, borderBottom:'2px solid transparent'`; hover inactive → `color:c.textSecondary`. `fontWeight:c.weight.button, fontSize:c.text.base, padding:'8px 14px', background:'transparent', cursor:'pointer', transition:'color .15s, border-color .15s'`. Optional small `Badge` after label.
- [ ] **Step 2: `SegmentedControl`.** Props: `options:[{key,label,color?}]`, `value`, `onChange`, `size='sm'|'md'`. A pill container `background:c.surfaceHover, borderRadius:c.radius.pill, padding:3, display:'inline-flex', gap:2`. Each option a button; selected → `background:c.surface, color: opt.color || c.textPrimary, boxShadow:c.shadowSm`; unselected → `color:c.textMuted`. `borderRadius:c.radius.pill, padding: size==='sm'?'4px 10px':'6px 14px', fontWeight:c.weight.button, fontSize: size==='sm'?c.text.sm:c.text.base, transition:'background-color .15s, color .15s'`.
- [ ] **Step 3: Build + lint check.**
- [ ] **Step 4: Commit** `git commit -am "feat(ui): Tabs + SegmentedControl primitives"`

### Task 2.7: `Tooltip` + `Skeleton`

**Files:** Create `src/components/ui/Tooltip.jsx`, `src/components/ui/Skeleton.jsx`

- [ ] **Step 1: `Tooltip`.** Props: `label`, `placement='top'`, `children`. Wrap children in a `span` with `position:'relative'` + `onMouseEnter/Leave` state; show an absolutely-positioned bubble: `background:c.surfaceElevated, color:c.textPrimary, border:'1px solid '+c.border, boxShadow:c.shadowMd, borderRadius:c.radius.sm, padding:'5px 9px', fontSize:c.text.xs, fontWeight:c.weight.body, whiteSpace:'nowrap', pointerEvents:'none', zIndex:9600, animation:'fadeIn .12s ease both'`, positioned per `placement`. Keep it simple — no collision detection.
- [ ] **Step 2: `Skeleton`.** Props: `w`, `h=14`, `radius=c.radius.sm`, `style`. Render a `div` with `width:w, height:h, borderRadius:radius, background: c.mode==='dark' ? 'linear-gradient(90deg,#1c1828 25%,#26202f 50%,#1c1828 75%)' : 'linear-gradient(90deg,#ece9f2 25%,#f3f1f9 50%,#ece9f2 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite'`.
- [ ] **Step 3: Build + lint check.**
- [ ] **Step 4: Commit** `git commit -am "feat(ui): Tooltip + Skeleton primitives"`

### Task 2.8: Restyle existing `ui/` — Toast (+ `action`), Spinner, LoadingScreen, ErrorBanner

**Files:** Modify `src/components/ui/Toast.jsx`, `Spinner.jsx`, `LoadingScreen.jsx`, `ErrorBanner.jsx`

- [ ] **Step 1: `Toast.jsx`** — keep the `ToastProvider`/`useToast` API; **extend** `show(msg, type, opts)` where `opts = { action: { label, onClick }, duration }`. When `action` is present, render a button at the toast's right (`background:'transparent', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', borderRadius:6, padding:'3px 10px', fontWeight:600, cursor:'pointer'`) that calls `onClick` then dismisses. Toast bg from tokens: `error` → `c.danger`, `warning` → `c.warning`, `success`/default → `c.surfaceElevated` with `border:'1px solid '+c.border` and text `c.textPrimary` (so it isn't a jarring navy block). Use `useTheme()` inside the rendered list. Default `duration` 3000; if `action`, default 6000. `animation:'fadeUp .25s ease both'`, `fontFamily:c.font.body, fontWeight:c.weight.body`.
- [ ] **Step 2: `Spinner.jsx`** — accept `size=18`, `color` (default `c.accent`); a CSS ring (`border:'2px solid '+c.border, borderTopColor: color, borderRadius:'50%', animation:'spin .6s linear infinite'`).
- [ ] **Step 3: `LoadingScreen.jsx`** — center a `Spinner` + `message` in `c.textMuted`; bg transparent (parent supplies bg).
- [ ] **Step 4: `ErrorBanner.jsx`** — `background:c.dangerSoft, border:'1px solid '+c.danger, color:c.danger, borderRadius:c.radius.md, padding:'12px 16px'`, message = `error?.message || String(error)`, optional `Retry` `Button variant="ghost" size="sm"`.
- [ ] **Step 5: Build + lint check.**
- [ ] **Step 6: Commit** `git add src/components/ui/*.jsx && git commit -m "feat(ui): retheme Toast (w/ action), Spinner, LoadingScreen, ErrorBanner"`

### Task 2.9: New `EmptyState` + illustrations

**Files:** Create `src/components/ui/illustrations.jsx`; replace `src/components/ui/EmptyState.jsx`

- [ ] **Step 1: `illustrations.jsx`** — export a handful of simple, on-brand inline SVGs (~120×100, 2px strokes) that take `c` colors via a `colors` prop or `useTheme()` internally: `EmptyTasks` (a checklist), `EmptyContacts` (people), `EmptyEstimates` (document), `EmptyPipeline` (kanban columns), `EmptyInvoices` (receipt), `EmptyGeneric` (sparkles). Use `c.border` for outlines, `c.accentSoft`/`c.highlightSoft` for fills, `c.accent` for one accent stroke. Keep them abstract/geometric — no clip-art.
- [ ] **Step 2: `EmptyState.jsx`** — props: `illustration` (one of the names above, or a ReactNode; default `'EmptyGeneric'`), `title`, `message`, `action`, `onAction`. Layout: center, `padding:'56px 20px'`; render the chosen illustration; `title` in `c.font.heading, fontSize:c.text.lg, color:c.textPrimary, fontWeight:c.weight.strong`; `message` in `c.text.base, color:c.textMuted`; `action` → `Button variant="primary" size="sm"`.
- [ ] **Step 3: Build + lint check** (existing call sites still work — old props `icon`/`title`/`message`/`action`/`onAction` are a subset; `icon` is just ignored now. Grep `EmptyState` usages and confirm none pass anything that breaks.)
- [ ] **Step 4: Commit** `git add src/components/ui/EmptyState.jsx src/components/ui/illustrations.jsx && git commit -m "feat(ui): token-driven EmptyState + illustration set"`

### Task 2.10: `CommandPalette` (⌘K)

**Files:** Create `src/components/ui/CommandPalette.jsx`

- [ ] **Step 1: Implement.** A context-free component mounted once in `App.jsx`. Internal state: `open`, `query`, `selectedIndex`. Global key listener (added in `useEffect`): `(e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'` → `e.preventDefault(); setOpen(o=>!o)`. Also export an imperative open via a module-level event (`window.dispatchEvent(new Event('lsg:open-command-palette'))`) and listen for it — so the Topbar "+" can trigger the same palette (Task 2.11). When open: a `Modal`-styled overlay (reuse `Modal` with `size='md'`, no title — or a custom slim panel anchored near top: `marginTop:'12vh'`). Top: a borderless `Input` (autofocus) with a `SearchIcon`. Below: a filtered list of commands.
  - **Commands** (static array, each `{ id, label, hint, icon, run }`):
    - Navigate: Home `/`, Pipeline `/pipeline`, All Estimates `/estimates`, New Estimate `/estimator`, Contacts `/contacts`, Invoices `/invoices`, Products `/products`, Settings `/settings` — `run: () => navigate(path)`
    - Create: New Estimate (`navigate('/estimator')`), New Contact (`navigate('/contacts?new=1')` — Contacts reads `?new=1` to open create panel, see Phase 6), New Deal (`navigate('/pipeline?new=1')`), New Invoice (`navigate('/invoices?new=1')`), New Task (`window.dispatchEvent(new Event('lsg:new-task'))` — TasksWidget listens, see Phase 4) — each hinted "Create".
    - Theme: "Switch to light", "Switch to dark", "Use system theme" — call `setPreference(...)` from `useTheme()`.
  - Filtering: case-insensitive substring on `label`+`hint`; arrow keys move `selectedIndex` (wrap), `Enter` runs the selected command then closes, `Escape` closes. Each row: icon + label (left) + hint badge (right); selected row → `background:c.accentSoft`. Use `useNavigate()` from react-router; use `useTheme()`.
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Mount in `App.jsx`** — render `<CommandPalette />` inside `<ToastProvider>` (sibling of `<Routes>`), so it's available on every authenticated page. (It's fine for it to be present on `/login` too; harmless.)
- [ ] **Step 4: Build-check; manual: ⌘K opens the palette, typing filters, Enter navigates, Esc closes.**
- [ ] **Step 5: Commit** `git add src/components/ui/CommandPalette.jsx src/App.jsx && git commit -m "feat: ⌘K command palette"`

### Task 2.11: Topbar "+" quick-create + enable theme toggle button via IconButton

**Files:** Modify `src/components/layout/Topbar.jsx`

- [ ] **Step 1:** Replace the inline theme-toggle button from Task 1.4 with the real `IconButton` (variant `ghost`), icon = `mode==='light' ? <SunIcon/> : <MoonIcon/>`, `label` reflecting `pref`. Add a "+" `IconButton` (variant `ghost`, `<PlusIcon/>`, label "Quick create (⌘K)") that does `window.dispatchEvent(new Event('lsg:open-command-palette'))`. Order in the right cluster: `[ sync indicator ] [ + IconButton ] [ theme IconButton ] [ + New Estimate Button ]`.
- [ ] **Step 2: Build + lint check; manual: "+" opens the command palette.**
- [ ] **Step 3: Commit** `git commit -am "feat: topbar quick-create button + IconButton theme toggle"`

---

## Phase 3 — Dashboard rebuild

### Task 3.1: `useActivityFeed` hook

**Files:** Create `src/hooks/useActivityFeed.js`

- [ ] **Step 1: Implement.** `useActivityFeed(limit=8)` returns `{ items, loading, error }`. On mount, run in parallel (each with `{data,error}` checks): `estimates` (`select('id, client_name, total_revenue, created_at').order('created_at',{ascending:false}).limit(limit)`), `pipeline` (`select('id, client_name, stage, created_at').order('created_at',{ascending:false}).limit(limit)`), `invoices` (`select('id, client_name, total_amount, paid_date, created_at').order('created_at',{ascending:false}).limit(limit)`), `contacts` (`select('id, name, created_at').order('created_at',{ascending:false}).limit(limit)`). Map each to `{ kind:'estimate'|'deal'|'invoice'|'invoice_paid'|'contact', id, label, sub, at, icon, tone }` (an `invoice` row with `paid_date` produces an extra `invoice_paid` item dated `paid_date`). Merge, sort by `at` desc, slice `limit`. If a query errors, skip that source (don't fail the whole feed) but set `error` to the first error for optional surfacing. No realtime needed (cheap, refetched on dashboard mount).
- [ ] **Step 2: Build-check.**
- [ ] **Step 3: Commit** `git add src/hooks/useActivityFeed.js && git commit -m "feat(dashboard): useActivityFeed hook"`

### Task 3.2: `StatsCards` rebuild

**Files:** Modify `src/components/dashboard/StatsCards.jsx`

- [ ] **Step 1: Implement.** Keep the `AnimatedNumber` helper but add `fontVariantNumeric:'tabular-nums'`. Wrap each stat in `<Card hover interactive onClick={()=>navigate(deepLink)}>`. Each card: eyebrow label (`c.textMuted`, `c.weight.label`, uppercase, `0.08em`); value (`c.font.heading` or heavy sans at `c.text['2xl']`, `c.textPrimary`); a trend chip — for `Pipeline Value` and `Est. Total Margin` compute a cheap MoM-ish delta only **if** the data needed is already loaded (it isn't, currently — so for v1 show a neutral `Badge tone="neutral"` with the count context, e.g. "from N estimates"; **do not fabricate** ▲/▼). Add `deepLink` per card: Total Estimates→`/estimates`, Pipeline Value→`/pipeline`, Est. Total Margin→`/estimates`, Avg Margin %→`/estimates`, Active Deals→`/pipeline`, Warm Holds→`/pipeline`. Staggered `fadeUp` (`animation: 'fadeUp .4s cubic-bezier(.22,1,.36,1) ${i*0.05}s both'`). Props unchanged (`{ stats }`); needs `useNavigate` + `useTheme`.
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Commit** `git commit -am "feat(dashboard): rebuild StatsCards with Card primitive, tokens, deep-links"`

### Task 3.3: `RevenueChart` + `FunnelChart` retheme

**Files:** Modify `src/components/dashboard/RevenueChart.jsx`, `FunnelChart.jsx`

- [ ] **Step 1: `RevenueChart`** — wrap in `<Card>`; title `c.font.heading, c.textPrimary, c.weight.strong`; recharts: `CartesianGrid stroke={c.border}`, axis ticks `fill:c.textMuted`, gradient `stopColor={c.accent}` (0.35→0), `Area stroke={c.accent} strokeWidth={2.5}` with `isAnimationActive` (draw-in), `Tooltip contentStyle={{background:c.surfaceElevated,border:'1px solid '+c.border,borderRadius:c.radius.md,color:c.textPrimary,boxShadow:c.shadowMd}} labelStyle={{color:c.textMuted}} cursor={{stroke:c.accentSoft}}`. Empty state → `<EmptyState illustration="EmptyEstimates" title="No revenue yet" message="Saved estimates will chart here." />` (compact variant — pass a `compact` prop to EmptyState that reduces padding, or just accept the default). `useTheme`.
- [ ] **Step 2: `FunnelChart`** — wrap in `<Card>`; title themed; stage label `c.textSecondary`; count `s.color` (stage colors stay — they're semantic); track `background:c.surfaceHover`; bar `background:s.color` with `transition:'width .8s cubic-bezier(.22,1,.36,1)'`. `useTheme`.
- [ ] **Step 3: Build + lint check.**
- [ ] **Step 4: Commit** `git commit -am "feat(dashboard): retheme RevenueChart + FunnelChart (light+dark, draw-in)"`

### Task 3.4: `ActivityFeed` component

**Files:** Create `src/components/dashboard/ActivityFeed.jsx`

- [ ] **Step 1: Implement.** Props: `items`, `loading`. `<Card>` with header "Activity" + a "View all" `Button variant="subtle" size="sm"` (no-op for now, or `navigate('/estimates')` as a stand-in). Body: if `loading` → 4× `Skeleton` rows; if empty → `<EmptyState illustration="EmptyGeneric" title="Nothing yet" message="Activity across the hub shows up here." />`; else a vertical list — each row: a small round icon chip tinted from `item.tone` (`background:c[tone+'Soft']`, the icon in `c[tone]`), label (`c.textPrimary, c.weight.button`), sub (`c.textMuted, c.text.sm`), and a right-aligned relative time (`c.textMuted, c.text.xs`) using `date-fns`'s `formatDistanceToNowStrict`. Dividers `c.border`. `useTheme`.
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Commit** `git add src/components/dashboard/ActivityFeed.jsx && git commit -m "feat(dashboard): ActivityFeed component"`

### Task 3.5: `Dashboard.jsx` rebuild (hero, quick actions, layout, wiring)

**Files:** Modify `src/components/dashboard/Dashboard.jsx`; delete `QuotesChart.jsx`, `ClientTypeChart.jsx`

- [ ] **Step 1:** Rebuild the page (keep `loadData`/stats logic; `QUOTES` array; clock):
  - **Hero:** a `Card`-less section with `background:c.gradientHero, borderRadius:c.radius.xl, padding:'34px 38px', position:'relative', overflow:'hidden'`. Greeting `${greeting()}, LSG 👋` in `c.font.heading, fontSize:c.text.display, fontWeight:c.weight.hero, color:c.textPrimary`. Date line `c.textMuted`. Clock `c.font.heading, fontSize:34, color:c.accent, fontVariantNumeric:'tabular-nums'`. A one-line "day summary": `${stats.activeDeals} active deals · ${openTaskCount} open tasks` in `c.textSecondary` (openTaskCount comes from the tasks widget via a lifted state or a second call — simplest: `TasksWidget` accepts `onCount` callback; Dashboard stores it). Subtle mouse-parallax on the bloom layers (a couple absolutely-positioned radial divs that translate ~6px with mouse; skip if `prefers-reduced-motion` — check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`).
  - **Quote card:** `<Card>` with the daily quote, themed (quote mark in `c.accentSoft`, author in `c.accent`).
  - **Layout order:** Hero → `<TasksWidget onCount={setOpenTaskCount} />` (full width) → `<StatsCards stats={stats} />` → grid `1fr 380px`: `<RevenueChart .../>` + `<FunnelChart .../>` → grid `1fr 1fr` (or stacked on narrow): Quick Actions card + `<ActivityFeed items={activity} loading={activityLoading} />`.
  - **Quick Actions:** a `<Card>` titled "Quick Actions"; each action a `<Button variant="secondary" fullWidth>` with a left icon chip tinted `c.accentSoft`/`c.highlightSoft`/`c.successSoft` + title + sub; on click `navigate(path)`. Actions: New Estimate `/estimator`, View Pipeline `/pipeline`, All Clients `/contacts`, New Invoice `/invoices`.
  - Wire `const { items: activity, loading: activityLoading } = useActivityFeed()`.
  - `ErrorBanner` for the stats `error` stays.
  - Everything wrapped so the page itself has `animation:'fade-up'`-ish entrance (apply `.fade-up` to the root, plus `fadeUp` stagger on cards).
- [ ] **Step 2:** `git rm src/components/dashboard/QuotesChart.jsx src/components/dashboard/ClientTypeChart.jsx`
- [ ] **Step 3: Build + lint check; manual: dashboard renders in both themes, no overflow, animations smooth, deep-links work.**
- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(dashboard): full rebuild — hero, tasks slot, stat cards, charts, quick actions, activity feed"`

> NOTE: Task 3.5 references `<TasksWidget>` which doesn't exist until Phase 4. To keep the build green, in Step 1 add a temporary local placeholder component `function TasksWidget(){ return null }` *inside Dashboard.jsx* and replace it with the real import in Phase 4 Task 4.5. (Alternative: reorder — do Phase 4 before 3.5. Either is fine; the placeholder keeps phases independent.)

### Task 3.6: `useCounts` hook + wire Sidebar badges

**Files:** Create `src/hooks/useCounts.js`; modify `src/components/layout/Sidebar.jsx`

- [ ] **Step 1: `useCounts`** — returns `{ tasks, invoices, deals }`. On mount + on realtime change of `daily_tasks` / `invoices` / `pipeline` (use `useRealtime` for each, refetch on payload): `tasks` = count of `daily_tasks` where `completed=false AND due_date <= today` (use `.select('id', { count:'exact', head:true })` with filters); `invoices` = count where `paid_date is null`; `deals` = count where `stage not in ('lost','won')`. Each query `{data,error,count}`; on error, leave that count `0`. (If `daily_tasks` doesn't exist yet — i.e., the user hasn't run the SQL — the query errors; swallow it → `0`.)
- [ ] **Step 2:** In `Sidebar.jsx`, `const counts = useCounts()` and pass into the `NAV` rendering so `/` shows `counts.tasks`, `/invoices` shows `counts.invoices`, `/pipeline` shows `counts.deals` (only when `>0`).
- [ ] **Step 3: Build + lint check.**
- [ ] **Step 4: Commit** `git add src/hooks/useCounts.js src/components/layout/Sidebar.jsx && git commit -m "feat: sidebar count badges (tasks/invoices/deals) via useCounts"`

---

## Phase 4 — Daily Tasks: data, helpers, hook, widget

### Task 4.1: Tasks SQL (for the user) + in-repo copy

**Files:** Create `db/2026-05-12-daily_tasks.sql`

- [ ] **Step 1:** First, **inspect existing RLS** so the policy matches: run a quick check (via the app's data, or just go with the handoff doc's claim that `authenticated` has full access). Write `db/2026-05-12-daily_tasks.sql`:

```sql
-- Run this in the Supabase SQL editor (project: LSG Hub).
create table if not exists public.daily_tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  urgency      text not null default 'medium' check (urgency in ('low','medium','high')),
  due_date     date not null default current_date,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists daily_tasks_open_idx on public.daily_tasks (completed, due_date);

alter table public.daily_tasks enable row level security;

-- Mirror the access pattern used by the other app tables (authenticated = full access).
drop policy if exists "daily_tasks authenticated full access" on public.daily_tasks;
create policy "daily_tasks authenticated full access" on public.daily_tasks
  for all to authenticated using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.daily_tasks;
```

- [ ] **Step 2: Commit** `git add db/2026-05-12-daily_tasks.sql && git commit -m "chore(db): daily_tasks table SQL (run in Supabase editor)"`
- [ ] **Step 3: (Out-of-band)** Surface this to the user during execution: "Run `db/2026-05-12-daily_tasks.sql` in your Supabase SQL editor before the Tasks widget will work." The widget must degrade gracefully until then (Task 4.4 handles the error path).

### Task 4.2: Task helpers (TDD)

**Files:** Create `src/lib/tasks.js`; Test `src/lib/tasks.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { carriedOverDays, partitionTodayTasks, sortOpenTasks, URGENCY_ORDER } from './tasks'

const T = (over) => ({ id: Math.random().toString(36), title:'x', urgency:'medium', due_date:'2026-05-12', completed:false, completed_at:null, ...over })
const TODAY = '2026-05-12'

describe('carriedOverDays', () => {
  it('0 when due today or future', () => {
    expect(carriedOverDays(T({ due_date:'2026-05-12' }), TODAY)).toBe(0)
    expect(carriedOverDays(T({ due_date:'2026-05-20' }), TODAY)).toBe(0)
  })
  it('counts days when overdue', () => {
    expect(carriedOverDays(T({ due_date:'2026-05-10' }), TODAY)).toBe(2)
  })
})

describe('partitionTodayTasks', () => {
  it('open = incomplete with due_date <= today; future not included', () => {
    const open1 = T({ due_date:'2026-05-12' })
    const carried = T({ due_date:'2026-05-09' })
    const future = T({ due_date:'2026-05-15' })
    const doneToday = T({ completed:true, completed_at:'2026-05-12T10:00:00Z' })
    const donePast = T({ completed:true, completed_at:'2026-05-10T10:00:00Z' })
    const { open, doneToday: dt, hidden } = partitionTodayTasks([open1, carried, future, doneToday, donePast], TODAY)
    expect(open.map(t=>t.id)).toEqual(expect.arrayContaining([open1.id, carried.id]))
    expect(open).toHaveLength(2)
    expect(dt.map(t=>t.id)).toEqual([doneToday.id])
    expect(hidden.map(t=>t.id)).toEqual(expect.arrayContaining([future.id, donePast.id]))
  })
})

describe('sortOpenTasks', () => {
  it('high urgency first, then oldest due_date', () => {
    const a = T({ urgency:'low', due_date:'2026-05-01' })
    const b = T({ urgency:'high', due_date:'2026-05-11' })
    const c = T({ urgency:'high', due_date:'2026-05-05' })
    expect(sortOpenTasks([a,b,c]).map(t=>t.id)).toEqual([c.id, b.id, a.id])
  })
})

describe('URGENCY_ORDER', () => {
  it('high > medium > low', () => {
    expect(URGENCY_ORDER.high).toBeGreaterThan(URGENCY_ORDER.medium)
    expect(URGENCY_ORDER.medium).toBeGreaterThan(URGENCY_ORDER.low)
  })
})
```

- [ ] **Step 2: Run → FAIL.** Run: `npm run test src/lib/tasks.test.js`

- [ ] **Step 3: Implement `src/lib/tasks.js`**

```js
export const URGENCY_ORDER = { high: 3, medium: 2, low: 1 }
// UI metadata is filled with theme colors at render time; this maps urgency -> token key + label.
export const URGENCY_META = {
  high:   { label: 'High',   toneKey: 'danger'  },
  medium: { label: 'Medium', toneKey: 'warning' },
  low:    { label: 'Low',    toneKey: 'textMuted' },
}

function dayDiff(a, b) { // a, b are 'YYYY-MM-DD'; returns a - b in whole days
  return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000)
}
function ymd(d) { // Date | string -> 'YYYY-MM-DD'
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toISOString().slice(0, 10)
}

export function carriedOverDays(task, today) {
  const diff = dayDiff(today, task.due_date)
  return diff > 0 ? diff : 0
}

export function partitionTodayTasks(tasks, today) {
  const open = [], doneToday = [], hidden = []
  for (const t of tasks || []) {
    if (!t.completed) {
      if (dayDiff(today, t.due_date) >= 0) open.push(t)   // due today or earlier
      else hidden.push(t)                                  // scheduled for the future
    } else if (t.completed_at && ymd(t.completed_at) === today) {
      doneToday.push(t)
    } else {
      hidden.push(t)                                       // completed on a past day
    }
  }
  return { open: sortOpenTasks(open), doneToday: doneToday.sort((a,b)=> (b.completed_at||'').localeCompare(a.completed_at||'')), hidden }
}

export function sortOpenTasks(tasks) {
  return [...(tasks || [])].sort((a, b) => {
    const u = (URGENCY_ORDER[b.urgency] || 0) - (URGENCY_ORDER[a.urgency] || 0)
    if (u) return u
    return String(a.due_date).localeCompare(String(b.due_date))   // oldest first
  })
}

export function todayStr() { return new Date().toISOString().slice(0, 10) }
```

- [ ] **Step 4: Run → PASS.** Run: `npm run test src/lib/tasks.test.js`
- [ ] **Step 5: Commit** `git add src/lib/tasks.js src/lib/tasks.test.js && git commit -m "feat(tasks): pure task helpers (carryover/partition/sort) — tested"`

### Task 4.3: `useDailyTasks` hook

**Files:** Create `src/hooks/useDailyTasks.js`

- [ ] **Step 1: Implement.**

```js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtime } from './useRealtime'
import { useToast } from '../components/ui/Toast'

export function useDailyTasks() {
  const toast = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) { setError(error); setTasks([]) }     // table missing / RLS -> widget shows ErrorBanner with instructions
    else { setError(null); setTasks(data || []) }
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])
  useRealtime('daily_tasks', () => { reload() })

  const addTask = useCallback(async (title, urgency = 'medium', due_date) => {
    const t = title.trim()
    if (!t) return
    const record = { title: t, urgency }
    if (due_date) record.due_date = due_date
    const { data, error } = await supabase.from('daily_tasks').insert(record).select()
    if (error) { toast(error.message, 'error'); return }
    setTasks(prev => [...prev, ...(data || [])])
  }, [toast])

  const updateTask = useCallback(async (id, patch) => {
    const prev = tasks
    setTasks(p => p.map(x => x.id === id ? { ...x, ...patch } : x))   // optimistic
    const { error } = await supabase.from('daily_tasks').update(patch).eq('id', id)
    if (error) { toast(error.message, 'error'); setTasks(prev) }
  }, [tasks, toast])

  const toggleTask = useCallback((task) => {
    return updateTask(task.id, task.completed
      ? { completed: false, completed_at: null }
      : { completed: true, completed_at: new Date().toISOString() })
  }, [updateTask])

  const deleteTask = useCallback(async (id) => {
    const prev = tasks
    setTasks(p => p.filter(x => x.id !== id))   // optimistic
    const { error } = await supabase.from('daily_tasks').delete().eq('id', id)
    if (error) { toast(error.message, 'error'); setTasks(prev) }
  }, [tasks, toast])

  return { tasks, loading, error, reload, addTask, updateTask, toggleTask, deleteTask }
}
```

- [ ] **Step 2: Build-check.**
- [ ] **Step 3: Commit** `git add src/hooks/useDailyTasks.js && git commit -m "feat(tasks): useDailyTasks hook (CRUD + realtime + optimistic)"`

### Task 4.4: `UrgencyPicker` + `TaskRow`

**Files:** Create `src/components/dashboard/tasks/UrgencyPicker.jsx`, `TaskRow.jsx`

- [ ] **Step 1: `UrgencyPicker`** — thin wrapper over `SegmentedControl`: `options = [{key:'low',label:'Low',color:c.textMuted},{key:'medium',label:'Med',color:c.warning},{key:'high',label:'High',color:c.danger}]`, `value`, `onChange`, `size='sm'`. (Also export a tiny `UrgencyDot` = a 7px round dot colored by urgency token, for compact display.)
- [ ] **Step 2: `TaskRow`** — props: `task`, `today`, `onToggle`, `onDelete`, `onRename(id, title)`, `onSetDue(id, date)` (optional — only used in the modal), `showDue` (bool, default false). Layout: a flex row, `padding:'10px 12px', borderRadius:c.radius.md`, `borderLeft:'3px solid '+urgencyColor`, hover bg `c.surfaceHover`. Left: a checkbox button (custom — a `c.radius.sm` square, `border:'2px solid '+(task.completed?c.accent:c.border)`, when completed filled `c.accent` with a white `CheckIcon`; click → `onToggle(task)`; animate the check with `scaleIn`). Middle: title — render as text; on click switch to an inline `Input` (autofocus, `onBlur`/`Enter` commits via `onRename`, `Escape` cancels); if `task.completed` → `textDecoration:'line-through', color:c.textMuted`. Right cluster: a `↻ Nd` `Badge tone="neutral"` when `carriedOverDays(task,today)>0` (Tooltip "Carried over from {date}"); if `showDue`, a small date `Input type="date"` bound to `task.due_date` → `onSetDue`; a hover-revealed delete `IconButton variant="subtle"` (`<XIcon/>`, label "Delete task"). If `task.urgency==='high'` and carried over → add `animation:'pulseGlow 2.2s ease-in-out infinite'` to the row. `useTheme`.
- [ ] **Step 3: Build + lint check.**
- [ ] **Step 4: Commit** `git add src/components/dashboard/tasks/UrgencyPicker.jsx src/components/dashboard/tasks/TaskRow.jsx && git commit -m "feat(tasks): UrgencyPicker + TaskRow components"`

### Task 4.5: `TasksWidget` + dashboard wiring + "all clear" confetti

**Files:** Create `src/components/dashboard/tasks/TasksWidget.jsx`; modify `src/components/dashboard/Dashboard.jsx`

- [ ] **Step 1: `TasksWidget`** — props: `onCount` (callback fired with open-task count), `onExpand` (callback to open the modal — Dashboard owns the modal state, or the widget owns it; simplest: widget owns a `modalOpen` state and renders `<TasksModal>` itself). Internals: `const { tasks, loading, error, addTask, toggleTask, updateTask, deleteTask } = useDailyTasks()`; `const today = todayStr()`; `const { open, doneToday } = partitionTodayTasks(tasks, today)`; `useEffect(()=>onCount?.(open.length), [open.length])`. Listen for `window` event `'lsg:new-task'` → focus the add input. Render a `<Card header={...}>`:
  - **Header:** "Today's Tasks" (`c.font.heading, c.weight.strong`) + `Badge tone="accent"` with `open.length` + an expand `IconButton` (`label="Expand tasks"`, an "expand" glyph) → `setModalOpen(true)`. Make the whole header clickable to expand too.
  - **Add row:** an `<Input>` ("Add a task…", ref'd for the focus event) + `<UrgencyPicker value={newUrgency} onChange={setNewUrgency} />` + a `<Button size="sm" icon={<PlusIcon/>}>Add</Button>`; `Enter` in the input or button click → `addTask(text, newUrgency)` then clear text (keep urgency). 
  - **Body:** if `error` → `<ErrorBanner error={{message:'Tasks need a one-time setup — run db/2026-05-12-daily_tasks.sql in Supabase.'}} />` (use the real `error.message` if it's not the "relation does not exist" case). If `loading` → 3× `Skeleton`. If `open.length===0 && doneToday.length===0` → `<EmptyState illustration="EmptyTasks" title="Nothing on the list" message="Add your first task above." />`. Else: render up to 5 `<TaskRow>` from `open` (then a "+N more" `Button variant="subtle" size="sm"` → expand if `open.length>5`), then a thin divider, then `doneToday` rows (dimmed). 
  - **"All clear" confetti:** keep a `prevOpenLen` ref; in an effect, if `prevOpenLen.current > 0 && open.length === 0 && !loading` → `import('canvas-confetti')` and fire a small burst (`confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, disableForReducedMotion: true })`); update the ref.
  - Renders `<TasksModal open={modalOpen} onClose={()=>setModalOpen(false)} {...taskApi} today={today} />`.
- [ ] **Step 2:** In `Dashboard.jsx`, replace the temporary `function TasksWidget(){return null}` placeholder with `import TasksWidget from './tasks/TasksWidget'` and keep `<TasksWidget onCount={setOpenTaskCount} />`.
- [ ] **Step 3:** Add the "New Task" command in `CommandPalette` (already specced in 2.10) — verify it dispatches `'lsg:new-task'`; if the user isn't on the dashboard, also `navigate('/')` first then dispatch on next tick.
- [ ] **Step 4: Build + lint check; manual (after running the SQL): add tasks, set urgency, check/uncheck, rename, delete; carryover badge shows for an overdue task; checking the last one fires confetti; "+N more"/expand opens the modal.**
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(tasks): TasksWidget + dashboard wiring + all-clear confetti"`

---

## Phase 5 — Daily Tasks: expanded view

### Task 5.1: `TasksModal`

**Files:** Create `src/components/dashboard/tasks/TasksModal.jsx`

- [ ] **Step 1: Implement.** Props: `open`, `onClose`, `tasks`, `today`, `addTask`, `toggleTask`, `updateTask`, `deleteTask` (passed from `TasksWidget`). Render `<Modal open={open} onClose={onClose} size="full" title="Tasks">`. Inside:
  - **Add row** (same as the widget's, full width).
  - **Filter:** `<Tabs tabs={[{key:'all',label:'All'},{key:'high',label:'High'},{key:'medium',label:'Medium'},{key:'low',label:'Low'}]} active={filter} onChange={setFilter} />`.
  - **Open section:** `partitionTodayTasks(tasks, today).open` filtered by urgency; render `<TaskRow showDue ... onSetDue={(id,d)=>updateTask(id,{due_date:d})} />` for each. Also show **future-scheduled** tasks (the `hidden` ones with `!completed && due_date > today`) under a "Scheduled" subheader, each with its date and a `Badge tone="highlight"` showing the date.
  - **Completed (last 30 days):** all `completed` tasks with `completed_at` within 30 days, grouped by `completed_at` date (newest group first), each group a subheader (`format(date, 'EEE, MMM d')`) then dimmed `<TaskRow>`s; an "uncheck" via the checkbox restores them.
  - Empty filter result → a compact `EmptyState`.
  - `useTheme`.
- [ ] **Step 2: Build + lint check; manual: open from the widget, filter works, can set a future due date (task leaves "Today" list, appears under "Scheduled"), history groups by day, uncheck restores.**
- [ ] **Step 3: Commit** `git add src/components/dashboard/tasks/TasksModal.jsx && git commit -m "feat(tasks): expandable TasksModal (filters, scheduling, 30-day history)"`

---

## Phase 6 — Per-page restyle + contact fix

> For each page: replace hardcoded hex with `c.*` from `useTheme()`; adopt `Card`/`Button`/`Input`/`Modal`/`Badge`/`EmptyState` where low-risk; add a `.fade-up` entrance on the page root + hover transitions on cards/rows; **do not change data logic, pricing math, or PDF render functions**. One commit per page (or per tightly-related cluster). Build + lint check before each commit.

### Task 6.1: Contacts — token-drive + "+ New Contact" create-mode fix

**Files:** Modify `src/components/contacts/Contacts.jsx`, `ContactDetail.jsx`, `ContactTable.jsx`, `ImportCSV.jsx`

- [ ] **Step 1:** Token-drive all four files (replace `NAVY/GOLD/CREAM/BG` consts with `useTheme()` `c`; map old colors → tokens: navy header → `c.surface`; gold accents → `c.accent`; cream text → `c.textPrimary`; `rgba(255,255,255,0.08)` inputs → use the `Input` primitive).
- [ ] **Step 2: Fix "+ New Contact".** `ContactDetail` currently only edits an existing contact. Add a **create mode**: `ContactDetail` accepts `contact` possibly being `null`/`{}` plus a `mode='create'|'edit'` (or infer create when `!contact?.id`). In create mode: show empty `Field`+`Input`s for `name`* (required), `company`, `role`, `email`, `phone`, `source`, `tags` (comma-separated → array on save); the panel's primary button says "Create" and calls a new `onCreate(form)` instead of `onUpdate`. In `Contacts.jsx`:
  - Remove the placeholder-row `handleNewContact`. Instead: `const [creating, setCreating] = useState(false)`; "+ New Contact" → `setCreating(true)` which opens `<ContactDetail mode="create" contact={null} onClose={()=>setCreating(false)} onCreate={handleCreateContact} />`.
  - `handleCreateContact(form)`: build `record` with only real columns (`name, company, role, email, phone, source, tags`), drop empties; `const { data, error } = await supabase.from('contacts').insert(record).select()` — **no `.single()`**; `if (error) { toast(error.message, 'error'); return }`; `const created = data?.[0]; if (created) { setContacts(p=>[created, ...p]); setSelectedContact(created) } setCreating(false); toast('Contact created')`.
  - Honor `?new=1` in the URL (from the command palette / quick-create): on mount, if `new URLSearchParams(location.search).get('new')` → `setCreating(true)` and strip the param.
- [ ] **Step 3:** While here, **diagnose the original failure**: if creating a contact still errors, the message now surfaces — if it's an RLS error (`new row violates row-level security policy`), add to `db/2026-05-12-daily_tasks.sql` (or a new `db/2026-05-12-contacts-rls-fix.sql`) the corrective policy and tell the user to run it. If it's a NOT-NULL column, adjust the insert. Document whatever it was in the PR description.
- [ ] **Step 4:** `<ImportCSV>` and `<ContactTable>` — token-drive; ContactTable rows get hover `c.surfaceHover`; empty → `<EmptyState illustration="EmptyContacts" .../>`.
- [ ] **Step 5: Build + lint check; manual: "+ New Contact" opens a form, saving creates a real contact with the entered data, no junk rows, CSV import still works, table renders in both themes.**
- [ ] **Step 6: Commit** `git add src/components/contacts/*.jsx && git commit -m "fix(contacts): create-mode form for + New Contact (hardened insert) + retheme"`

### Task 6.2: Estimator cluster — token-drive (no logic changes)

**Files:** Modify `src/components/estimator/Estimator.jsx`, `EstimateList.jsx`, `ZoneBuilder.jsx`, `QuoteSidebar.jsx`, `TransformerSelector.jsx`. **Leave `EstimatePDF.jsx` render logic alone** (only swap obvious app-chrome colors if any leak into the on-screen preview; the PDF output itself stays).

- [ ] **Step 1:** Token-drive; adopt `Button`/`Input`/`Card` where the markup makes it trivial; `EstimateList` table hover `c.surfaceHover`, empty → `EmptyState illustration="EmptyEstimates"`. Add `.fade-up` to page roots. Verify against the schema notes in the handoff doc — do **not** touch `saveEstimate` / pricing / `glass_price` vs `film_price` selection / `quote_value` column usage / display-ID logic; just colors and primitives.
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Commit** `git add src/components/estimator/*.jsx && git commit -m "style(estimator): retheme to Aurora tokens (no logic changes)"`

### Task 6.3: Pipeline cluster — token-drive

**Files:** Modify `src/components/pipeline/Pipeline.jsx`, `KanbanBoard.jsx`, `DealCard.jsx`, `WarmHoldColumn.jsx`

- [ ] **Step 1:** Token-drive; `AddDealModal` and `LossReasonModal` → reuse the `Modal` primitive; deal cards → `Card`-ish styling with hover lift; honor `?new=1` to open AddDealModal. Stage colors stay. Keep `react-beautiful-dnd` wiring and the `quote_value` column usage exactly as-is. Empty board → `EmptyState illustration="EmptyPipeline"`.
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Commit** `git add src/components/pipeline/*.jsx && git commit -m "style(pipeline): retheme to Aurora tokens + Modal primitive"`

### Task 6.4: Invoices cluster — token-drive (PDF render untouched)

**Files:** Modify `src/components/invoices/Invoices.jsx`, `InvoiceGenerator.jsx`, `InvoiceList.jsx`. **`InvoicePDF.jsx` render logic stays** (it produces the printable doc).

- [ ] **Step 1:** Token-drive page chrome; `InvoiceList` hover/empty (`EmptyState illustration="EmptyInvoices"`); `InvoiceGenerator` form → `Field`/`Input`/`Select`/`Button`. Honor `?new=1` to open the generator. Keep all column names (`total_amount`, `paid_date`, `line_items`, `type:'invoice'`, no `tax_pct`) and the estimate→invoice conversion exactly as-is.
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Commit** `git add src/components/invoices/*.jsx && git commit -m "style(invoices): retheme to Aurora tokens (PDF render untouched)"`

### Task 6.5: Products + Settings + ARIA + Login + Splash — token-drive

**Files:** Modify `src/components/products/Products.jsx`, `ProductCatalog.jsx`, `MarginCalculator.jsx`; `src/components/settings/Settings.jsx`, `GmailSettings.jsx`, `StripeSettings.jsx`; `src/components/aria/Aria.jsx`, `AriaChat.jsx`; `src/pages/Login.jsx`; `src/components/Splash.jsx`

- [ ] **Step 1:** Token-drive all. Products: tab bar → `Tabs`/`SegmentedControl`; catalog cards → `Card`. Settings: form sections → `Card` + `Field`/`Input`/`Button`; keep the `settings` upsert-on-`key` logic. ARIA chat: it's already darkish — re-point its `COLORS` to `c.*`. Login: re-point its gradient/accent to `c.gradientHero`/`c.accent`/tokens (keep the OAuth flow). Splash: the intro video/iris transition logic stays; just make the iris background and any text colors read from `c` (default still works pre-theme since it's `#0f1d35`-ish — but use `c.bg`).
- [ ] **Step 2: Build + lint check.**
- [ ] **Step 3: Commit** `git add -A && git commit -m "style: retheme Products/Settings/ARIA/Login/Splash to Aurora tokens"`

---

## Phase 7 — Audit, cleanup, final verification

### Task 7.1: Cross-app audit pass

**Files:** read-only sweep; fix-as-found across `src/`

- [ ] **Step 1:** Read every route component and its children (Dashboard, Estimator+children, EstimateList, Pipeline+children, Invoices+children, Products+children, Settings+children, Contacts+children, Aria+AriaChat, Splash, Login, Layout/Sidebar/Topbar) and check, fixing in place:
  - every `onClick`/`onSubmit`/`onChange` references a defined function (no `undefined` handlers, no leftover stubs that only `toast()` without doing the thing they claim);
  - every `supabase.from(...)` call destructures `{ data, error }` and checks `error`;
  - column names match the handoff-doc schema (`estimates`, `invoices`, `pipeline`, `contacts`, `settings`) — flag/fix mismatches;
  - no crash when a query returns `[]`/`null` (guards on `.map`, `.length`, `data?.[0]`);
  - `navigate(...)` targets correspond to real routes in `App.jsx`;
  - no remaining hardcoded hex that should be a token (grep `#[0-9a-fA-F]{3,8}` under `src/components` and `src/pages` — allow only hex inside `tokens.js`, `illustrations.jsx`, stage-color constants, and the PDF render files).
- [ ] **Step 2:** For anything that can't be verified without the live browser/DB (e.g., Gmail/Stripe integrations, OAuth, the actual PDF output, realtime), write a bullet in a running `AUDIT-NOTES.md` at repo root for the PR description; don't block on it.
- [ ] **Step 3:** Fix what's fixable; commit per logical fix: `git commit -am "fix(audit): <specific thing>"` (one commit per distinct bug; if zero bugs found, no commit — just note it).

### Task 7.2: Final cleanup + verification

- [ ] **Step 1:** Confirm `src/index.css` / `src/App.css` are gone and nothing imports them (`grep -rn "index.css\|App.css" src/` → nothing). Confirm `dashboard/QuotesChart.jsx` / `ClientTypeChart.jsx` are gone and unreferenced.
- [ ] **Step 2:** `npm run test` → all green. `npm run lint` → no new errors. `npm run build` → `✓ built`.
- [ ] **Step 3:** Update the project handoff/README if present (`README.md`) with: new `npm run test`, the theme system, the `daily_tasks` table requirement (link `db/2026-05-12-daily_tasks.sql`), and a note that colors live in `src/theme/tokens.js`.
- [ ] **Step 4:** Write the PR description (in the commit / PR body): summary of changes, the **manual test checklist** (login → toggle theme light/dark/system, reload persists → ⌘K palette & "+" → add/complete/uncheck/rename/delete tasks, carryover badge, "all clear" confetti, expand modal, future-schedule a task, 30-day history → "+ New Contact" creates a real contact → spot-check every page in both themes → estimator/invoice/pipeline primary actions still work), the `db/2026-05-12-daily_tasks.sql` run-this instruction, and the `AUDIT-NOTES.md` "needs-user-verification" list.
- [ ] **Step 5: Commit** `git add -A && git commit -m "chore: final cleanup, README/handoff updates, audit notes"`
- [ ] **Step 6:** Push the branch and (with the user's go-ahead) open a PR / merge to `main`: `git push -u origin feat/aurora-redesign`. Then follow the `superpowers:finishing-a-development-branch` skill for the merge decision.

---

## Self-Review (completed by plan author)

- **Spec coverage:** §3 theming → Tasks 1.1–1.4; §3.2a typography → 1.1 (tokens) + 1.3 (fonts/globals); §4.1 primitives → Phase 2; §4.2 motion → globals (1.3) + per-component; §4.3 chrome → 1.4 + 2.11; §4.4 dashboard → Phase 3; §4.5 other pages → Phase 6; §5 daily tasks (table/carryover/widget/expanded/structure) → Phase 4 + 5; §6 bug fixes & audit → 6.1 (contacts) + 7.1 (audit) + 7.2 (cleanup); §7 data/errors/testing → baked into hooks + Phase 0 + 7.2; §8 add-ons (⌘K → 2.10; quick-create → 2.11; undo toasts → 2.8 `Toast.action` + used in 6.1/4.x deletes; "all clear" confetti → 4.5; empty-state art → 2.9 + used everywhere; sidebar badges → 3.6; light/dark/system → 1.2); §9 delivery order → Phases 1–7. **One gap caught & fixed:** "undo toasts on delete" — the `Toast.action` plumbing is in 2.8, but make sure the actual delete call sites (TaskRow delete in 4.4/4.5, contact delete in 6.1, deal delete in 6.3) use it: pass `{ action: { label:'Undo', onClick: ()=>restore() } }` and delay the real `supabase.delete()` by ~6s (or delete immediately + re-insert on undo). **Added note here** so executors don't miss it.
- **Placeholder scan:** the only intentional "later" items are the deferred add-ons explicitly out of scope (spec §8 `[later]`); the Task 3.5 ↔ Phase 4 ordering dependency is handled with a real placeholder component, not a TODO; the audit task legitimately can't enumerate unknown bugs in advance — that's its nature, not a placeholder. No "TBD"/"add error handling"-style hand-waves.
- **Type/name consistency:** `useTheme()` → `{ mode, pref, c, setPreference, cycleMode }` used consistently; `c.shadowSm/Md/Lg` (not `c.shadow.sm`) — consistent in tokens.js and all consumers; `partitionTodayTasks` returns `{ open, doneToday, hidden }` — used consistently in 4.2/4.4/4.5/5.1; `useDailyTasks` exposes `{ tasks, loading, error, reload, addTask, updateTask, toggleTask, deleteTask }` — matches `TasksWidget`/`TasksModal` props; `EmptyState` prop is `illustration` everywhere; `Toast` `show(msg, type, opts)` with `opts.action` — consistent.

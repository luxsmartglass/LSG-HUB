# LSG Hub

A React + Vite CRM and quoting tool for Lux Smart Glass.

## Getting Started

```bash
npm install
npm run dev       # development server
npm run build     # production build
npm run lint      # ESLint check
npm run test      # Vitest unit tests
```

## Required Setup

### Supabase Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Daily Tasks Table (run once in Supabase SQL Editor)

The Daily Tasks feature requires a new table. Run the SQL in `db/2026-05-12-daily_tasks.sql`
in your Supabase project → SQL Editor before using the Dashboard tasks widget.

### Contacts RLS (if "+ New Contact" fails with an RLS error)

If inserting a contact returns "new row violates row-level security policy", run in Supabase → SQL Editor:

```sql
create policy "Authenticated users can manage contacts"
  on contacts for all
  to authenticated
  using (true)
  with check (true);
```

## Theme System

The app uses a token-driven light/dark/system theme (the "Aurora" palette).

- **Toggle:** Click the sun/moon icon in the top-right of the topbar
- **Modes:** Light, Dark, or System (follows OS preference)
- **Persistence:** Stored in `localStorage` under the key `lsg_theme`
- **Tokens:** All colors live in `src/theme/tokens.js`. Components access them via `useTheme()` → `c.*`
- **No CSS-in-JS:** Colors are applied via inline `style={{}}` props throughout

## Command Palette

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) to open the command palette.
Supports navigating to any page and quick-creating contacts, deals, and invoices.

## Tech Stack

- React 19 + Vite 6
- react-router-dom 7
- Supabase (auth + database + realtime)
- Recharts 3 (charts)
- react-beautiful-dnd (pipeline kanban)
- canvas-confetti (tasks all-clear animation)
- Vitest (unit tests)

## Development Notes

See `AUDIT-NOTES.md` for known limitations and items requiring live DB verification.

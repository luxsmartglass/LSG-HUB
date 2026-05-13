import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../theme/useTheme'
import { SearchIcon, PlusIcon, CheckIcon, MonitorIcon, SunIcon, MoonIcon } from './icons'
import { useIsMobile } from '../../hooks/useMediaQuery'

// ---------------------------------------------------------------------------
// Static command list factory — receives navigate + setPreference
// ---------------------------------------------------------------------------
function buildCommands(navigate, setPreference) {
  return [
    // Navigate
    { id: 'nav-home',      label: 'Home',           hint: 'Navigate', icon: <HomeIcon />,    run: () => navigate('/') },
    { id: 'nav-pipeline',  label: 'Pipeline',        hint: 'Navigate', icon: <PipelineIcon />, run: () => navigate('/pipeline') },
    { id: 'nav-estimates', label: 'All Estimates',   hint: 'Navigate', icon: <ListIcon />,    run: () => navigate('/estimates') },
    { id: 'nav-estimator', label: 'New Estimate',    hint: 'Navigate', icon: <PlusIcon />,    run: () => navigate('/estimator') },
    { id: 'nav-contacts',  label: 'Contacts',        hint: 'Navigate', icon: <PeopleIcon />,  run: () => navigate('/contacts') },
    { id: 'nav-invoices',  label: 'Invoices',        hint: 'Navigate', icon: <InvoiceIcon />, run: () => navigate('/invoices') },
    { id: 'nav-products',  label: 'Products',        hint: 'Navigate', icon: <BoxIcon />,     run: () => navigate('/products') },
    { id: 'nav-settings',  label: 'Settings',        hint: 'Navigate', icon: <GearIcon />,    run: () => navigate('/settings') },

    // Create
    { id: 'new-estimate',  label: 'New Estimate',    hint: 'Create',   icon: <PlusIcon />,    run: () => navigate('/estimator') },
    { id: 'new-contact',   label: 'New Contact',     hint: 'Create',   icon: <PlusIcon />,    run: () => navigate('/contacts?new=1') },
    { id: 'new-deal',      label: 'New Deal',        hint: 'Create',   icon: <PlusIcon />,    run: () => navigate('/pipeline?new=1') },
    { id: 'new-invoice',   label: 'New Invoice',     hint: 'Create',   icon: <PlusIcon />,    run: () => navigate('/invoices?new=1') },
    {
      id: 'new-task',
      label: 'New Task',
      hint: 'Create',
      icon: <CheckIcon />,
      run: (currentPath) => {
        if (currentPath !== '/') {
          navigate('/')
          setTimeout(() => window.dispatchEvent(new Event('lsg:new-task')), 80)
        } else {
          window.dispatchEvent(new Event('lsg:new-task'))
        }
      },
    },

    // Theme
    { id: 'theme-light',  label: 'Switch to light',  hint: 'Theme', icon: <SunIcon />,     run: () => setPreference('light') },
    { id: 'theme-dark',   label: 'Switch to dark',   hint: 'Theme', icon: <MoonIcon />,    run: () => setPreference('dark') },
    { id: 'theme-system', label: 'Use system theme',  hint: 'Theme', icon: <MonitorIcon />, run: () => setPreference('system') },
  ]
}

// ---------------------------------------------------------------------------
// Tiny inline icons for command rows (no external deps)
// ---------------------------------------------------------------------------
function HomeIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function PipelineIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="13" rx="1" />
      <rect x="17" y="3" width="5" height="8" rx="1" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
function PeopleIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function InvoiceIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
function BoxIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}
function GearIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Hint badge — small muted pill
// ---------------------------------------------------------------------------
function HintBadge({ label, c }) {
  return (
    <span style={{
      fontSize: c.text.xs,
      fontWeight: c.weight.label,
      color: c.textMuted,
      background: c.surfaceHover,
      borderRadius: c.radius.pill,
      padding: '2px 7px',
      lineHeight: 1.6,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main CommandPalette component
// ---------------------------------------------------------------------------
export default function CommandPalette() {
  const { c, setPreference } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Build commands with current navigate + setPreference (stable refs for these)
  const commands = buildCommands(navigate, setPreference)

  // Filtered list
  const filtered = query.trim()
    ? commands.filter(cmd => {
        const haystack = (cmd.label + ' ' + cmd.hint).toLowerCase()
        return haystack.includes(query.toLowerCase())
      })
    : commands

  // Reset selectedIndex when query changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync cursor to top when filter changes
    setSelectedIndex(0)
  }, [query])

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Custom event: 'lsg:open-command-palette'
  useEffect(() => {
    function handleOpenEvent() {
      setOpen(true)
    }
    window.addEventListener('lsg:open-command-palette', handleOpenEvent)
    return () => window.removeEventListener('lsg:open-command-palette', handleOpenEvent)
  }, [])

  // Auto-focus input when opened; reset state on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10)
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset palette state when closed
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Scroll selected row into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector('[data-selected="true"]')
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Body scroll lock while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  const runCommand = useCallback((cmd) => {
    // Pass current path to commands that need it (only new-task uses it)
    if (cmd.id === 'new-task') {
      cmd.run(location.pathname)
    } else {
      cmd.run()
    }
    setOpen(false)
    setQuery('')
  }, [location.pathname])

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => (i + 1) % (filtered.length || 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => (i - 1 + (filtered.length || 1)) % (filtered.length || 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        runCommand(filtered[selectedIndex])
      }
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: c.overlay,
        backdropFilter: 'blur(3px)',
        zIndex: 9600,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: isMobile ? '0' : '0 24px',
        paddingTop: isMobile ? '6vh' : '12vh',
        animation: 'fadeIn .18s ease both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        style={{
          background: c.surface,
          border: '1px solid ' + c.border,
          borderRadius: isMobile ? 0 : c.radius.xl,
          boxShadow: c.shadowLg,
          width: '100%',
          maxWidth: isMobile ? '100%' : 560,
          maxHeight: isMobile ? '80vh' : '60vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn .2s cubic-bezier(.22,1,.36,1) both',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderBottom: '1px solid ' + c.border,
          flexShrink: 0,
        }}>
          <SearchIcon size={16} style={{ color: c.textMuted, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: c.textPrimary,
              fontSize: c.text.md,
              fontFamily: c.font.body,
              fontWeight: c.weight.body,
              caretColor: c.accent,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: c.textMuted,
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                borderRadius: c.radius.sm,
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Command list */}
        <div
          ref={listRef}
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '6px 0',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: c.textMuted,
              fontSize: c.text.sm,
              fontFamily: c.font.body,
            }}>
              No commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((cmd, index) => {
              const isSelected = index === selectedIndex
              return (
                <div
                  key={cmd.id}
                  data-selected={isSelected ? 'true' : 'false'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 16px',
                    cursor: 'pointer',
                    background: isSelected ? c.accentSoft : 'transparent',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => runCommand(cmd)}
                >
                  {/* Icon */}
                  <span style={{
                    width: 24,
                    height: 24,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? c.accent : c.textMuted,
                    flexShrink: 0,
                    transition: 'color .1s',
                  }}>
                    {cmd.icon}
                  </span>

                  {/* Label */}
                  <span style={{
                    flex: 1,
                    fontSize: c.text.base,
                    fontFamily: c.font.body,
                    fontWeight: c.weight.body,
                    color: c.textPrimary,
                  }}>
                    {cmd.label}
                  </span>

                  {/* Hint badge */}
                  <HintBadge label={cmd.hint} c={c} />
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          borderTop: '1px solid ' + c.border,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          {[
            ['↑↓', 'Navigate'],
            ['↵', 'Run'],
            ['Esc', 'Close'],
          ].map(([key, label]) => (
            <span key={key} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: c.text.xs,
              color: c.textMuted,
              fontFamily: c.font.body,
            }}>
              <kbd style={{
                fontSize: c.text.xs,
                background: c.surfaceHover,
                border: '1px solid ' + c.border,
                borderRadius: c.radius.sm,
                padding: '1px 5px',
                fontFamily: 'inherit',
                color: c.textSecondary,
              }}>
                {key}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

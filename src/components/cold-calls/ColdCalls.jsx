import { useState, useRef, useCallback, useEffect } from 'react'
import { useTheme } from '../../theme/useTheme'
import { useIsMobile, useIsNarrow } from '../../hooks/useMediaQuery'
import { useColdCalls } from '../../hooks/useColdCalls'
import LoadingScreen from '../ui/LoadingScreen'
import ErrorBanner from '../ui/ErrorBanner'
import { XIcon } from '../ui/icons'

const CALLERS = ['Arsh', 'Ammar']
const OUTCOMES = ['Connected', 'Voicemail', 'No Answer', 'Follow-up', 'Not Interested', 'Booked']

// Column widths (desktop). The grid uses these in a CSS grid template.
const COLS_DESKTOP = '22% 12% 18% 1fr 14% 40px'
const COLS_NARROW  = '28% 14% 1fr 16% 40px' // hides Time on narrow

const COL_HEADERS = [
  { key: 'lead_name', label: 'Lead Name' },
  { key: 'caller',    label: 'Caller' },
  { key: 'time',      label: 'Time',    narrowHide: true },
  { key: 'notes',     label: 'Notes' },
  { key: 'outcome',   label: 'Outcome' },
  { key: 'actions',   label: '' },
]

// Outcome semantic colors mapped to the existing tokens so light/dark both work.
function outcomeStyle(c, outcome) {
  switch (outcome) {
    case 'Connected':     return { bg: c.successSoft, fg: c.success, dot: c.success }
    case 'Booked':        return { bg: c.accentSoft,  fg: c.accent,  dot: c.accent }
    case 'Follow-up':     return { bg: c.highlightSoft, fg: c.highlight, dot: c.highlight }
    case 'Voicemail':     return { bg: c.warningSoft, fg: c.warning, dot: c.warning }
    case 'No Answer':     return { bg: c.surfaceHover, fg: c.textMuted, dot: c.textMuted }
    case 'Not Interested':return { bg: c.dangerSoft,  fg: c.danger,  dot: c.danger }
    default:              return null
  }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return { date, time }
}

export default function ColdCalls() {
  const { c } = useTheme()
  const isMobile = useIsMobile()
  const isNarrow = useIsNarrow()
  const { calls, loading, error, reload, addCall, updateCall, deleteCall } = useColdCalls()

  // The trailing "new row" — purely local until the user types into Lead Name
  const [draftLead, setDraftLead] = useState('')
  const insertingRef = useRef(false)

  const cols = isNarrow ? COLS_NARROW : COLS_DESKTOP

  const handleDraftChange = useCallback(async (value) => {
    setDraftLead(value)
    if (insertingRef.current) return
    if (value.length > 0) {
      // First char committed -> insert row, reset draft so a fresh blank row appears
      insertingRef.current = true
      setDraftLead('')
      await addCall({ lead_name: value })
      insertingRef.current = false
    }
  }, [addCall])

  return (
    <div
      className="fade-up"
      style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary, fontFamily: c.font.body }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{
        background: c.surface,
        padding: isMobile ? '16px 16px' : '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: isMobile ? 10 : 0,
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: c.text.xl, fontWeight: c.weight.hero, color: c.textPrimary, fontFamily: c.font.heading }}>
            Cold Calls
          </h1>
          <span style={{
            background: c.accent, color: c.accentText,
            borderRadius: c.radius.pill, padding: '2px 12px',
            fontSize: c.text.sm, fontWeight: c.weight.label,
          }}>
            {calls.length}
          </span>
        </div>
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
          color: c.textMuted, fontSize: c.text.xs,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          fontWeight: c.weight.label,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent, boxShadow: `0 0 0 4px ${c.accentSoft}` }} />
          Live log
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ padding: isMobile ? '16px 16px' : '24px 32px' }}>
        <ErrorBanner error={error} onRetry={reload} />

        {loading ? (
          <div style={{ height: 200 }}>
            <LoadingScreen message="Loading calls..." />
          </div>
        ) : (
          <div style={{
            border: `1px solid ${c.border}`,
            borderRadius: c.radius.md,
            background: c.surface,
            overflow: 'hidden',
            boxShadow: c.shadowSm,
          }}>
            {/* Sticky header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: cols,
                background: c.surfaceHover,
                borderBottom: `1px solid ${c.border}`,
                position: 'sticky',
                top: 0,
                zIndex: 2,
              }}
            >
              {COL_HEADERS.filter(col => !(isNarrow && col.narrowHide)).map(col => (
                <div
                  key={col.key}
                  style={{
                    padding: '10px 14px',
                    color: c.textMuted,
                    fontWeight: c.weight.label,
                    fontSize: c.text.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: c.font.body,
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {calls.map(call => (
              <CallRow
                key={call.id}
                call={call}
                c={c}
                cols={cols}
                isNarrow={isNarrow}
                onUpdate={updateCall}
                onDelete={deleteCall}
              />
            ))}

            {/* Trailing new row */}
            <NewRow
              c={c}
              cols={cols}
              isNarrow={isNarrow}
              value={draftLead}
              onChange={handleDraftChange}
            />

            {/* Empty-state helper */}
            {calls.length === 0 && (
              <div style={{
                padding: '14px 16px',
                color: c.textMuted,
                fontSize: c.text.sm,
                fontStyle: 'italic',
                borderTop: `1px dashed ${c.border}`,
                textAlign: 'center',
              }}>
                Type a name to log your first call.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Row ─────────────────────────────────────────────────────────────

function CallRow({ call, c, cols, isNarrow, onUpdate, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const time = formatTime(call.created_at)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: cols,
        borderBottom: `1px solid ${c.border}`,
        background: hovered ? c.surfaceHover : 'transparent',
        transition: 'background-color .12s ease',
        alignItems: 'stretch',
      }}
    >
      <Cell c={c}>
        <CellInput
          c={c}
          value={call.lead_name || ''}
          onCommit={(v) => onUpdate(call.id, { lead_name: v })}
          placeholder="—"
        />
      </Cell>

      <Cell c={c}>
        <CellSelect
          c={c}
          value={call.caller || ''}
          options={CALLERS}
          onChange={(v) => onUpdate(call.id, { caller: v || null })}
          renderValue={(v) => v ? <CallerChip c={c} name={v} /> : <span style={{ color: c.textMuted }}>—</span>}
        />
      </Cell>

      {!isNarrow && (
        <Cell c={c}>
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '8px 12px', minHeight: 38,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: c.text.xs, color: c.textSecondary, lineHeight: 1.4,
          }}>
            {time ? (
              <>
                <span style={{ color: c.textPrimary, fontWeight: c.weight.body }}>{time.time}</span>
                <span style={{ color: c.textMuted, fontSize: 10.5, letterSpacing: '0.04em' }}>{time.date}</span>
              </>
            ) : (
              <span style={{ color: c.textMuted }}>—</span>
            )}
          </div>
        </Cell>
      )}

      <Cell c={c}>
        <CellInput
          c={c}
          value={call.notes || ''}
          onCommit={(v) => onUpdate(call.id, { notes: v })}
          placeholder="Add notes…"
        />
      </Cell>

      <Cell c={c}>
        <CellSelect
          c={c}
          value={call.outcome || ''}
          options={OUTCOMES}
          onChange={(v) => onUpdate(call.id, { outcome: v || null })}
          renderValue={(v) => v
            ? <OutcomeChip c={c} value={v} />
            : <span style={{ color: c.textMuted }}>—</span>}
        />
      </Cell>

      <Cell c={c} center>
        <button
          aria-label="Delete row"
          onClick={() => onDelete(call.id)}
          style={{
            width: 28, height: 28, borderRadius: c.radius.sm,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent',
            color: c.textMuted, cursor: 'pointer',
            opacity: hovered ? 1 : 0,
            transition: 'opacity .12s ease, background-color .12s ease, color .12s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = c.dangerSoft; e.currentTarget.style.color = c.danger }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textMuted }}
        >
          <XIcon size={14} />
        </button>
      </Cell>
    </div>
  )
}

// ── New row (trailing blank) ────────────────────────────────────────

function NewRow({ c, cols, isNarrow, value, onChange }) {
  const inputRef = useRef(null)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols,
        borderTop: `1px solid ${c.border}`,
        background: c.surfaceElevated,
        alignItems: 'stretch',
      }}
    >
      <Cell c={c}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="+ New call — type lead name…"
          style={{
            width: '100%', height: '100%', minHeight: 38,
            padding: '8px 12px',
            background: 'transparent', border: 'none', outline: 'none',
            color: c.textPrimary, fontSize: c.text.base, fontFamily: c.font.body,
            fontWeight: c.weight.body,
          }}
        />
      </Cell>
      <Cell c={c}><Empty c={c} /></Cell>
      {!isNarrow && <Cell c={c}><Empty c={c} /></Cell>}
      <Cell c={c}><Empty c={c} /></Cell>
      <Cell c={c}><Empty c={c} /></Cell>
      <Cell c={c} center><Empty c={c} /></Cell>
    </div>
  )
}

function Empty({ c }) {
  return <div style={{ padding: '8px 12px', color: c.textMuted, fontSize: c.text.sm }} />
}

// ── Cell primitives ─────────────────────────────────────────────────

function Cell({ c, center, children }) {
  return (
    <div style={{
      borderRight: `1px solid ${c.border}`,
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: center ? 'center' : 'stretch',
      minWidth: 0,   // allow text-overflow
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: center ? 'center' : 'stretch', minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}

function CellInput({ c, value, onCommit, placeholder }) {
  const [local, setLocal] = useState(value ?? '')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync external realtime updates into local input state when not editing
      setLocal(value ?? '')
    }
  }, [value, focused])

  return (
    <input
      type="text"
      value={local}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        setFocused(false)
        const next = local
        if (next !== (value ?? '')) onCommit(next)
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.currentTarget.blur() }
        if (e.key === 'Escape') { setLocal(value ?? ''); e.currentTarget.blur() }
      }}
      style={{
        width: '100%', height: '100%', minHeight: 38,
        padding: '8px 12px',
        background: 'transparent',
        border: 'none', outline: 'none',
        color: c.textPrimary,
        fontSize: c.text.base,
        fontFamily: c.font.body,
        fontWeight: c.weight.body,
        boxShadow: focused ? `inset 0 0 0 2px ${c.accent}` : 'none',
        borderRadius: focused ? c.radius.sm : 0,
        transition: 'box-shadow .12s ease',
      }}
    />
  )
}

function CellSelect({ c, value, options, onChange, renderValue }) {
  const [focused, setFocused] = useState(false)

  return (
    <label style={{
      position: 'relative',
      width: '100%', height: '100%', minHeight: 38,
      display: 'flex', alignItems: 'center',
      padding: '4px 10px',
      cursor: 'pointer',
      boxShadow: focused ? `inset 0 0 0 2px ${c.accent}` : 'none',
      borderRadius: focused ? c.radius.sm : 0,
      transition: 'box-shadow .12s ease',
    }}>
      <span style={{ pointerEvents: 'none', display: 'inline-flex' }}>
        {renderValue(value)}
      </span>
      <select
        value={value || ''}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => onChange(e.target.value)}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          opacity: 0, cursor: 'pointer',
          appearance: 'none', border: 'none', background: 'transparent',
        }}
      >
        <option value="">—</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  )
}

// ── Chips ───────────────────────────────────────────────────────────

function CallerChip({ c, name }) {
  // Arsh -> accent (purple), Ammar -> highlight (cyan). Same intensity, distinguishable at a glance.
  const isArsh = name === 'Arsh'
  const bg = isArsh ? c.accentSoft : c.highlightSoft
  const fg = isArsh ? c.accent : c.highlight
  const initial = (name?.[0] || '?').toUpperCase()
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px 3px 4px',
      background: bg, color: fg,
      borderRadius: c.radius.pill,
      fontSize: c.text.xs, fontWeight: c.weight.button,
      letterSpacing: '0.02em',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        background: fg, color: c.surface,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: c.weight.strong,
      }}>{initial}</span>
      {name}
    </span>
  )
}

function OutcomeChip({ c, value }) {
  const s = outcomeStyle(c, value)
  if (!s) return <span style={{ color: c.textMuted }}>—</span>
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px',
      background: s.bg, color: s.fg,
      borderRadius: c.radius.pill,
      fontSize: c.text.xs, fontWeight: c.weight.button,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {value}
    </span>
  )
}

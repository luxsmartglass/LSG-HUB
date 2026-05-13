import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../theme/useTheme'
import { useIsNarrow } from '../../hooks/useMediaQuery'
import { useReducedMotion, listItem, spring } from '../../lib/motion'
import { Card } from '../ui/Card'
import { IconButton } from '../ui/IconButton'
import EmptyState from '../ui/EmptyState'

const SOURCE_COLORS = {
  Apollo:       { bg: '#1e40af', color: '#bfdbfe' },
  Manual:       { bg: '#374151', color: '#d1d5db' },
  'CSV Import': { bg: '#065f46', color: '#a7f3d0' },
}

function SourceBadge({ source }) {
  const style = SOURCE_COLORS[source] || SOURCE_COLORS['Manual']
  return (
    <span style={{
      background: style.bg, color: style.color,
      borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {source || 'Manual'}
    </span>
  )
}

function TagBadge({ tag, c }) {
  return (
    <span style={{
      background: c.accentSoft, color: c.accent,
      borderRadius: c.radius.pill, padding: '2px 8px',
      fontSize: c.text.xs, fontWeight: c.weight.button,
      border: `1px solid ${c.accent}22`,
    }}>
      {tag}
    </span>
  )
}

const COLUMNS = [
  { key: 'name',    label: 'Name',    sortable: true },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'role',    label: 'Role',    sortable: false },
  { key: 'email',   label: 'Email',   sortable: false },
  { key: 'phone',   label: 'Phone',   sortable: false },
  { key: 'source',  label: 'Source',  sortable: false },
  { key: 'tags',    label: 'Tags',    sortable: false },
  { key: 'actions', label: '',        sortable: false },
]

const SORT_OPTIONS = [
  { value: 'name',       label: 'Name' },
  { value: 'company',    label: 'Company' },
  { value: 'created_at', label: 'Newest' },
]

function parseTags(contact) {
  return Array.isArray(contact.tags)
    ? contact.tags
    : typeof contact.tags === 'string' && contact.tags
      ? contact.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []
}

export default function ContactTable({ contacts, onSelect, onDelete, searchTerm }) {
  const { c } = useTheme()
  const isNarrow = useIsNarrow()
  const reducedMotion = useReducedMotion()
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [hoveredRow, setHoveredRow] = useState(null)

  const handleSort = (key) => {
    if (!key) return
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    if (!searchTerm) return contacts
    const q = searchTerm.toLowerCase()
    return contacts.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.role || '').toLowerCase().includes(q)
    )
  }, [contacts, searchTerm])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a[sortKey] || '').toString().toLowerCase()
      const bv = (b[sortKey] || '').toString().toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null
    if (sortKey !== col.key) return <span style={{ opacity: 0.3, marginLeft: 4 }}>⇅</span>
    return <span style={{ color: c.accent, marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        illustration="EmptyContacts"
        title="No contacts yet"
        message="Add one, or import a CSV."
      />
    )
  }

  // ── Card view (narrow / touch) ──────────────────────────────────────────
  if (isNarrow) {
    const cardListContent = sorted.map(contact => {
      const tags = parseTags(contact)

      if (reducedMotion) {
        return (
          <div key={contact.id}>
            <ContactCard
              contact={contact}
              tags={tags}
              c={c}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          </div>
        )
      }

      return (
        <motion.div
          key={contact.id}
          layout
          initial={listItem.initial}
          animate={listItem.animate}
          exit={listItem.exit}
          transition={spring}
          style={{ overflow: 'hidden' }}
        >
          <ContactCard
            contact={contact}
            tags={tags}
            c={c}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        </motion.div>
      )
    })

    return (
      <div>
        {/* Sort select */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: c.text.sm, color: c.textMuted }}>Sort by</span>
          <select
            value={sortKey}
            onChange={e => {
              setSortKey(e.target.value)
              setSortDir(e.target.value === 'created_at' ? 'desc' : 'asc')
            }}
            style={{
              background: c.surface, border: `1px solid ${c.border}`,
              color: c.textPrimary, borderRadius: c.radius.sm,
              padding: '5px 10px', fontSize: c.text.sm, cursor: 'pointer',
            }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Card list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reducedMotion ? (
            cardListContent
          ) : (
            <AnimatePresence initial={false}>
              {cardListContent}
            </AnimatePresence>
          )}
        </div>
      </div>
    )
  }

  // ── Table view (desktop / wide) ─────────────────────────────────────────
  const tableRows = sorted.map(contact => {
    const isHovered = hoveredRow === contact.id
    const tags = parseTags(contact)

    if (reducedMotion) {
      return (
        <tr
          key={contact.id}
          onMouseEnter={() => setHoveredRow(contact.id)}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => onSelect(contact)}
          style={{
            borderBottom: `1px solid ${c.border}`,
            cursor: 'pointer',
            background: isHovered ? c.surfaceHover : 'transparent',
            borderLeft: isHovered ? `3px solid ${c.accent}` : '3px solid transparent',
            transition: 'all 0.15s ease',
          }}
        >
          <TableRowCells contact={contact} tags={tags} c={c} onDelete={onDelete} />
        </tr>
      )
    }

    return (
      <motion.tr
        key={contact.id}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={spring}
        onMouseEnter={() => setHoveredRow(contact.id)}
        onMouseLeave={() => setHoveredRow(null)}
        onClick={() => onSelect(contact)}
        style={{
          borderBottom: `1px solid ${c.border}`,
          cursor: 'pointer',
          background: isHovered ? c.surfaceHover : 'transparent',
          borderLeft: isHovered ? `3px solid ${c.accent}` : '3px solid transparent',
          transition: 'background-color 0.15s ease, border-left-color 0.15s ease',
        }}
      >
        <TableRowCells contact={contact} tags={tags} c={c} onDelete={onDelete} />
      </motion.tr>
    )
  })

  return (
    <div className="h-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: c.text.base }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${c.border}` }}>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{
                  padding: '12px 16px', textAlign: 'left',
                  color: c.textMuted, fontWeight: c.weight.label, fontSize: c.text.xs,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none', whiteSpace: 'nowrap',
                }}
              >
                {col.label}<SortIcon col={col} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reducedMotion ? (
            tableRows
          ) : (
            <AnimatePresence initial={false}>
              {tableRows}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ContactCard({ contact, tags, c, onSelect, onDelete }) {
  return (
    <Card
      pad={12}
      hover
      interactive
      onClick={() => onSelect(contact)}
      style={{ cursor: 'pointer' }}
    >
      {/* Top row: name + delete */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: c.weight.button, color: c.textPrimary, fontSize: c.text.md, lineHeight: 1.3 }}>
          {contact.name || '—'}
        </span>
        <IconButton
          label="Delete contact"
          size={32}
          style={{ opacity: 0.6, flexShrink: 0, marginLeft: 8 }}
          onClick={e => {
            e.stopPropagation()
            if (window.confirm(`Delete ${contact.name}?`)) onDelete(contact.id)
          }}
        >
          🗑
        </IconButton>
      </div>

      {/* Label:value rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: tags.length ? 8 : 0 }}>
        <CardRow label="Company · Role" value={[contact.company, contact.role].filter(Boolean).join(' · ') || '—'} c={c} />
        <CardRow label="Email" value={contact.email || '—'} c={c} />
        <CardRow label="Phone" value={contact.phone || '—'} c={c} />
        {contact.source && (
          <div style={{ marginTop: 2 }}>
            <SourceBadge source={contact.source} />
          </div>
        )}
      </div>

      {/* Tag badges */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tags.map((tag, i) => <TagBadge key={i} tag={tag} c={c} />)}
        </div>
      )}
    </Card>
  )
}

function CardRow({ label, value, c }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: c.text.sm, lineHeight: 1.4 }}>
      <span style={{ color: c.textMuted, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: c.textSecondary }}>{value}</span>
    </div>
  )
}

function TableRowCells({ contact, tags, c, onDelete }) {
  return (
    <>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: c.weight.button, color: c.textPrimary }}>
          {contact.name || '—'}
        </div>
      </td>
      <td style={{ padding: '14px 16px', color: c.textSecondary }}>
        {contact.company || '—'}
      </td>
      <td style={{ padding: '14px 16px', color: c.textMuted }}>
        {contact.role || '—'}
      </td>
      <td style={{ padding: '14px 16px', color: c.textSecondary }}>
        {contact.email || '—'}
      </td>
      <td style={{ padding: '14px 16px', color: c.textSecondary }}>
        {contact.phone || '—'}
      </td>
      <td style={{ padding: '14px 16px' }}>
        <SourceBadge source={contact.source} />
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tags.map((tag, i) => <TagBadge key={i} tag={tag} c={c} />)}
        </div>
      </td>
      <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => {
            if (window.confirm(`Delete ${contact.name}?`)) onDelete(contact.id)
          }}
          style={{
            background: c.dangerSoft, border: `1px solid ${c.danger}44`,
            color: c.danger, borderRadius: c.radius.sm, padding: '6px 10px',
            cursor: 'pointer', fontSize: 14,
          }}
          title="Delete contact"
        >
          🗑
        </button>
      </td>
    </>
  )
}

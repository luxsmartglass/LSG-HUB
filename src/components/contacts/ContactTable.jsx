import { useState, useMemo } from 'react'

const NAVY = '#1c2b4a'
const GOLD = '#c9a84c'
const CREAM = '#f4f1eb'
const BG = '#0f1d35'

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
      whiteSpace: 'nowrap'
    }}>
      {source || 'Manual'}
    </span>
  )
}

function TagBadge({ tag }) {
  return (
    <span style={{
      background: 'rgba(201,168,76,0.18)', color: GOLD,
      borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 600,
      border: `1px solid rgba(201,168,76,0.3)`
    }}>
      {tag}
    </span>
  )
}

const COLUMNS = [
  { key: 'name',       label: 'Name',    sortable: true },
  { key: 'company',    label: 'Company', sortable: true },
  { key: 'role',       label: 'Role',    sortable: false },
  { key: 'email',      label: 'Email',   sortable: false },
  { key: 'phone',      label: 'Phone',   sortable: false },
  { key: 'source',     label: 'Source',  sortable: false },
  { key: 'tags',       label: 'Tags',    sortable: false },
  { key: 'actions',    label: '',        sortable: false },
]

export default function ContactTable({ contacts, onSelect, onDelete, searchTerm }) {
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
    return <span style={{ color: GOLD, marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  if (sorted.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '80px 20px',
        color: 'rgba(244,241,235,0.4)', fontSize: 16
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>No contacts yet</div>
        <div style={{ fontSize: 14 }}>Import from CSV or add manually</div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid rgba(201,168,76,0.3)` }}>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{
                  padding: '12px 16px', textAlign: 'left',
                  color: 'rgba(244,241,235,0.6)', fontWeight: 600, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none', whiteSpace: 'nowrap'
                }}
              >
                {col.label}<SortIcon col={col} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(contact => {
            const isHovered = hoveredRow === contact.id
            const tags = Array.isArray(contact.tags)
              ? contact.tags
              : typeof contact.tags === 'string' && contact.tags
                ? contact.tags.split(',').map(t => t.trim()).filter(Boolean)
                : []

            return (
              <tr
                key={contact.id}
                onMouseEnter={() => setHoveredRow(contact.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onSelect(contact)}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  background: isHovered ? 'rgba(201,168,76,0.06)' : 'transparent',
                  borderLeft: isHovered ? `3px solid ${GOLD}` : '3px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, color: CREAM }}>{contact.name || '—'}</div>
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(244,241,235,0.8)' }}>
                  {contact.company || '—'}
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(244,241,235,0.6)' }}>
                  {contact.role || '—'}
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(244,241,235,0.7)' }}>
                  {contact.email || '—'}
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(244,241,235,0.7)' }}>
                  {contact.phone || '—'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <SourceBadge source={contact.source} />
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tags.map((tag, i) => <TagBadge key={i} tag={tag} />)}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${contact.name}?`)) onDelete(contact.id)
                    }}
                    style={{
                      background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)',
                      color: '#fca5a5', borderRadius: 6, padding: '6px 10px',
                      cursor: 'pointer', fontSize: 14
                    }}
                    title="Delete contact"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

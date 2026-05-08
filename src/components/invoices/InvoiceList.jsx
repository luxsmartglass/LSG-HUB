import { useMemo, useState } from 'react'

const NAVY = '#1c2b4a'
const GOLD = '#c9a84c'
const CREAM = '#f4f1eb'

const today = new Date().toISOString().split('T')[0]

function statusStyle(status, due_date) {
  const isOverdue = status !== 'paid' && due_date && due_date < today
  if (isOverdue) return { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', label: 'Overdue' }
  switch ((status || '').toLowerCase()) {
    case 'paid':  return { bg: 'rgba(16,185,129,0.15)',  color: '#6ee7b7', label: 'Paid'  }
    case 'sent':  return { bg: 'rgba(59,130,246,0.15)',  color: '#93c5fd', label: 'Sent'  }
    default:      return { bg: 'rgba(107,114,128,0.2)',  color: '#d1d5db', label: 'Draft' }
  }
}

export default function InvoiceList({ invoices, onSelect, onEdit, onDelete, onMarkPaid }) {
  const [hoveredRow, setHoveredRow] = useState(null)

  const sorted = useMemo(() =>
    [...invoices].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    ), [invoices])

  if (sorted.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(244,241,235,0.4)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No invoices yet</div>
        <div style={{ fontSize: 13 }}>Click "+ New Invoice" to create your first invoice</div>
      </div>
    )
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  const fmtMoney = (n) => '$' + (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid rgba(201,168,76,0.3)` }}>
            {['Invoice #', 'Client', 'Date', 'Due Date', 'Amount', 'Deposit', 'Status', ''].map(h => (
              <th key={h} style={{
                padding: '12px 16px', textAlign: 'left',
                color: 'rgba(244,241,235,0.55)', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(inv => {
            const { bg, color, label } = statusStyle(inv.status, inv.due_date)
            const isHovered = hoveredRow === inv.id
            const isSent = (inv.status || '').toLowerCase() === 'sent'

            return (
              <tr
                key={inv.id}
                onMouseEnter={() => setHoveredRow(inv.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onSelect(inv)}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  background: isHovered ? 'rgba(201,168,76,0.06)' : 'transparent',
                  borderLeft: isHovered ? `3px solid ${GOLD}` : '3px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>
                    {inv.invoice_number || `INV-${String(inv.id).slice(-4).toUpperCase()}`}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: CREAM, fontWeight: 500 }}>
                  {inv.client_name || '—'}
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(244,241,235,0.6)' }}>
                  {fmtDate(inv.created_at)}
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(244,241,235,0.6)' }}>
                  {fmtDate(inv.due_date)}
                </td>
                <td style={{ padding: '14px 16px', color: CREAM, fontWeight: 600 }}>
                  {fmtMoney(inv.total)}
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(244,241,235,0.7)' }}>
                  {inv.deposit_paid
                    ? <span style={{ color: '#6ee7b7' }}>✓ {fmtMoney(inv.total * (inv.deposit_pct || 50) / 100)}</span>
                    : <span style={{ color: 'rgba(244,241,235,0.35)' }}>—</span>
                  }
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    background: bg, color, borderRadius: 12,
                    padding: '3px 12px', fontSize: 12, fontWeight: 700
                  }}>
                    {label}
                  </span>
                </td>
                <td
                  style={{ padding: '14px 16px' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {isSent && (
                      <button
                        onClick={() => onMarkPaid(inv.id)}
                        style={{
                          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                          color: '#6ee7b7', borderRadius: 6, padding: '5px 10px',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'
                        }}
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => onSelect(inv)}
                      style={{
                        background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                        color: '#93c5fd', borderRadius: 6, padding: '5px 10px',
                        cursor: 'pointer', fontSize: 12, fontWeight: 600
                      }}
                      title="View PDF"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => onEdit(inv)}
                      style={{
                        background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.3)`,
                        color: GOLD, borderRadius: 6, padding: '5px 10px',
                        cursor: 'pointer', fontSize: 12, fontWeight: 600
                      }}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this invoice?')) onDelete(inv.id)
                      }}
                      style={{
                        background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
                        color: '#fca5a5', borderRadius: 6, padding: '5px 10px',
                        cursor: 'pointer', fontSize: 14
                      }}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

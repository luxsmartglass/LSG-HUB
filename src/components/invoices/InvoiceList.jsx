import { useMemo, useState } from 'react'
import { useTheme } from '../../theme/useTheme'
import EmptyState from '../ui/EmptyState'
import { useIsNarrow } from '../../hooks/useMediaQuery'
import { Card } from '../ui/Card'

const today = new Date().toISOString().split('T')[0]

function statusStyle(status, due_date, c) {
  const isOverdue = status !== 'paid' && due_date && due_date < today
  if (isOverdue) return { bg: c.dangerSoft, color: c.danger, label: 'Overdue' }
  switch ((status || '').toLowerCase()) {
    case 'paid':  return { bg: c.successSoft,   color: c.success,    label: 'Paid'  }
    case 'sent':  return { bg: c.highlightSoft,  color: c.highlight,  label: 'Sent'  }
    default:      return { bg: c.accentSoft,     color: c.textMuted,  label: 'Draft' }
  }
}

export default function InvoiceList({ invoices, onSelect, onEdit, onDelete, onMarkPaid }) {
  const { c } = useTheme()
  const isNarrow = useIsNarrow()
  const [hoveredRow, setHoveredRow] = useState(null)

  const sorted = useMemo(() =>
    [...invoices].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    ), [invoices])

  if (sorted.length === 0) {
    return (
      <EmptyState
        illustration="EmptyInvoices"
        title="No invoices yet"
        message="Generate one from an estimate."
      />
    )
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  const fmtMoney = (n) => '$' + (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Narrow (≤520px): render as stacked cards
  if (isNarrow) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map(inv => {
          const { bg, color, label } = statusStyle(inv.status, inv.due_date, c)
          const canMarkPaid = !['paid'].includes((inv.status || '').toLowerCase())

          return (
            <Card
              key={inv.id}
              pad={14}
              hover
              interactive
              onClick={() => onSelect(inv)}
            >
              {/* Top row: invoice # + status badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: c.accent, fontWeight: c.weight.strong, fontSize: c.text.sm }}>
                  {inv.invoice_number || `INV-${String(inv.id).slice(-4).toUpperCase()}`}
                </span>
                <span style={{
                  background: bg, color,
                  borderRadius: c.radius.pill,
                  padding: '2px 10px', fontSize: c.text.xs, fontWeight: c.weight.label,
                }}>
                  {label}
                </span>
              </div>

              {/* Client + total */}
              <div style={{ fontWeight: c.weight.strong, fontSize: c.text.md, color: c.textPrimary, marginBottom: 4 }}>
                {inv.client_name || '—'}
              </div>
              <div style={{ fontWeight: c.weight.strong, fontSize: c.text.lg, color: c.accent, marginBottom: 6 }}>
                {fmtMoney(inv.total_amount)}
              </div>

              {/* Dates row */}
              <div style={{ display: 'flex', gap: 16, fontSize: c.text.xs, color: c.textMuted, marginBottom: 10 }}>
                <span>Issued: {fmtDate(inv.created_at)}</span>
                {inv.due_date && <span>Due: {fmtDate(inv.due_date)}</span>}
              </div>

              {/* Paid date if applicable */}
              {inv.paid_date && (
                <div style={{ fontSize: c.text.xs, color: c.success, marginBottom: 10 }}>
                  ✓ Deposit paid — {fmtMoney((inv.total_amount || 0) * (inv.deposit_pct || 50) / 100)}
                </div>
              )}

              {/* Action buttons */}
              <div
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                onClick={e => e.stopPropagation()}
              >
                {canMarkPaid && (
                  <button
                    onClick={() => onMarkPaid(inv.id)}
                    style={{
                      background: c.successSoft, border: `1px solid ${c.success}55`,
                      color: c.success, borderRadius: c.radius.sm, padding: '7px 12px',
                      cursor: 'pointer', fontSize: c.text.xs, fontWeight: c.weight.strong, whiteSpace: 'nowrap',
                    }}
                  >
                    Mark Paid
                  </button>
                )}
                <button
                  onClick={() => onSelect(inv)}
                  style={{
                    background: c.highlightSoft, border: `1px solid ${c.highlight}55`,
                    color: c.highlight, borderRadius: c.radius.sm, padding: '7px 12px',
                    cursor: 'pointer', fontSize: c.text.xs, fontWeight: c.weight.strong,
                  }}
                >
                  PDF
                </button>
                <button
                  onClick={() => onEdit(inv)}
                  style={{
                    background: c.accentSoft, border: `1px solid ${c.accent}55`,
                    color: c.accent, borderRadius: c.radius.sm, padding: '7px 12px',
                    cursor: 'pointer', fontSize: c.text.xs, fontWeight: c.weight.strong,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => { if (window.confirm('Delete this invoice?')) onDelete(inv.id) }}
                  style={{
                    background: c.dangerSoft, border: `1px solid ${c.danger}55`,
                    color: c.danger, borderRadius: c.radius.sm, padding: '7px 12px',
                    cursor: 'pointer', fontSize: c.text.xs,
                  }}
                >
                  🗑
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  // Wide (>520px): table with horizontal scroll
  return (
    <div className="h-scroll" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: c.text.base }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${c.borderStrong}` }}>
            {['Invoice #', 'Client', 'Date', 'Due Date', 'Amount', 'Deposit', 'Status', ''].map(h => (
              <th key={h} style={{
                padding: '12px 16px', textAlign: 'left',
                color: c.textMuted, fontSize: c.text.xs, fontWeight: c.weight.label,
                textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(inv => {
            const { bg, color, label } = statusStyle(inv.status, inv.due_date, c)
            const isHovered = hoveredRow === inv.id
            const canMarkPaid = !['paid'].includes((inv.status || '').toLowerCase())

            return (
              <tr
                key={inv.id}
                onMouseEnter={() => setHoveredRow(inv.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onSelect(inv)}
                style={{
                  borderBottom: `1px solid ${c.border}`,
                  cursor: 'pointer',
                  background: isHovered ? c.surfaceHover : 'transparent',
                  borderLeft: isHovered ? `3px solid ${c.accent}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ color: c.accent, fontWeight: c.weight.strong }}>
                    {inv.invoice_number || `INV-${String(inv.id).slice(-4).toUpperCase()}`}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: c.textPrimary, fontWeight: c.weight.body }}>
                  {inv.client_name || '—'}
                </td>
                <td style={{ padding: '14px 16px', color: c.textMuted }}>
                  {fmtDate(inv.created_at)}
                </td>
                <td style={{ padding: '14px 16px', color: c.textMuted }}>
                  {fmtDate(inv.due_date)}
                </td>
                <td style={{ padding: '14px 16px', color: c.textPrimary, fontWeight: c.weight.strong }}>
                  {fmtMoney(inv.total_amount)}
                </td>
                <td style={{ padding: '14px 16px', color: c.textSecondary }}>
                  {inv.paid_date
                    ? <span style={{ color: c.success }}>✓ {fmtMoney((inv.total_amount || 0) * (inv.deposit_pct || 50) / 100)}</span>
                    : <span style={{ color: c.textMuted }}>—</span>
                  }
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    background: bg, color,
                    borderRadius: c.radius.pill,
                    padding: '3px 12px', fontSize: c.text.xs, fontWeight: c.weight.label,
                  }}>
                    {label}
                  </span>
                </td>
                <td
                  style={{ padding: '14px 16px' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {canMarkPaid && (
                      <button
                        onClick={() => onMarkPaid(inv.id)}
                        style={{
                          background: c.successSoft, border: `1px solid ${c.success}55`,
                          color: c.success, borderRadius: c.radius.sm, padding: '5px 10px',
                          cursor: 'pointer', fontSize: c.text.xs, fontWeight: c.weight.strong, whiteSpace: 'nowrap',
                        }}
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => onSelect(inv)}
                      style={{
                        background: c.highlightSoft, border: `1px solid ${c.highlight}55`,
                        color: c.highlight, borderRadius: c.radius.sm, padding: '5px 10px',
                        cursor: 'pointer', fontSize: c.text.xs, fontWeight: c.weight.strong,
                      }}
                      title="View PDF"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => onEdit(inv)}
                      style={{
                        background: c.accentSoft, border: `1px solid ${c.accent}55`,
                        color: c.accent, borderRadius: c.radius.sm, padding: '5px 10px',
                        cursor: 'pointer', fontSize: c.text.xs, fontWeight: c.weight.strong,
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
                        background: c.dangerSoft, border: `1px solid ${c.danger}55`,
                        color: c.danger, borderRadius: c.radius.sm, padding: '5px 10px',
                        cursor: 'pointer', fontSize: 14,
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

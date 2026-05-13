import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import { useTheme } from '../../theme/useTheme'
import LoadingScreen from '../ui/LoadingScreen'
import ErrorBanner from '../ui/ErrorBanner'
import EmptyState from '../ui/EmptyState'
import EstimatePDF from './EstimatePDF'

function fmt(n) {
  if (n == null) return '—'
  return '$' + Number(n).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' CAD'
}

function fmtPct(n) {
  if (n == null) return '—'
  return Number(n).toFixed(1) + '%'
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function EstimateList() {
  const navigate = useNavigate()
  const toast = useToast()
  const { c } = useTheme()
  const [estimates, setEstimates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedEstimate, setSelectedEstimate] = useState(null)

  useEffect(() => { fetchEstimates() }, [])

  async function fetchEstimates() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('estimates')
        .select('*')
        .order('created_at', { ascending: false })
      if (err) throw err
      setEstimates(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteEstimate(est) {
    if (!window.confirm(`Delete estimate for "${est.client_name}"? This cannot be undone.`)) return
    const { error: err } = await supabase.from('estimates').delete().eq('id', est.id)
    if (err) { toast('Delete failed: ' + err.message, 'error'); return }
    toast('Estimate deleted')
    fetchEstimates()
  }

  const filtered = estimates.filter(e => {
    const matchSearch = !search || e.client_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <LoadingScreen />
  if (error) return <ErrorBanner message={error} onRetry={fetchEstimates} />

  // Status badge colors via tokens
  function statusBadgeStyle(status) {
    const map = {
      Draft:    { background: c.surfaceHover, color: c.textSecondary, border: '1px solid ' + c.border },
      Sent:     { background: c.highlightSoft, color: c.highlight, border: '1px solid ' + c.highlight + '44' },
      Accepted: { background: c.successSoft, color: c.success, border: '1px solid ' + c.success + '44' },
      Rejected: { background: c.dangerSoft, color: c.danger, border: '1px solid ' + c.danger + '44' },
    }
    return map[status] || map.Draft
  }

  const inputStyle = {
    padding: '9px 12px',
    border: '1px solid ' + c.border,
    borderRadius: c.radius.md,
    fontFamily: c.font.body,
    fontSize: c.text.base,
    outline: 'none',
    background: c.surfaceHover,
    color: c.textPrimary,
  }

  return (
    <div className="fade-up" style={{ animation: 'fadeUp 0.35s ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: c.font.heading, fontSize: c.text.xl, fontWeight: c.weight.hero, color: c.textPrimary, margin: 0 }}>All Estimates</h1>
          <p style={{ fontSize: c.text.sm, color: c.textMuted, margin: '4px 0 0' }}>{estimates.length} estimate{estimates.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => navigate('/estimator')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px',
            background: c.accent, color: c.accentText,
            border: 'none', borderRadius: c.radius.md,
            fontSize: c.text.base, fontWeight: c.weight.button,
            cursor: 'pointer', fontFamily: c.font.body,
          }}
        >
          + New Estimate
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by client name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, maxWidth: 300 }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            ...inputStyle,
            paddingRight: 28,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b5cf6' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
        >
          {['All', 'Draft', 'Sent', 'Accepted', 'Rejected'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table or Empty */}
      {filtered.length === 0 ? (
        <div style={{ background: c.surface, borderRadius: c.radius.lg, border: '1px solid ' + c.border }}>
          {estimates.length === 0 ? (
            <EmptyState
              illustration="EmptyEstimates"
              title="No estimates yet"
              message="Create one to get started."
              action="Create Estimate"
              onAction={() => navigate('/estimator')}
            />
          ) : (
            <EmptyState
              illustration="EmptyGeneric"
              title="No estimates match your filters"
              message="Try adjusting your search or status filter."
            />
          )}
        </div>
      ) : (
        <div style={{ background: c.surface, borderRadius: c.radius.lg, border: '1px solid ' + c.border, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: c.text.base }}>
            <thead>
              <tr style={{ background: c.surfaceElevated }}>
                {['Client Name', 'Type', 'Zones', 'Total Revenue', 'Margin %', 'Status', 'Date', 'Actions'].map(col => (
                  <th key={col} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontWeight: c.weight.label, fontSize: c.text.xs,
                    color: c.accent, fontFamily: c.font.body,
                    letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((est, i) => (
                <tr
                  key={est.id}
                  style={{ borderBottom: '1px solid ' + c.border, background: i % 2 === 0 ? 'transparent' : c.bg, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = c.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : c.bg}
                >
                  <td style={{ padding: '12px 14px', fontWeight: c.weight.body, color: c.textPrimary }}>{est.client_name || '—'}</td>
                  <td style={{ padding: '12px 14px', color: c.textSecondary }}>{est.type || '—'}</td>
                  <td style={{ padding: '12px 14px', color: c.textSecondary, textAlign: 'center' }}>
                    {Array.isArray(est.zones) ? est.zones.length : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: c.textPrimary, fontWeight: c.weight.body }}>{fmt(est.total_revenue)}</td>
                  <td style={{ padding: '12px 14px', color: c.textSecondary }}>{fmtPct(est.margin_pct)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {est.status ? (
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: c.radius.pill, fontSize: c.text.sm, fontWeight: c.weight.button, ...statusBadgeStyle(est.status) }}>
                        {est.status}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: c.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(est.created_at)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => navigate(`/estimator/${est.id}`)}
                        style={{ padding: '5px 11px', background: c.surfaceElevated, color: c.textPrimary, border: '1px solid ' + c.border, borderRadius: c.radius.sm, fontSize: c.text.sm, fontWeight: c.weight.body, cursor: 'pointer', fontFamily: c.font.body }}
                      >Edit</button>
                      <button
                        onClick={() => setSelectedEstimate(est)}
                        style={{ padding: '5px 11px', background: c.accent, color: c.accentText, border: 'none', borderRadius: c.radius.sm, fontSize: c.text.sm, fontWeight: c.weight.button, cursor: 'pointer', fontFamily: c.font.body }}
                      >PDF</button>
                      <button
                        onClick={() => deleteEstimate(est)}
                        style={{ padding: '5px 11px', background: c.dangerSoft, color: c.danger, border: '1px solid ' + c.danger + '44', borderRadius: c.radius.sm, fontSize: c.text.sm, fontWeight: c.weight.body, cursor: 'pointer', fontFamily: c.font.body }}
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEstimate && (
        <EstimatePDF estimate={selectedEstimate} onClose={() => setSelectedEstimate(null)} />
      )}
    </div>
  )
}

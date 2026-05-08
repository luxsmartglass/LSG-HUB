import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import LoadingScreen from '../ui/LoadingScreen'
import ErrorBanner from '../ui/ErrorBanner'
import EstimatePDF from './EstimatePDF'

const STATUS_COLORS = {
  Draft:    { background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' },
  Sent:     { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
  Accepted: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  Rejected: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
}

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

  return (
    <div style={{ animation: 'fadeUp 0.35s ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: '#1c2b4a', margin: 0 }}>All Estimates</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{estimates.length} estimate{estimates.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => navigate('/estimator')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#c9a84c', color: '#1c2b4a', border: 'none', borderRadius: 7, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
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
          style={{ flex: 1, maxWidth: 300, padding: '8px 12px', border: '1.5px solid #e5ddd0', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, outline: 'none', background: '#fff' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 28px 8px 12px', border: '1.5px solid #e5ddd0', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, outline: 'none', background: '#fff', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
        >
          {['All', 'Draft', 'Sent', 'Accepted', 'Rejected'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5ddd0', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#1c2b4a', marginBottom: 8 }}>
            {estimates.length === 0 ? 'No estimates yet — create your first one' : 'No estimates match your filters'}
          </div>
          {estimates.length === 0 && (
            <button
              onClick={() => navigate('/estimator')}
              style={{ marginTop: 12, padding: '9px 18px', background: '#c9a84c', color: '#1c2b4a', border: 'none', borderRadius: 7, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
            >
              Create Estimate
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5ddd0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#1c2b4a' }}>
                {['Client Name', 'Type', 'Zones', 'Total Revenue', 'Margin %', 'Status', 'Date', 'Actions'].map(col => (
                  <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((est, i) => (
                <tr
                  key={est.id}
                  style={{ borderBottom: '1px solid #f3f0ea', background: i % 2 === 0 ? '#fff' : '#fdfcf9', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef8ec'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fdfcf9'}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: '#1c2b4a' }}>{est.client_name || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#4b5563' }}>{est.type || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#4b5563', textAlign: 'center' }}>
                    {Array.isArray(est.zones) ? est.zones.length : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#1c2b4a', fontWeight: 500 }}>{fmt(est.total_revenue)}</td>
                  <td style={{ padding: '12px 14px', color: '#4b5563' }}>{fmtPct(est.margin_pct)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {est.status ? (
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...STATUS_COLORS[est.status] || STATUS_COLORS.Draft }}>
                        {est.status}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(est.created_at)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => navigate(`/estimator/${est.id}`)}
                        style={{ padding: '5px 11px', background: '#1c2b4a', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                      >Edit</button>
                      <button
                        onClick={() => setSelectedEstimate(est)}
                        style={{ padding: '5px 11px', background: '#c9a84c', color: '#1c2b4a', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                      >PDF</button>
                      <button
                        onClick={() => deleteEstimate(est)}
                        style={{ padding: '5px 11px', background: 'transparent', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
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

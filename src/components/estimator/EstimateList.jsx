import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import LoadingScreen from '../ui/LoadingScreen'
import ErrorBanner from '../ui/ErrorBanner'
import EstimatePDF from './EstimatePDF'

const STATUS_COLORS = {
  Draft:    { background: 'rgba(107,114,128,0.2)', color: '#d1d5db', border: '1px solid rgba(107,114,128,0.3)' },
  Sent:     { background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' },
  Accepted: { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' },
  Rejected: { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' },
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
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: '#f4f1eb', margin: 0 }}>All Estimates</h1>
          <p style={{ fontSize: 13, color: 'rgba(244,241,235,0.5)', margin: '4px 0 0' }}>{estimates.length} estimate{estimates.length !== 1 ? 's' : ''} total</p>
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
          style={{ flex: 1, maxWidth: 300, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, outline: 'none', background: 'rgba(255,255,255,0.07)', color: '#f4f1eb' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 28px 9px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, outline: 'none', background: 'rgba(255,255,255,0.07)', color: '#f4f1eb', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c9a84c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
        >
          {['All', 'Draft', 'Sent', 'Accepted', 'Rejected'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ background: '#162238', borderRadius: 10, border: '1px solid rgba(201,168,76,0.15)', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#f4f1eb', marginBottom: 8 }}>
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
        <div style={{ background: '#162238', borderRadius: 10, border: '1px solid rgba(201,168,76,0.15)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#1c2b4a' }}>
                {['Client Name', 'Type', 'Zones', 'Total Revenue', 'Margin %', 'Status', 'Date', 'Actions'].map(col => (
                  <th key={col} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#c9a84c', fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((est, i) => (
                <tr
                  key={est.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: '#f4f1eb' }}>{est.client_name || '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'rgba(244,241,235,0.7)' }}>{est.type || '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'rgba(244,241,235,0.7)', textAlign: 'center' }}>
                    {Array.isArray(est.zones) ? est.zones.length : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#f4f1eb', fontWeight: 500 }}>{fmt(est.total_revenue)}</td>
                  <td style={{ padding: '12px 14px', color: 'rgba(244,241,235,0.7)' }}>{fmtPct(est.margin_pct)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {est.status ? (
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...STATUS_COLORS[est.status] || STATUS_COLORS.Draft }}>
                        {est.status}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'rgba(244,241,235,0.5)', whiteSpace: 'nowrap' }}>{fmtDate(est.created_at)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => navigate(`/estimator/${est.id}`)}
                        style={{ padding: '5px 11px', background: '#1c2b4a', color: '#f4f1eb', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                      >Edit</button>
                      <button
                        onClick={() => setSelectedEstimate(est)}
                        style={{ padding: '5px 11px', background: '#c9a84c', color: '#1c2b4a', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                      >PDF</button>
                      <button
                        onClick={() => deleteEstimate(est)}
                        style={{ padding: '5px 11px', background: 'rgba(220,38,38,0.1)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
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

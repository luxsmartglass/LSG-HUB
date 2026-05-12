import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import Spinner from '../ui/Spinner'
import LoadingScreen from '../ui/LoadingScreen'
import ErrorBanner from '../ui/ErrorBanner'
import StatsCards from './StatsCards'
import RevenueChart from './RevenueChart'
import FunnelChart from './FunnelChart'

const QUOTES = [
  { content: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { content: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { content: "Ninety percent of all millionaires become so through owning real estate.", author: "Andrew Carnegie" },
  { content: "Real estate cannot be lost or stolen, nor can it be carried away.", author: "Franklin D. Roosevelt" },
  { content: "Buy land, they're not making it anymore.", author: "Mark Twain" },
  { content: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { content: "The harder I work, the luckier I get.", author: "Samuel Goldwyn" },
  { content: "Success usually comes to those who are too busy looking for it.", author: "Henry David Thoreau" },
  { content: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { content: "The best investment on earth is earth.", author: "Louis Glickman" },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmtCAD(n) { return '$' + Math.round(n || 0).toLocaleString('en-CA') }
function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [pipeline, setPipeline] = useState([])
  const [recentEstimates, setRecentEstimates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [clock, setClock] = useState(new Date())
  const navigate = useNavigate()
  const toast = useToast()

  const quote = QUOTES[new Date().getDate() % QUOTES.length]

  useEffect(() => {
    loadData()
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [estRes, pipeRes] = await Promise.all([
        supabase.from('estimates').select('total_revenue, net_margin, margin_pct, status, created_at, client_name, total_cost').order('created_at', { ascending: false }),
        supabase.from('pipeline').select('stage, quote_value, created_at, client_name, assigned_to').order('created_at', { ascending: false })
      ])
      if (estRes.error) throw estRes.error
      if (pipeRes.error) throw pipeRes.error
      const ests = estRes.data || []
      const pipes = pipeRes.data || []

      const totalRevenue = ests.reduce((a, e) => a + (e.total_revenue || 0), 0)
      const totalMargin = ests.reduce((a, e) => a + (e.net_margin || 0), 0)
      const avgMarginPct = ests.length ? ests.reduce((a, e) => a + (e.margin_pct || 0), 0) / ests.length : 0
      const pipelineVal = pipes.filter(p => p.stage !== 'lost').reduce((a, p) => a + (p.quote_value || 0), 0)
      const activeDeals = pipes.filter(p => !['lost', 'won'].includes(p.stage)).length
      const warmHolds = pipes.filter(p => p.stage === 'warm_hold').length

      setStats({ totalRevenue, totalMargin, avgMarginPct, pipelineVal, activeDeals, warmHolds, totalEstimates: ests.length })
      setPipeline(pipes)
      setRecentEstimates(ests.slice(0, 5))
    } catch (e) {
      setError(e)
      toast('Failed to load dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const dateStr = clock.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = clock.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div style={{ animation: 'fadeUp 0.35s ease both' }}>
      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, #1c2b4a 0%, #0f1d35 50%, #1c2b4a 100%)',
        borderRadius: 14, padding: '32px 36px', marginBottom: 24, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(201,168,76,0.07)', filter: 'blur(60px)', top: -80, right: -40, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {greeting()}, LSG 👋
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>{dateStr}</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 400, color: '#c9a84c', letterSpacing: 2 }}>{timeStr}</div>
        </div>
      </div>

      {/* QUOTE */}
      <div style={{
        background: '#1c2b4a', borderRadius: 12, padding: '20px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -10, left: 14, fontFamily: "'Playfair Display',serif", fontSize: 80, color: 'rgba(201,168,76,0.12)', lineHeight: 1, pointerEvents: 'none' }}>"</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontStyle: 'italic', color: '#fff', lineHeight: 1.7, marginBottom: 8, position: 'relative' }}>{quote.content}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#c9a84c', letterSpacing: 0.5 }}>— {quote.author}</div>
      </div>

      <ErrorBanner error={error} onRetry={loadData} />

      {loading ? (
        <LoadingScreen message="Loading dashboard..." />
      ) : (
        <>
          <StatsCards stats={stats} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
            <RevenueChart estimates={recentEstimates} pipeline={pipeline} />
            <FunnelChart pipeline={pipeline} />
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c9a84c', marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '📋', title: 'New Estimate', sub: 'Create a quote for a new client', path: '/estimator', bg: 'rgba(96,165,250,0.14)' },
                { icon: '🔥', title: 'View Pipeline', sub: `${stats?.activeDeals || 0} active deals · ${fmtCAD(stats?.pipelineVal)}`, path: '/pipeline', bg: 'rgba(244,114,182,0.14)' },
                { icon: '👥', title: 'All Clients', sub: `${stats?.totalEstimates || 0} estimates saved`, path: '/contacts', bg: 'rgba(74,222,128,0.14)' },
              ].map(a => (
                <button key={a.path} onClick={() => navigate(a.path)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  background: '#162238', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.18s', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", width: '100%'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.transform = 'translateX(3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f4f1eb' }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: '#8a9bb5', marginTop: 1 }}>{a.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Estimates */}
          {recentEstimates.length > 0 && (
            <div style={{ background: '#162238', borderRadius: 10, border: '1px solid rgba(201,168,76,0.15)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, color: '#f4f1eb' }}>Recent Estimates</div>
                <button onClick={() => navigate('/estimates')} style={{ fontSize: 12.5, color: 'rgba(244,241,235,0.6)', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>View All</button>
              </div>
              {recentEstimates.map(e => (
                <div key={e.id || e.created_at} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f4f1eb' }}>{e.client_name}</div>
                    <div style={{ fontSize: 11.5, color: '#8a9bb5', marginTop: 2 }}>{timeAgo(e.created_at)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#c9a84c' }}>{fmtCAD(e.total_revenue)}</div>
                    <div style={{ fontSize: 11.5, color: e.margin_pct >= 40 ? '#34d399' : '#fbbf24' }}>{(e.margin_pct || 0).toFixed(1)}% margin</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import { useTheme } from '../../theme/useTheme'
import { useActivityFeed } from '../../hooks/useActivityFeed'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { useReducedMotion } from '../../lib/motion'
import ErrorBanner from '../ui/ErrorBanner'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import AnimatedNumber from '../ui/AnimatedNumber'
import StatsCards from './StatsCards'
import RevenueChart from './RevenueChart'
import FunnelChart from './FunnelChart'
import ActivityFeed from './ActivityFeed'
import TasksWidget from './tasks/TasksWidget'

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

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [pipeline, setPipeline] = useState([])
  const [recentEstimates, setRecentEstimates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [clock, setClock] = useState(new Date())
  const [openTaskCount, setOpenTaskCount] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)
  const navigate = useNavigate()
  const toast = useToast()
  const { c } = useTheme()
  const isMobile = useIsMobile()

  const { items: activity, loading: activityLoading } = useActivityFeed()

  const quote = QUOTES[new Date().getDate() % QUOTES.length]

  const reducedMotion = useReducedMotion()

  useEffect(() => {
    loadData()
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    function handleMouseMove(e) {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 12,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 12,
      })
    }
    const hero = heroRef.current
    if (hero) hero.addEventListener('mousemove', handleMouseMove)
    return () => { if (hero) hero.removeEventListener('mousemove', handleMouseMove) }
  }, [reducedMotion])

  async function loadData() {
    setLoading(true)
    setError(null)
    const [estRes, pipeRes] = await Promise.all([
      supabase.from('estimates').select('total_revenue, net_margin, margin_pct, status, created_at, client_name, total_cost').order('created_at', { ascending: false }),
      supabase.from('pipeline').select('stage, quote_value, created_at, client_name, assigned_to').order('created_at', { ascending: false })
    ])
    if (estRes.error) { setError(estRes.error); toast('Failed to load dashboard data', 'error'); setLoading(false); return }
    if (pipeRes.error) { setError(pipeRes.error); toast('Failed to load dashboard data', 'error'); setLoading(false); return }

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
    setLoading(false)
  }

  const dateStr = clock.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = clock.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const quickActions = [
    { title: 'New Estimate', sub: 'Create a quote for a new client', path: '/estimator', tint: c.accentSoft, icon: '📋' },
    { title: 'View Pipeline', sub: `${stats?.activeDeals || 0} active deals · ${fmtCAD(stats?.pipelineVal)}`, path: '/pipeline', tint: c.highlightSoft, icon: '🔥' },
    { title: 'All Clients', sub: `${stats?.totalEstimates || 0} estimates saved`, path: '/contacts', tint: c.successSoft, icon: '👥' },
    { title: 'New Invoice', sub: 'Generate an invoice for a client', path: '/invoices', tint: c.warningSoft, icon: '🧾' },
  ]

  return (
    <div className="fade-up" style={{ maxWidth: 1400 }}>
      {/* HERO */}
      <div
        ref={heroRef}
        style={{
          background: c.gradientHero,
          borderRadius: c.radius.xl,
          padding: isMobile ? '22px 18px' : '34px 38px',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Parallax bloom layers */}
        {!reducedMotion && (
          <>
            <div style={{
              position: 'absolute', width: 340, height: 340, borderRadius: '50%',
              background: c.accentSoft, filter: 'blur(70px)',
              top: -100, right: -60, pointerEvents: 'none',
              transform: `translate(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px)`,
              transition: 'transform 0.1s ease-out',
            }} />
            <div style={{
              position: 'absolute', width: 260, height: 260, borderRadius: '50%',
              background: c.highlightSoft, filter: 'blur(60px)',
              bottom: -80, left: -40, pointerEvents: 'none',
              transform: `translate(${mousePos.x * -0.4}px, ${mousePos.y * -0.4}px)`,
              transition: 'transform 0.1s ease-out',
            }} />
          </>
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: c.font.heading,
            fontSize: isMobile ? c.text.xl : c.text.display,
            fontWeight: c.weight.hero,
            color: c.textPrimary,
            marginBottom: 4,
            lineHeight: c.leading.tight,
          }}>
            {greeting()}, LSG 👋
          </div>
          <div style={{ fontSize: c.text.sm, color: c.textMuted, marginBottom: 14 }}>{dateStr}</div>
          <div style={{
            fontFamily: c.font.heading,
            fontSize: isMobile ? 26 : 34,
            fontWeight: c.weight.body,
            color: c.accent,
            letterSpacing: 2,
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 12,
          }}>
            {timeStr}
          </div>
          <div style={{ fontSize: c.text.sm, color: c.textSecondary }}>
            {stats ? (
              <>
                <AnimatedNumber value={stats.activeDeals || 0} /> active deals · <AnimatedNumber value={openTaskCount} /> open tasks
              </>
            ) : 'Loading…'}
          </div>
        </div>
      </div>

      {/* QUOTE */}
      <Card style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -10, left: 14,
          fontFamily: c.font.heading, fontSize: 80,
          color: c.accentSoft, lineHeight: 1, pointerEvents: 'none',
        }}>"</div>
        <div style={{
          fontFamily: c.font.heading, fontSize: c.text.md,
          fontStyle: 'italic', color: c.textPrimary,
          lineHeight: c.leading.normal, marginBottom: 8, position: 'relative',
        }}>
          {quote.content}
        </div>
        <div style={{ fontSize: c.text.sm, fontWeight: c.weight.label, color: c.accent, letterSpacing: 0.5 }}>
          — {quote.author}
        </div>
      </Card>

      <ErrorBanner error={error} onRetry={loadData} />

      {/* Daily Tasks */}
      <div style={{ marginBottom: 20 }}>
        <TasksWidget onCount={setOpenTaskCount} />
      </div>

      {/* STATS CARDS */}
      {!loading && <StatsCards stats={stats} />}

      {/* CHARTS GRID */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: 20, marginBottom: 20 }}>
          <RevenueChart estimates={recentEstimates} pipeline={pipeline} />
          <FunnelChart pipeline={pipeline} />
        </div>
      )}

      {/* QUICK ACTIONS + ACTIVITY FEED */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Quick Actions */}
          <Card
            header={
              <div style={{
                fontFamily: c.font.heading,
                fontWeight: c.weight.strong,
                fontSize: c.text.md,
                color: c.textPrimary,
              }}>
                Quick Actions
              </div>
            }
            pad={16}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map(action => (
                <Button
                  key={action.path}
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate(action.path)}
                  style={{ justifyContent: 'flex-start', padding: '10px 12px', gap: 12 }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: c.radius.md,
                    background: action.tint,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>
                    {action.icon}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: c.text.base, fontWeight: c.weight.button, color: c.textPrimary }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: c.text.sm, color: c.textMuted, marginTop: 1 }}>
                      {action.sub}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed items={activity} loading={activityLoading} />
        </div>
      )}
    </div>
  )
}

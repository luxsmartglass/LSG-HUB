import { useEffect, useRef } from 'react'

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }) {
  const ref = useRef(null)
  const prev = useRef(0)

  useEffect(() => {
    if (!ref.current || value === undefined) return
    const start = prev.current
    const end = value
    const duration = 900
    const startTime = performance.now()
    function step(now) {
      const pct = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - pct, 3)
      const v = start + (end - start) * ease
      if (ref.current) ref.current.textContent = prefix + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-CA')) + suffix
      if (pct < 1) requestAnimationFrame(step)
      else prev.current = end
    }
    requestAnimationFrame(step)
  }, [value])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

export default function StatsCards({ stats }) {
  if (!stats) return null
  const cards = [
    { label: 'Total Estimates', value: stats.totalEstimates, suffix: '', prefix: '', decimals: 0 },
    { label: 'Pipeline Value', value: Math.round(stats.pipelineVal / 1000), suffix: 'K', prefix: '$', decimals: 0 },
    { label: 'Est. Total Margin', value: Math.round(stats.totalMargin / 1000), suffix: 'K', prefix: '$', decimals: 0 },
    { label: 'Avg Margin %', value: stats.avgMarginPct, suffix: '%', prefix: '', decimals: 1 },
    { label: 'Active Deals', value: stats.activeDeals, suffix: '', prefix: '', decimals: 0 },
    { label: 'Warm Holds', value: stats.warmHolds, suffix: '', prefix: '', decimals: 0 },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
      {cards.map((c, i) => (
        <div key={c.label} style={{
          background: '#162238', borderRadius: 10, padding: '18px 20px',
          border: '1px solid rgba(201,168,76,0.15)', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          animation: `fadeUp 0.35s ease ${i * 0.05}s both`,
          transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s', cursor: 'default'
        }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.25)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)' }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{c.label}</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 600, color: '#f4f1eb' }}>
            <AnimatedNumber value={c.value} prefix={c.prefix} suffix={c.suffix} decimals={c.decimals} />
          </div>
        </div>
      ))}
    </div>
  )
}

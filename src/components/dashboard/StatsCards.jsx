import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../theme/useTheme'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

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

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}0{suffix}
    </span>
  )
}

export default function StatsCards({ stats }) {
  const navigate = useNavigate()
  const { c } = useTheme()

  if (!stats) return null

  const cards = [
    {
      label: 'Total Estimates',
      value: stats.totalEstimates,
      suffix: '',
      prefix: '',
      decimals: 0,
      deepLink: '/estimates',
      badge: null,
    },
    {
      label: 'Pipeline Value',
      value: Math.round(stats.pipelineVal / 1000),
      suffix: 'K',
      prefix: '$',
      decimals: 0,
      deepLink: '/pipeline',
      badge: stats.activeDeals != null ? `from ${stats.activeDeals} estimates` : null,
    },
    {
      label: 'Est. Total Margin',
      value: Math.round(stats.totalMargin / 1000),
      suffix: 'K',
      prefix: '$',
      decimals: 0,
      deepLink: '/estimates',
      badge: null,
    },
    {
      label: 'Avg Margin %',
      value: stats.avgMarginPct,
      suffix: '%',
      prefix: '',
      decimals: 1,
      deepLink: '/estimates',
      badge: null,
    },
    {
      label: 'Active Deals',
      value: stats.activeDeals,
      suffix: '',
      prefix: '',
      decimals: 0,
      deepLink: '/pipeline',
      badge: null,
    },
    {
      label: 'Warm Holds',
      value: stats.warmHolds,
      suffix: '',
      prefix: '',
      decimals: 0,
      deepLink: '/pipeline',
      badge: null,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
      {cards.map((card, i) => (
        <Card
          key={card.label}
          hover
          interactive
          onClick={() => navigate(card.deepLink)}
          style={{ animation: `fadeUp .4s cubic-bezier(.22,1,.36,1) ${i * 0.05}s both` }}
        >
          {/* Eyebrow label */}
          <div style={{
            color: c.textMuted,
            fontWeight: c.weight.label,
            fontSize: c.text.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}>
            {card.label}
          </div>

          {/* Value */}
          <div style={{
            fontFamily: c.font.heading,
            fontSize: c.text['2xl'],
            color: c.textPrimary,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
            marginBottom: card.badge ? 10 : 0,
          }}>
            <AnimatedNumber
              value={card.value}
              prefix={card.prefix}
              suffix={card.suffix}
              decimals={card.decimals}
            />
          </div>

          {/* Contextual badge — only where meaningful */}
          {card.badge && (
            <Badge tone="neutral">{card.badge}</Badge>
          )}
        </Card>
      ))}
    </div>
  )
}

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTheme } from '../../theme/useTheme'
import { Card } from '../ui/Card'
import EmptyState from '../ui/EmptyState'

function fmtCAD(n) { return '$' + Math.round(n || 0).toLocaleString('en-CA') }

export default function RevenueChart({ estimates, pipeline }) {
  const { c } = useTheme()

  // Group estimates by month
  const monthMap = {}
  ;(estimates || []).forEach(e => {
    const d = new Date(e.created_at)
    const key = d.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' })
    monthMap[key] = (monthMap[key] || 0) + (e.total_revenue || 0)
  })
  const data = Object.entries(monthMap).slice(-6).map(([month, revenue]) => ({ month, revenue }))
  if (!data.length) data.push({ month: 'Now', revenue: 0 })

  const isEmpty = data.every(d => d.revenue === 0)

  return (
    <Card>
      <div style={{
        fontFamily: c.font.heading,
        fontSize: c.text.md,
        fontWeight: c.weight.strong,
        color: c.textPrimary,
        marginBottom: 16,
      }}>
        Revenue by Month
      </div>

      {isEmpty ? (
        <EmptyState
          illustration="EmptyEstimates"
          title="No revenue yet"
          message="Saved estimates will chart here."
          compact
        />
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={c.accent} stopOpacity={0.35} />
                <stop offset="95%" stopColor={c.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: c.textMuted }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: c.textMuted }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => '$' + Math.round(v / 1000) + 'K'}
            />
            <Tooltip
              formatter={(v) => [fmtCAD(v), 'Revenue']}
              contentStyle={{
                background: c.surfaceElevated,
                border: '1px solid ' + c.border,
                borderRadius: c.radius.md,
                color: c.textPrimary,
                fontSize: 12,
                boxShadow: c.shadowMd,
              }}
              labelStyle={{ color: c.textMuted }}
              cursor={{ stroke: c.accentSoft }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={c.accent}
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

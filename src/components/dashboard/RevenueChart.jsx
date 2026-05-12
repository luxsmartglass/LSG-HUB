import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function fmtCAD(n) { return '$' + Math.round(n || 0).toLocaleString('en-CA') }

export default function RevenueChart({ estimates, pipeline }) {
  // Group estimates by month
  const monthMap = {}
  ;(estimates || []).forEach(e => {
    const d = new Date(e.created_at)
    const key = d.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' })
    monthMap[key] = (monthMap[key] || 0) + (e.total_revenue || 0)
  })
  const data = Object.entries(monthMap).slice(-6).map(([month, revenue]) => ({ month, revenue }))
  if (!data.length) data.push({ month: 'Now', revenue: 0 })

  return (
    <div style={{ background: '#162238', borderRadius: 12, border: '1px solid rgba(201,168,76,0.15)', padding: 20 }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600, color: '#f4f1eb', marginBottom: 16 }}>Revenue by Month</div>
      {data.every(d => d.revenue === 0) ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a9bb5', fontSize: 13 }}>
          No estimate data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a9bb5' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#8a9bb5' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + Math.round(v / 1000) + 'K'} />
            <Tooltip formatter={(v) => [fmtCAD(v), 'Revenue']} contentStyle={{ background: '#1c2b4a', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 8, color: '#f4f1eb', fontSize: 12 }} labelStyle={{ color: '#8a9bb5' }} cursor={{ stroke: 'rgba(201,168,76,0.3)' }} />
            <Area type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

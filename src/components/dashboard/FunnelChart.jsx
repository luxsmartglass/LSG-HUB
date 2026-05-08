import { PIPELINE_STAGES } from '../../lib/pricingDatabase'

export default function FunnelChart({ pipeline }) {
  const counts = {}
  ;(pipeline || []).forEach(p => { counts[p.stage] = (counts[p.stage] || 0) + 1 })
  const total = (pipeline || []).length || 1

  const mainStages = PIPELINE_STAGES.filter(s => !s.muted).slice(0, 8)

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5ddd0', padding: 20 }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600, color: '#1c2b4a', marginBottom: 16 }}>Pipeline Funnel</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mainStages.map(s => {
          const count = counts[s.id] || 0
          const pct = (count / total) * 100
          return (
            <div key={s.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11.5, color: '#4b5563', fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: s.color }}>{count}</span>
              </div>
              <div style={{ height: 5, background: '#f0ebe3', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: s.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

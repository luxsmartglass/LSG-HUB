import { useTheme } from '../../theme/useTheme'
import { Card } from '../ui/Card'
import { PIPELINE_STAGES } from '../../lib/pricingDatabase'

export default function FunnelChart({ pipeline }) {
  const { c } = useTheme()

  const counts = {}
  ;(pipeline || []).forEach(p => { counts[p.stage] = (counts[p.stage] || 0) + 1 })
  const total = (pipeline || []).length || 1

  const mainStages = PIPELINE_STAGES.filter(s => !s.muted).slice(0, 8)

  return (
    <Card>
      <div style={{
        fontFamily: c.font.heading,
        fontSize: c.text.md,
        fontWeight: c.weight.strong,
        color: c.textPrimary,
        marginBottom: 16,
      }}>
        Pipeline Funnel
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mainStages.map(s => {
          const count = counts[s.id] || 0
          const pct = (count / total) * 100
          return (
            <div key={s.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11.5, color: c.textSecondary, fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: s.color }}>{count}</span>
              </div>
              <div style={{
                height: 5,
                background: c.surfaceHover,
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                  background: s.color,
                  borderRadius: 3,
                  transition: 'width .8s cubic-bezier(.22,1,.36,1)',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

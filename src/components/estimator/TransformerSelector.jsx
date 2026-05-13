import { useTheme } from '../../theme/useTheme'
import { getTransformers } from '../../lib/pricingDatabase'
import { useIsMobile } from '../../hooks/useMediaQuery'

export default function TransformerSelector({ zones, useDimming }) {
  const { c } = useTheme()
  const isMobile = useIsMobile()
  const tf = getTransformers(zones || [], useDimming)
  if (!tf.units.length) return null

  return (
    <div style={{
      background: c.surfaceElevated,
      color: c.textPrimary,
      borderRadius: c.radius.lg,
      padding: '18px 20px',
      marginTop: 16,
      border: '1px solid ' + c.border,
    }}>
      <div style={{
        fontSize: c.text.sm,
        fontWeight: c.weight.label,
        color: c.accent,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: '.8px',
      }}>Transformer Recommendation</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 8,
        marginBottom: 4,
      }}>
        {tf.units.map((u, i) => (
          <div key={i} style={{
            fontSize: 14, fontWeight: c.weight.body, color: c.textPrimary,
            padding: '6px 0',
          }}>
            {u.name}{u.qty > 1 ? ` × ${u.qty}` : ''} — ${u.sell} CAD
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: c.textSecondary }}>
        Total: <strong style={{ color: c.textPrimary }}>${tf.recTotal} CAD</strong>
      </div>
      {tf.comparison && (
        <div style={{ fontSize: c.text.sm, color: c.textSecondary, marginTop: 6 }}>
          💡 {tf.comparison}
        </div>
      )}
      <div style={{
        fontSize: c.text.xs,
        color: c.textMuted,
        marginTop: 8,
        lineHeight: c.leading.normal,
        borderTop: '1px solid ' + c.border,
        paddingTop: 8,
      }}>{tf.reason}</div>
    </div>
  )
}

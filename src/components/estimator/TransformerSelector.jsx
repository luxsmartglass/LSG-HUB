import { getTransformers } from '../../lib/pricingDatabase'

export default function TransformerSelector({ zones, useDimming }) {
  const tf = getTransformers(zones || [], useDimming)
  if (!tf.units.length) return null

  return (
    <div style={{ background: '#1c2b4a', color: '#fff', borderRadius: 10, padding: '18px 20px', marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#c9a84c', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.8px' }}>Transformer Recommendation</div>
      {tf.units.map((u, i) => (
        <div key={i} style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{u.name}{u.qty > 1 ? ` × ${u.qty}` : ''} — ${u.sell} CAD</div>
      ))}
      <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Total: <strong>${tf.recTotal} CAD</strong></div>
      {tf.comparison && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>💡 {tf.comparison}</div>}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>{tf.reason}</div>
    </div>
  )
}

import { useTheme } from '../../theme/useTheme'

function fmtCAD(n) { return '$' + Math.round(n || 0).toLocaleString('en-CA') + ' CAD' }

export default function QuoteSidebar({ calc, w }) {
  const { c } = useTheme()
  if (!calc) return null

  return (
    <div style={{
      background: c.surface,
      border: '1px solid ' + c.border,
      borderRadius: c.radius.lg,
      padding: 20,
      position: 'sticky',
      top: 0,
    }}>
      <div style={{
        fontFamily: c.font.heading,
        fontSize: c.text.md,
        fontWeight: c.weight.strong,
        color: c.textPrimary,
        marginBottom: 16,
        paddingBottom: 10,
        borderBottom: '1px solid ' + c.border,
      }}>Quote Summary</div>

      {(calc.zones || []).map((z, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', gap: 8 }}>
          <div style={{ fontSize: c.text.sm, color: c.textSecondary }}>
            {z.type}
            <div style={{ fontSize: c.text.xs, color: c.textMuted }}>{(parseFloat(z.sqm) || 0).toFixed(1)} sqm</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: c.weight.strong, whiteSpace: 'nowrap', color: c.textPrimary }}>{fmtCAD((parseFloat(z.sqm) || 0) * (['Sauna', 'Window (Exterior)'].includes(z.type) ? (w.glass_price || 1050) : (w.film_price || 700)))}</div>
        </div>
      ))}

      <div style={{ borderTop: '1px solid ' + c.border, margin: '8px 0' }} />
      <Line label="Installation" val={fmtCAD(calc.installRev)} c={c} />
      {(calc.tf?.units || []).map((u, i) => <Line key={i} label={`${u.name} ×${u.qty}`} val={fmtCAD(u.sell * u.qty)} c={c} />)}
      {w.incl_electrician && <Line label="Electrician" val={fmtCAD(977)} c={c} />}
      <Line label="Shipping" val={fmtCAD(calc.shipping)} c={c} />

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', borderTop: '2px solid ' + c.border, marginTop: 4 }}>
        <div style={{ fontFamily: c.font.heading, fontSize: c.text.md, fontWeight: c.weight.strong, color: c.textPrimary }}>Total Quote</div>
        <div style={{ fontFamily: c.font.heading, fontSize: c.text.lg, fontWeight: c.weight.hero, color: c.textPrimary }}>{fmtCAD(calc.totalRev)}</div>
      </div>

      {/* Margin bar */}
      <div style={{ margin: '14px 0 6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: c.text.sm, color: c.textMuted, marginBottom: 5 }}>
          <span>Margin</span><span>{(calc.marginPct || 0).toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: c.surfaceHover, borderRadius: c.radius.sm, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, calc.marginPct || 0)}%`, background: c.accent, borderRadius: c.radius.sm, transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{
        background: c.successSoft,
        border: '1px solid ' + c.success + '44',
        borderRadius: c.radius.md,
        padding: '12px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: c.text.sm, color: c.success, fontWeight: c.weight.body }}>Net Profit</div>
        <div style={{ fontSize: 17, fontWeight: c.weight.hero, color: c.success }}>{fmtCAD(calc.netMargin)}</div>
      </div>
    </div>
  )
}

function Line({ label, val, c }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', gap: 8 }}>
      <div style={{ fontSize: 13, color: c.textSecondary }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: c.weight.strong, whiteSpace: 'nowrap', color: c.textPrimary }}>{val}</div>
    </div>
  )
}

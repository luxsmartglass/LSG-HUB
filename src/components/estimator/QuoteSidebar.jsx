function fmtCAD(n) { return '$' + Math.round(n || 0).toLocaleString('en-CA') + ' CAD' }

export default function QuoteSidebar({ calc, w }) {
  if (!calc) return null

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5ddd0', borderRadius: 12, padding: 20, position: 'sticky', top: 0 }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, color: '#1c2b4a', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #e5ddd0' }}>Quote Summary</div>

      {(calc.zones || []).map((z, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', gap: 8 }}>
          <div style={{ fontSize: 12.5, color: '#4b5563' }}>
            {z.type}
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{(parseFloat(z.sqm) || 0).toFixed(1)} sqm</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtCAD((parseFloat(z.sqm) || 0) * (['Sauna', 'Window (Exterior)'].includes(z.type) ? (w.glass_price || 1050) : (w.film_price || 700)))}</div>
        </div>
      ))}

      <div style={{ borderTop: '1px solid #f0ebe3', margin: '8px 0' }} />
      <Line label="Installation" val={fmtCAD(calc.installRev)} />
      {(calc.tf?.units || []).map((u, i) => <Line key={i} label={`${u.name} ×${u.qty}`} val={fmtCAD(u.sell * u.qty)} />)}
      {w.incl_electrician && <Line label="Electrician" val={fmtCAD(977)} />}
      <Line label="Shipping" val={fmtCAD(calc.shipping)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', borderTop: '2px solid #e5ddd0', marginTop: 4 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, color: '#1c2b4a' }}>Total Quote</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#1c2b4a' }}>{fmtCAD(calc.totalRev)}</div>
      </div>

      {/* Margin bar */}
      <div style={{ margin: '14px 0 6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 5 }}>
          <span>Margin</span><span>{(calc.marginPct || 0).toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: '#f0ebe3', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, calc.marginPct || 0)}%`, background: '#c9a84c', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#065f46', fontWeight: 500 }}>Net Profit</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#059669' }}>{fmtCAD(calc.netMargin)}</div>
      </div>
    </div>
  )
}

function Line({ label, val }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', gap: 8 }}>
      <div style={{ fontSize: 13, color: '#4b5563' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{val}</div>
    </div>
  )
}

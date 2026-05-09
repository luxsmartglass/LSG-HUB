import { ZONE_TYPES, zoneProduct, zoneProductType } from '../../lib/pricingDatabase'

export default function ZoneBuilder({ zones, onChange, useDimming }) {
  function addZone() {
    onChange([...zones, { id: Date.now(), type: ZONE_TYPES[0].label, sqm: 0 }])
  }

  function updateZone(id, field, val) {
    onChange(zones.map(z => z.id === id ? { ...z, [field]: val } : z))
  }

  function removeZone(id) {
    onChange(zones.filter(z => z.id !== id))
  }

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr>
            {['#', 'Application', 'Sqm', 'Product', ''].map(h => (
              <th key={h} style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 14px', background: '#1c2b4a', borderBottom: '1px solid rgba(201,168,76,0.2)', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zones.map((z, i) => {
            const prod = zoneProduct(z.type)
            const pt = zoneProductType(z.type)
            const badgeColors = {
              glass: ['rgba(236,72,153,0.15)', '#f9a8d4'],
              'film-colour': ['rgba(139,92,246,0.15)', '#c4b5fd'],
              film: ['rgba(14,165,233,0.15)', '#7dd3fc']
            }
            const [bg, fg] = badgeColors[pt] || badgeColors.film
            return (
              <tr key={z.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '8px 14px', color: 'rgba(244,241,235,0.35)', fontWeight: 600 }}>{i + 1}</td>
                <td style={{ padding: '8px 14px' }}>
                  <select value={z.type} onChange={e => updateZone(z.id, 'type', e.target.value)} style={{ padding: '6px 28px 6px 8px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans',sans-serif", appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c9a84c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', minWidth: 180, background: 'rgba(255,255,255,0.07)', color: '#f4f1eb', outline: 'none' }}>
                    {ZONE_TYPES.map(zt => <option key={zt.label}>{zt.label}</option>)}
                  </select>
                </td>
                <td style={{ padding: '8px 14px' }}>
                  <input type="number" min={0} step={0.1} value={z.sqm || ''} placeholder="0.0" onChange={e => updateZone(z.id, 'sqm', parseFloat(e.target.value) || 0)} style={{ width: 80, padding: '6px 8px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: 'rgba(255,255,255,0.07)', color: '#f4f1eb', outline: 'none' }} />
                </td>
                <td style={{ padding: '8px 14px' }}>
                  <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 4, fontSize: 11.5, fontWeight: 600, background: bg, color: fg }}>{prod}</span>
                </td>
                <td style={{ padding: '8px 14px' }}>
                  <button onClick={() => removeZone(z.id)} style={{ padding: 5, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 5, cursor: 'pointer', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </td>
              </tr>
            )
          })}
          {zones.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '24px 10px', textAlign: 'center', color: 'rgba(244,241,235,0.35)', fontSize: 13 }}>
                No zones added yet. Click &quot;+ Add Zone&quot; to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <button onClick={addZone} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 7, fontSize: 12.5, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", color: '#c9a84c' }}>+ Add Zone</button>
    </div>
  )
}

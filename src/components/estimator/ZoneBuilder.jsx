import { useTheme } from '../../theme/useTheme'
import { ZONE_TYPES, zoneProduct, zoneProductType } from '../../lib/pricingDatabase'

// eslint-disable-next-line no-unused-vars -- useDimming is passed by parent but not yet used in ZoneBuilder; kept for API compat
export default function ZoneBuilder({ zones, onChange, useDimming }) {
  const { c } = useTheme()

  function addZone() {
    onChange([...zones, { id: Date.now(), type: ZONE_TYPES[0].label, sqm: 0 }])
  }

  function updateZone(id, field, val) {
    onChange(zones.map(z => z.id === id ? { ...z, [field]: val } : z))
  }

  function removeZone(id) {
    onChange(zones.filter(z => z.id !== id))
  }

  const selectStyle = {
    padding: '6px 28px 6px 8px',
    border: '1px solid ' + c.border,
    borderRadius: c.radius.md,
    fontSize: 13,
    fontFamily: c.font.body,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b5cf6' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    minWidth: 180,
    background: c.surfaceHover,
    color: c.textPrimary,
    outline: 'none',
  }

  const numberInputStyle = {
    width: 80,
    padding: '6px 8px',
    border: '1px solid ' + c.border,
    borderRadius: c.radius.md,
    fontSize: 13,
    fontFamily: c.font.body,
    background: c.surfaceHover,
    color: c.textPrimary,
    outline: 'none',
  }

  return (
    <div>
      <div className="h-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr>
            {['#', 'Application', 'Sqm', 'Product', ''].map(h => (
              <th key={h} style={{
                fontSize: c.text.xs, fontWeight: c.weight.label,
                color: c.accent, textTransform: 'uppercase',
                letterSpacing: '0.07em', padding: '10px 14px',
                background: c.surfaceElevated,
                borderBottom: '1px solid ' + c.border,
                textAlign: 'left',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zones.map((z, i) => {
            const prod = zoneProduct(z.type)
            const pt = zoneProductType(z.type)
            const badgeColors = {
              glass: [c.highlightSoft, c.highlight],
              'film-colour': [c.accentSoft, c.accent],
              film: [c.successSoft, c.success],
            }
            const [bg, fg] = badgeColors[pt] || badgeColors.film
            return (
              <tr key={z.id} style={{ borderBottom: '1px solid ' + c.border }}>
                <td style={{ padding: '8px 14px', color: c.textMuted, fontWeight: 600 }}>{i + 1}</td>
                <td style={{ padding: '8px 14px' }}>
                  <select value={z.type} onChange={e => updateZone(z.id, 'type', e.target.value)} style={selectStyle}>
                    {ZONE_TYPES.map(zt => <option key={zt.label}>{zt.label}</option>)}
                  </select>
                </td>
                <td style={{ padding: '8px 14px' }}>
                  <input type="number" min={0} step={0.1} value={z.sqm || ''} placeholder="0.0" onChange={e => updateZone(z.id, 'sqm', parseFloat(e.target.value) || 0)} style={numberInputStyle} />
                </td>
                <td style={{ padding: '8px 14px' }}>
                  <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: c.radius.sm, fontSize: c.text.sm, fontWeight: c.weight.button, background: bg, color: fg }}>{prod}</span>
                </td>
                <td style={{ padding: '8px 14px' }}>
                  <button onClick={() => removeZone(z.id)} style={{ padding: 5, background: c.dangerSoft, border: '1px solid ' + c.danger + '44', borderRadius: c.radius.sm, cursor: 'pointer', color: c.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </td>
              </tr>
            )
          })}
          {zones.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '24px 10px', textAlign: 'center', color: c.textMuted, fontSize: 13 }}>
                No zones added yet. Click &quot;+ Add Zone&quot; to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      <button
        onClick={addZone}
        style={{
          padding: '6px 14px',
          background: 'transparent',
          border: '1px solid ' + c.accent + '66',
          borderRadius: c.radius.md,
          fontSize: c.text.sm,
          cursor: 'pointer',
          fontFamily: c.font.body,
          color: c.accent,
        }}
      >+ Add Zone</button>
    </div>
  )
}

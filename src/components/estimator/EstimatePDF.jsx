function zoneProductLabel(type) {
  if (['Sauna', 'Window (Exterior)'].includes(type)) return 'Laminated Smart Glass'
  if (type === 'Feature Wall') return 'Colour PDLC Film'
  return 'Self-Adhesive PDLC Film'
}

function zoneSellPrice(type, filmPrice, glassPrice) {
  if (['Sauna', 'Window (Exterior)'].includes(type)) return glassPrice || 1050
  return filmPrice || 700
}

function fmt(n) {
  if (n == null) return '$0 CAD'
  return '$' + Number(n).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' CAD'
}

function fmtDate(s) {
  if (!s) return new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
  return new Date(s).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
}

const PRINT_STYLE = `
@media print {
  body * { visibility: hidden; }
  #estimate-pdf-printable, #estimate-pdf-printable * { visibility: visible; }
  #estimate-pdf-printable { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
}
`

export default function EstimatePDF({ estimate, onClose }) {
  const e = estimate || {}
  const zones = Array.isArray(e.zones) ? e.zones : []
  const estId = e.id ? String(e.id).slice(0, 8).toUpperCase() : 'XXXXXXXX'
  const totalRev = e.total_revenue || 0
  const deposit = Math.round(totalRev * 0.5)
  const balance = totalRev - deposit

  // Compute zone supply subtotal and install subtotal for breakdown
  const filmPrice = e.film_price || 700
  const glassPrice = e.glass_price || 1050
  const installRate = e.install_rate || 40
  const complexity = e.complexity || 1.0

  let supplyTotal = 0
  let installTotal = 0
  zones.forEach(z => {
    const sqm = parseFloat(z.sqm) || 0
    const sp = zoneSellPrice(z.type, filmPrice, glassPrice)
    supplyTotal += sqm * sp
    installTotal += sqm * installRate * complexity
  })

  const tfCost = e.transformer?.recTotal || 0
  const electrician = e.incl_electrician ? 977 : 0

  return (
    <>
      <style>{PRINT_STYLE}</style>
      {/* Overlay backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 10, maxWidth: 800, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' }}>
          {/* Controls (no-print) */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e5ddd0', background: '#f4f1eb', borderRadius: '10px 10px 0 0' }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 600, color: '#1c2b4a' }}>Estimate Preview</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '7px 16px', background: '#c9a84c', color: '#1c2b4a', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
              >
                Print / Save PDF
              </button>
              <button
                onClick={onClose}
                style={{ padding: '7px 14px', background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Printable content */}
          <div id="estimate-pdf-printable" style={{ padding: '32px 40px', fontFamily: "'DM Sans',sans-serif", color: '#1a1a1a', background: '#fff' }}>
            {/* Top header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: '#1c2b4a', letterSpacing: 1 }}>LUX SMART GLASS</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>GTA's Premier Smart Glass Solutions</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>info@luxsmartglass.ca</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>luxsmartglass.ca</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#c9a84c', letterSpacing: 1 }}>QUOTE / ESTIMATE</div>
                <div style={{ fontSize: 13, color: '#4b5563', marginTop: 6 }}>Estimate #: <strong>EST-{estId}</strong></div>
                <div style={{ fontSize: 13, color: '#4b5563' }}>Date: {fmtDate(e.created_at)}</div>
                <div style={{ fontSize: 13, color: '#4b5563' }}>Valid: 30 days</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '2px solid #1c2b4a', marginBottom: 20 }} />

            {/* Client info */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Prepared For</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1c2b4a' }}>{e.client_name || '—'}</div>
              {e.org && <div style={{ fontSize: 13, color: '#4b5563' }}>{e.org}</div>}
              {e.project_address && <div style={{ fontSize: 13, color: '#4b5563' }}>{e.project_address}</div>}
              <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>
                {[e.email, e.phone].filter(Boolean).join(' | ') || ''}
              </div>
            </div>

            {/* Project meta */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24, background: '#f4f1eb', borderRadius: 8, padding: '12px 16px' }}>
              <div>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Project Type</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1c2b4a', marginTop: 2 }}>{e.type || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Complexity</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1c2b4a', marginTop: 2 }}>{e.complexity || 1.0}×</div>
              </div>
              {e.status && (
                <div>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Status</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1c2b4a', marginTop: 2 }}>{e.status}</div>
                </div>
              )}
            </div>

            {/* Zones table */}
            {zones.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Scope of Work</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#1c2b4a' }}>
                      {['Zone Type', 'Sq. Metres', 'Product', 'Unit Price'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((z, i) => {
                      const sp = zoneSellPrice(z.type, filmPrice, glassPrice)
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f8f5', borderBottom: '1px solid #e5ddd0' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 500 }}>{z.type || '—'}</td>
                          <td style={{ padding: '9px 12px' }}>{z.sqm || '—'}</td>
                          <td style={{ padding: '9px 12px', color: '#4b5563' }}>{zoneProductLabel(z.type)}</td>
                          <td style={{ padding: '9px 12px', color: '#4b5563' }}>${sp.toLocaleString('en-CA')}/sqm</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pricing summary */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Pricing Summary</div>
              <div style={{ background: '#f4f1eb', borderRadius: 8, padding: '16px 20px' }}>
                <PricingRow label="Film / Glass Supply" value={fmt(supplyTotal)} />
                <PricingRow label="Professional Installation" value={fmt(installTotal)} />
                <PricingRow label="Smart Controls (Transformer)" value={fmt(tfCost)} />
                {e.incl_electrician && <PricingRow label="Electrician (Rough-in & Final)" value={fmt(electrician)} />}
                {(e.shipping > 0) && <PricingRow label="Shipping & Logistics" value={fmt(e.shipping)} />}
                <div style={{ borderTop: '2px solid #1c2b4a', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1c2b4a' }}>TOTAL INVESTMENT</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#c9a84c' }}>{fmt(totalRev)}</span>
                </div>
              </div>
            </div>

            {/* Payment schedule */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Payment Schedule</div>
              <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, padding: '14px 20px' }}>
                <PricingRow label="50% Deposit Required" value={fmt(deposit)} />
                <PricingRow label="Balance on Completion" value={fmt(balance)} />
              </div>
            </div>

            {/* Notes */}
            {e.notes && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Notes</div>
                <div style={{ fontSize: 13, color: '#4b5563', background: '#f9f8f5', borderRadius: 6, padding: '10px 14px', lineHeight: 1.6 }}>{e.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: '1px solid #e5ddd0', paddingTop: 16, fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 1.8 }}>
              This quote is valid for 30 days. All prices in CAD including applicable taxes.<br />
              Thank you for considering Lux Smart Glass — Canada's leader in smart glass solutions.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function PricingRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13.5, color: '#374151' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}

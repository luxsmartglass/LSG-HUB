import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import { useTheme } from '../../theme/useTheme'
import { calcQuote } from '../../lib/pricingDatabase'
import ZoneBuilder from './ZoneBuilder'
import QuoteSidebar from './QuoteSidebar'
import TransformerSelector from './TransformerSelector'
import EstimatePDF from './EstimatePDF'

const STEPS = ['Project Info', 'Glass Zones', 'Options & Pricing']

const DEFAULT_WIZARD = {
  step: 1,
  client_name: '', org: '', address: '', email: '', phone: '',
  type: 'Luxury Residential', complexity: 1.0, notes: '',
  zones: [],
  film_price: 700, glass_price: 1050, install_rate: 40,
  incl_electrician: false, use_dimming: false,
  discount: false, discount_pct: 10,
  status: 'Draft'
}

export default function Estimator() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { c } = useTheme()
  const [w, setW] = useState(DEFAULT_WIZARD)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({})
  const [savedEstimate, setSavedEstimate] = useState(null)
  const [showPdf, setShowPdf] = useState(false)

  useEffect(() => {
    loadSettings()
    if (id) loadEstimate(id)
  }, [id])

  useEffect(() => {
    if (location.state?.prefill) {
      setW(prev => ({ ...prev, ...location.state.prefill }))
    }
  }, [])

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('key, value')
    if (data) setSettings(Object.fromEntries(data.map(r => [r.key, r.value])))
  }

  async function loadEstimate(estId) {
    const { data } = await supabase.from('estimates').select('*').eq('id', estId).single()
    if (data) setW({ ...DEFAULT_WIZARD, ...data, address: data.project_address || '', step: 1 })
  }

  function set(key, val) { setW(prev => ({ ...prev, [key]: val })) }

  function nextStep() {
    if (w.step === 1 && !w.client_name.trim()) { toast('Client name is required', 'error'); return }
    if (w.step === 2 && !w.zones.length) { toast('Add at least one zone', 'error'); return }
    if (w.step < 3) set('step', w.step + 1)
  }

  function prevStep() { if (w.step > 1) set('step', w.step - 1) }

  const calc = calcQuote(w, settings)

  async function saveEstimate() {
    if (!w.client_name.trim()) { toast('Client name required', 'error'); return }
    if (!w.zones.length) { toast('Add at least one zone', 'error'); return }
    setSaving(true)
    try {
      const record = {
        client_name: w.client_name,
        project_address: w.address || '',
        zones: w.zones,
        film_price: w.film_price,
        glass_price: w.glass_price,
        install_rate: w.install_rate,
        complexity: w.complexity,
        incl_electrician: w.incl_electrician,
        use_dimming: w.use_dimming,
        discount: w.discount,
        discount_pct: w.discount_pct,
        transformer: calc.tf,
        total_revenue: calc.totalRev,
        total_cost: calc.totalCost,
        net_margin: calc.netMargin,
        margin_pct: calc.marginPct,
        shipping: calc.shipping,
        status: w.status || 'Draft',
        updated_at: new Date().toISOString()
      }
      if (id) {
        const { error } = await supabase.from('estimates').update(record).eq('id', id)
        if (error) { toast('Save failed: ' + error.message, 'error'); return }
        toast('Estimate updated!')
        setSavedEstimate({ ...w, id, total_revenue: calc.totalRev, total_cost: calc.totalCost, net_margin: calc.netMargin, margin_pct: calc.marginPct, shipping: calc.shipping, transformer: calc.tf })
      } else {
        const { data, error } = await supabase.from('estimates').insert(record).select().single()
        if (error) { toast('Save failed: ' + error.message, 'error'); return }
        toast('Estimate saved!')
        if (data?.id) navigate(`/estimator/${data.id}`, { replace: true })
        setSavedEstimate({ ...w, id: data?.id, total_revenue: calc.totalRev, total_cost: calc.totalCost, net_margin: calc.netMargin, margin_pct: calc.marginPct, shipping: calc.shipping, transformer: calc.tf })
      }
    } catch (e) {
      toast('Save failed: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid ' + c.border,
    borderRadius: c.radius.md,
    fontFamily: c.font.body,
    fontSize: c.text.base,
    color: c.textPrimary,
    background: c.surfaceHover,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const goldBtn = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px',
    background: c.accent, color: c.accentText,
    border: 'none', borderRadius: c.radius.md,
    fontSize: c.text.base, fontWeight: c.weight.button,
    cursor: 'pointer', fontFamily: c.font.body,
  }

  const navyBtn = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px',
    background: c.surfaceElevated, color: c.textPrimary,
    border: '1px solid ' + c.border, borderRadius: c.radius.md,
    fontSize: c.text.base, fontWeight: c.weight.body,
    cursor: 'pointer', fontFamily: c.font.body,
  }

  const ghostBtn = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px',
    background: 'transparent', color: c.textSecondary,
    border: '1px solid ' + c.border, borderRadius: c.radius.md,
    fontSize: c.text.base, fontWeight: c.weight.body,
    cursor: 'pointer', fontFamily: c.font.body,
  }

  const labelStyle = {
    fontSize: c.text.xs, fontWeight: c.weight.label,
    color: c.accent, textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 5, display: 'block',
  }

  const cardStyle = {
    background: c.surface,
    borderRadius: c.radius.lg,
    border: '1px solid ' + c.border,
    padding: 24,
    marginBottom: 16,
  }

  return (
    <div className="fade-up" style={{ display: 'flex', gap: 24, alignItems: 'flex-start', animation: 'fadeUp 0.35s ease both' }}>
      {showPdf && savedEstimate && <EstimatePDF estimate={savedEstimate} onClose={() => setShowPdf(false)} />}
      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Step bar */}
        <div style={{ display: 'flex', marginBottom: 28 }}>
          {STEPS.map((s, i) => {
            const n = i + 1
            const cls = n < w.step ? 'done' : n === w.step ? 'active' : 'pending'
            return (
              <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, flexShrink: 0,
                  background: cls === 'done' ? c.success : cls === 'active' ? c.accent : c.surfaceHover,
                  color: cls === 'pending' ? c.textMuted : c.accentText,
                }}>{cls === 'done' ? '✓' : n}</div>
                <div style={{
                  marginLeft: 10, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                  color: cls === 'active' ? c.textPrimary : cls === 'done' ? c.success : c.textMuted,
                }}>{s}</div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2,
                    background: n < w.step ? c.success : c.border,
                    margin: '0 8px',
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step 1 */}
        {w.step === 1 && (
          <div style={cardStyle}>
            <div style={{ fontFamily: c.font.heading, fontSize: c.text.md, marginBottom: 18, color: c.accent }}>Project Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="Client Name *" value={w.client_name} onChange={v => set('client_name', v)} placeholder="e.g. John Doe" inputStyle={inputStyle} labelStyle={labelStyle} />
              <Field label="Organization / Firm" value={w.org} onChange={v => set('org', v)} placeholder="e.g. Acme Corp" inputStyle={inputStyle} labelStyle={labelStyle} />
              <Field label="Client Email" value={w.email} onChange={v => set('email', v)} placeholder="client@email.com" type="email" inputStyle={inputStyle} labelStyle={labelStyle} />
              <Field label="Client Phone" value={w.phone} onChange={v => set('phone', v)} placeholder="+1 416 000 0000" inputStyle={inputStyle} labelStyle={labelStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Field label="Project Address" value={w.address} onChange={v => set('address', v)} placeholder="123 Main St, Toronto, ON" inputStyle={inputStyle} labelStyle={labelStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <SelectField label="Project Type" value={w.type} onChange={v => set('type', v)} options={['Luxury Residential', 'Commercial', 'Healthcare', 'Hospitality']} inputStyle={inputStyle} labelStyle={labelStyle} c={c} />
              <SelectField label="Install Complexity" value={String(w.complexity)} onChange={v => set('complexity', parseFloat(v))} options={[['1.0', 'Standard ×1.0'], ['1.25', 'Moderate ×1.25'], ['1.5', 'Complex ×1.5']]} inputStyle={inputStyle} labelStyle={labelStyle} c={c} />
            </div>
            <TextareaField label="Notes" value={w.notes} onChange={v => set('notes', v)} placeholder="Special requirements…" inputStyle={inputStyle} labelStyle={labelStyle} />
          </div>
        )}

        {/* Step 2 */}
        {w.step === 2 && (
          <div style={cardStyle}>
            <div style={{ fontFamily: c.font.heading, fontSize: c.text.md, marginBottom: 18, color: c.accent }}>Glass Zones</div>
            <ZoneBuilder zones={w.zones} onChange={zones => set('zones', zones)} useDimming={w.use_dimming} />
          </div>
        )}

        {/* Step 3 */}
        {w.step === 3 && (
          <>
            <div style={cardStyle}>
              <div style={{ fontFamily: c.font.heading, fontSize: c.text.md, marginBottom: 18, color: c.accent }}>Options</div>
              <Toggle label="Include Electrician" sub="Rough-in + final connect · $977 CAD" checked={w.incl_electrician} onChange={v => set('incl_electrician', v)} c={c} />
              <Toggle label="Dimming Transformer Upsell" sub="Upgrades to premium dimming control · $239/unit" checked={w.use_dimming} onChange={v => set('use_dimming', v)} c={c} />
              <Toggle label="Apply Discount" sub="Applies to film, glass, and installation" checked={w.discount} onChange={v => set('discount', v)} c={c} />
              {w.discount && (
                <div style={{ marginTop: 8, maxWidth: 200 }}>
                  <Field label="Discount %" value={String(w.discount_pct)} onChange={v => set('discount_pct', parseFloat(v) || 0)} type="number" inputStyle={inputStyle} labelStyle={labelStyle} />
                </div>
              )}
            </div>
            <div style={cardStyle}>
              <div style={{ fontFamily: c.font.heading, fontSize: c.text.md, marginBottom: 18, color: c.accent }}>Pricing</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Film sell price / sqm (CAD)" value={String(w.film_price)} onChange={v => set('film_price', parseFloat(v) || 700)} type="number" inputStyle={inputStyle} labelStyle={labelStyle} />
                <Field label="Glass sell price / sqm (CAD)" value={String(w.glass_price)} onChange={v => set('glass_price', parseFloat(v) || 1050)} type="number" inputStyle={inputStyle} labelStyle={labelStyle} />
                <Field label="Install rate / sqm (CAD)" value={String(w.install_rate)} onChange={v => set('install_rate', parseFloat(v) || 40)} type="number" inputStyle={inputStyle} labelStyle={labelStyle} />
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
          {w.step > 1
            ? <button onClick={prevStep} style={ghostBtn}>← Back</button>
            : <div />
          }
          <div style={{ display: 'flex', gap: 10 }}>
            {w.step === 3 ? (
              <>
                <button onClick={saveEstimate} disabled={saving} style={ghostBtn}>Save Draft</button>
                <button onClick={saveEstimate} disabled={saving} style={goldBtn}>{saving ? 'Saving…' : 'Save Estimate'}</button>
              </>
            ) : (
              <button onClick={nextStep} style={navyBtn}>Next →</button>
            )}
          </div>
        </div>
        {savedEstimate && (
          <div style={{
            background: c.accentSoft,
            border: '1px solid ' + c.accent,
            borderRadius: c.radius.md,
            padding: '12px 16px', marginTop: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: c.accent, fontWeight: c.weight.body, fontSize: c.text.base }}>✓ Estimate saved successfully</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/estimates')} style={ghostBtn}>View All Estimates</button>
              <button onClick={() => setShowPdf(true)} style={goldBtn}>📄 Generate PDF</button>
            </div>
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <div style={{ width: 300, minWidth: 300, position: 'sticky', top: 0 }}>
        <QuoteSidebar calc={calc} w={w} />
        {w.step === 2 && <TransformerSelector zones={w.zones} useDimming={w.use_dimming} />}
      </div>
    </div>
  )
}

// ─── Reusable form fields ────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', inputStyle, labelStyle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )
}

function SelectField({ label, value, onChange, options, inputStyle, labelStyle, c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        ...inputStyle,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b5cf6' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: 30,
      }}>
        {options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder, inputStyle, labelStyle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} />
    </div>
  )
}

function Toggle({ label, sub, checked, onChange, c }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 14px',
      background: c.surfaceHover,
      border: '1px solid ' + c.border,
      borderRadius: c.radius.md,
      marginBottom: 8,
    }}>
      <div>
        <div style={{ fontSize: c.text.base, fontWeight: c.weight.body, color: c.textPrimary }}>{label}</div>
        {sub && <div style={{ fontSize: c.text.sm, color: c.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange(!checked)} style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: checked ? c.accent : c.border, transition: 'background 0.2s' }} />
        <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#fff', top: 3, left: checked ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  )
}

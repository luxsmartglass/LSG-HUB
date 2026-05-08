import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import { calcQuote } from '../../lib/pricingDatabase'
import ZoneBuilder from './ZoneBuilder'
import QuoteSidebar from './QuoteSidebar'
import TransformerSelector from './TransformerSelector'

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
  const toast = useToast()
  const [w, setW] = useState(DEFAULT_WIZARD)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({})

  useEffect(() => {
    loadSettings()
    if (id) loadEstimate(id)
  }, [id])

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('key, value')
    if (data) setSettings(Object.fromEntries(data.map(r => [r.key, r.value])))
  }

  async function loadEstimate(estId) {
    const { data } = await supabase.from('estimates').select('*').eq('id', estId).single()
    if (data) setW({ ...DEFAULT_WIZARD, ...data, step: 1 })
  }

  function set(key, val) { setW(prev => ({ ...prev, [key]: val })) }

  function nextStep() {
    if (w.step === 1 && !w.client_name.trim()) { toast('Client name is required', 'error'); return }
    if (w.step === 2 && !w.zones.length) { toast('Add at least one zone', 'error'); return }
    if (w.step < 3) set('step', w.step + 1)
  }

  function prevStep() { if (w.step > 1) set('step', w.step - 1) }

  const calc = calcQuote(w, settings)

  async function saveEstimate(andNavigate = true) {
    if (!w.client_name.trim()) { toast('Client name required', 'error'); return }
    if (!w.zones.length) { toast('Add at least one zone', 'error'); return }
    setSaving(true)
    try {
      const record = {
        client_name: w.client_name, address: w.address, org: w.org,
        email: w.email, phone: w.phone, type: w.type,
        zones: w.zones, film_price: w.film_price, glass_price: w.glass_price,
        install_rate: w.install_rate, complexity: w.complexity, notes: w.notes,
        incl_electrician: w.incl_electrician, use_dimming: w.use_dimming,
        discount: w.discount, discount_pct: w.discount_pct,
        transformer: calc.tf, total_revenue: calc.totalRev,
        total_cost: calc.totalCost, net_margin: calc.netMargin,
        margin_pct: calc.marginPct, shipping: calc.shipping,
        status: w.status || 'Draft', updated_at: new Date().toISOString()
      }
      if (id) {
        await supabase.from('estimates').update(record).eq('id', id)
        toast('Estimate updated!')
      } else {
        const { data } = await supabase.from('estimates').insert(record).select().single()
        toast('Estimate saved!')
        if (andNavigate && data) navigate(`/estimator/${data.id}`)
      }
    } catch (e) {
      toast('Save failed: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', animation: 'fadeUp 0.35s ease both' }}>
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
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, flexShrink: 0,
                  background: cls === 'done' ? '#059669' : cls === 'active' ? '#1c2b4a' : '#e5ddd0',
                  color: cls === 'pending' ? '#9ca3af' : '#fff'
                }}>{cls === 'done' ? '✓' : n}</div>
                <div style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: cls === 'active' ? '#1c2b4a' : cls === 'done' ? '#059669' : '#9ca3af', whiteSpace: 'nowrap' }}>{s}</div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: n < w.step ? '#059669' : '#e5ddd0', margin: '0 8px' }} />}
              </div>
            )
          })}
        </div>

        {/* Step 1 */}
        {w.step === 1 && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5ddd0', padding: 24, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 18, color: '#1c2b4a' }}>Project Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="Client Name *" value={w.client_name} onChange={v => set('client_name', v)} placeholder="e.g. John Doe" />
              <Field label="Organization / Firm" value={w.org} onChange={v => set('org', v)} placeholder="e.g. Acme Corp" />
              <Field label="Client Email" value={w.email} onChange={v => set('email', v)} placeholder="client@email.com" type="email" />
              <Field label="Client Phone" value={w.phone} onChange={v => set('phone', v)} placeholder="+1 416 000 0000" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Field label="Project Address" value={w.address} onChange={v => set('address', v)} placeholder="123 Main St, Toronto, ON" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <SelectField label="Project Type" value={w.type} onChange={v => set('type', v)} options={['Luxury Residential', 'Commercial', 'Healthcare', 'Hospitality']} />
              <SelectField label="Install Complexity" value={String(w.complexity)} onChange={v => set('complexity', parseFloat(v))} options={[['1.0', 'Standard ×1.0'], ['1.25', 'Moderate ×1.25'], ['1.5', 'Complex ×1.5']]} />
            </div>
            <TextareaField label="Notes" value={w.notes} onChange={v => set('notes', v)} placeholder="Special requirements…" />
          </div>
        )}

        {/* Step 2 */}
        {w.step === 2 && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5ddd0', padding: 24, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 18, color: '#1c2b4a' }}>Glass Zones</div>
            <ZoneBuilder zones={w.zones} onChange={zones => set('zones', zones)} useDimming={w.use_dimming} />
          </div>
        )}

        {/* Step 3 */}
        {w.step === 3 && (
          <>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5ddd0', padding: 24, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 18, color: '#1c2b4a' }}>Options</div>
              <Toggle label="Include Electrician" sub="Rough-in + final connect · $977 CAD" checked={w.incl_electrician} onChange={v => set('incl_electrician', v)} />
              <Toggle label="Dimming Transformer Upsell" sub="Upgrades to premium dimming control · $239/unit" checked={w.use_dimming} onChange={v => set('use_dimming', v)} />
              <Toggle label="Apply Discount" sub="Applies to film, glass, and installation" checked={w.discount} onChange={v => set('discount', v)} />
              {w.discount && (
                <div style={{ marginTop: 8, maxWidth: 200 }}>
                  <Field label="Discount %" value={String(w.discount_pct)} onChange={v => set('discount_pct', parseFloat(v) || 0)} type="number" />
                </div>
              )}
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5ddd0', padding: 24, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 18, color: '#1c2b4a' }}>Pricing</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Film sell price / sqm (CAD)" value={String(w.film_price)} onChange={v => set('film_price', parseFloat(v) || 700)} type="number" />
                <Field label="Glass sell price / sqm (CAD)" value={String(w.glass_price)} onChange={v => set('glass_price', parseFloat(v) || 1050)} type="number" />
                <Field label="Install rate / sqm (CAD)" value={String(w.install_rate)} onChange={v => set('install_rate', parseFloat(v) || 40)} type="number" />
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
                <button onClick={() => saveEstimate(false)} disabled={saving} style={ghostBtn}>Save Draft</button>
                <button onClick={() => saveEstimate(true)} disabled={saving} style={goldBtn}>{saving ? 'Saving…' : 'Save Estimate'}</button>
              </>
            ) : (
              <button onClick={nextStep} style={navyBtn}>Next →</button>
            )}
          </div>
        </div>
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
const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5ddd0', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: '#1a1a1a', background: '#fff', outline: 'none', boxSizing: 'border-box' }
const goldBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#c9a84c', color: '#1c2b4a', border: 'none', borderRadius: 7, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }
const navyBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#1c2b4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }
const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'transparent', color: '#4b5563', border: '1px solid #e5ddd0', borderRadius: 7, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 500, color: '#4b5563' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 500, color: '#4b5563' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 30 }}>
        {options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 500, color: '#4b5563' }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} />
    </div>
  )
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#f4f1eb', borderRadius: 8, marginBottom: 8 }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange(!checked)} style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: checked ? '#1c2b4a' : '#d1d5db', transition: 'background 0.2s' }} />
        <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#fff', top: 3, left: checked ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import GmailSettings from './GmailSettings'
import StripeSettings from './StripeSettings'

const COLORS = {
  navy: '#1c2b4a',
  gold: '#c9a84c',
  cream: '#f4f1eb',
  bg: '#0f1d35',
  cardBg: '#162236',
}

function inputStyle(focused) {
  return {
    width: '100%',
    background: '#0f1d35',
    border: `1px solid ${focused ? COLORS.gold : '#1e3352'}`,
    borderRadius: 8,
    color: COLORS.cream,
    fontSize: 14,
    padding: '9px 12px',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block',
        color: '#8a9bb5',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.05em',
        marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const DEFAULT_SETTINGS = {
  company_name: '',
  company_email: '',
  phone: '',
  address: '',
  usd_cad_rate: '1.37',
  default_tax_rate: '13',
  default_deposit_pct: '50',
}

export default function Settings() {
  const addToast = useToast()

  const [fields, setFields] = useState(DEFAULT_SETTINGS)
  const [focused, setFocused] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const keys = Object.keys(DEFAULT_SETTINGS)
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', keys)
        if (error) throw error
        if (data) {
          const loaded = { ...DEFAULT_SETTINGS }
          data.forEach(row => { loaded[row.key] = row.value || '' })
          setFields(loaded)
        }
      } catch (err) {
        addToast('Could not load settings: ' + err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  function setField(key, value) {
    setFields(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const upsertRows = Object.entries(fields).map(([key, value]) => ({ key, value: String(value) }))
      const { error } = await supabase
        .from('settings')
        .upsert(upsertRows, { onConflict: 'key' })
      if (error) throw error
      addToast('Settings saved successfully', 'success')
    } catch (err) {
      addToast('Failed to save settings: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleClearLocalData() {
    if (!window.confirm('Clear all local data? This will remove cached tokens and local preferences.')) return
    localStorage.clear()
    sessionStorage.clear()
    addToast('Local data cleared', 'success')
  }

  const fo = (key) => ({
    onFocus: () => setFocused(f => ({ ...f, [key]: true })),
    onBlur: () => setFocused(f => ({ ...f, [key]: false })),
  })

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '32px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: COLORS.cream, fontSize: 26, fontWeight: 700, margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: '#8a9bb5', fontSize: 14, margin: '5px 0 0' }}>
          Manage integrations and business preferences
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 720 }}>

        {/* Integrations Section */}
        <section>
          <h2 style={{
            color: COLORS.gold,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            margin: '0 0 14px',
            paddingBottom: 8,
            borderBottom: '1px solid #1e3352',
          }}>
            Integrations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <GmailSettings />
            <StripeSettings />
          </div>
        </section>

        {/* Business Settings Section */}
        <section>
          <h2 style={{
            color: COLORS.gold,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            margin: '0 0 14px',
            paddingBottom: 8,
            borderBottom: '1px solid #1e3352',
          }}>
            Business Settings
          </h2>

          <div style={{
            background: COLORS.cardBg,
            borderRadius: 14,
            padding: 24,
            border: '1px solid #1e3352',
          }}>
            {loading ? (
              <div style={{ color: '#8a9bb5', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                Loading settings…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Row 1: Company name + email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FormField label="Company Name">
                    <input
                      value={fields.company_name}
                      onChange={e => setField('company_name', e.target.value)}
                      placeholder="Lux Smart Glass"
                      style={inputStyle(focused.company_name)}
                      {...fo('company_name')}
                    />
                  </FormField>
                  <FormField label="Company Email">
                    <input
                      type="email"
                      value={fields.company_email}
                      onChange={e => setField('company_email', e.target.value)}
                      placeholder="info@luxsmartglass.ca"
                      style={inputStyle(focused.company_email)}
                      {...fo('company_email')}
                    />
                  </FormField>
                </div>

                {/* Row 2: Phone + Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FormField label="Phone">
                    <input
                      value={fields.phone}
                      onChange={e => setField('phone', e.target.value)}
                      placeholder="+1 (416) 000-0000"
                      style={inputStyle(focused.phone)}
                      {...fo('phone')}
                    />
                  </FormField>
                  <FormField label="Address">
                    <input
                      value={fields.address}
                      onChange={e => setField('address', e.target.value)}
                      placeholder="123 Main St, Toronto ON"
                      style={inputStyle(focused.address)}
                      {...fo('address')}
                    />
                  </FormField>
                </div>

                {/* Row 3: Financial settings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <FormField label="USD/CAD Exchange Rate">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fields.usd_cad_rate}
                      onChange={e => setField('usd_cad_rate', e.target.value)}
                      placeholder="1.37"
                      style={inputStyle(focused.usd_cad_rate)}
                      {...fo('usd_cad_rate')}
                    />
                  </FormField>
                  <FormField label="Default Tax Rate (%)">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={fields.default_tax_rate}
                      onChange={e => setField('default_tax_rate', e.target.value)}
                      placeholder="13"
                      style={inputStyle(focused.default_tax_rate)}
                      {...fo('default_tax_rate')}
                    />
                  </FormField>
                  <FormField label="Default Deposit (%)">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={fields.default_deposit_pct}
                      onChange={e => setField('default_deposit_pct', e.target.value)}
                      placeholder="50"
                      style={inputStyle(focused.default_deposit_pct)}
                      {...fo('default_deposit_pct')}
                    />
                  </FormField>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '10px 28px',
                      borderRadius: 8,
                      border: 'none',
                      background: COLORS.gold,
                      color: '#0f1d35',
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: saving ? 0.7 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {saving ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 style={{
            color: '#ef4444',
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            margin: '0 0 14px',
            paddingBottom: 8,
            borderBottom: '1px solid #3a1515',
          }}>
            Danger Zone
          </h2>
          <div style={{
            background: '#1a0a0a',
            borderRadius: 14,
            padding: 20,
            border: '1px solid #3a1515',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ color: COLORS.cream, fontSize: 14, fontWeight: 600, margin: 0 }}>
                Clear All Local Data
              </p>
              <p style={{ color: '#8a9bb5', fontSize: 12.5, margin: '3px 0 0' }}>
                Removes cached tokens, OAuth credentials, and local preferences from this browser.
              </p>
            </div>
            <button
              onClick={handleClearLocalData}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                border: '1px solid #ef4444',
                background: 'transparent',
                color: '#ef4444',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: 'nowrap',
              }}
            >
              Clear Local Data
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

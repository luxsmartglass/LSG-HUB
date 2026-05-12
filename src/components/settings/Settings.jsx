import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import { useTheme } from '../../theme/useTheme'
import { Button } from '../ui/Button'
import GmailSettings from './GmailSettings'
import StripeSettings from './StripeSettings'

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
  const { c } = useTheme()
  const addToast = useToast()

  const [fields, setFields] = useState(DEFAULT_SETTINGS)
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

  const inputStyle = {
    width: '100%',
    background: c.surfaceHover,
    border: `1px solid ${c.border}`,
    borderRadius: c.radius.md,
    color: c.textPrimary,
    fontSize: c.text.base,
    padding: '9px 12px',
    outline: 'none',
    fontFamily: c.font.body,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block',
    color: c.textMuted,
    fontSize: c.text.sm,
    fontWeight: c.weight.label,
    letterSpacing: '0.05em',
    marginBottom: 6,
  }

  const sectionHeaderStyle = {
    color: c.accent,
    fontSize: c.text.sm,
    fontWeight: c.weight.label,
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    margin: '0 0 14px',
    paddingBottom: 8,
    borderBottom: `1px solid ${c.border}`,
  }

  return (
    <div className="fade-up" style={{ minHeight: '100vh', background: c.bg, padding: '32px 24px', fontFamily: c.font.body }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: c.textPrimary, fontSize: c.text['2xl'], fontWeight: c.weight.hero, margin: 0, fontFamily: c.font.heading }}>
          Settings
        </h1>
        <p style={{ color: c.textMuted, fontSize: c.text.base, margin: '5px 0 0' }}>
          Manage integrations and business preferences
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 720 }}>

        {/* Integrations Section */}
        <section>
          <h2 style={sectionHeaderStyle}>Integrations</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <GmailSettings />
            <StripeSettings />
          </div>
        </section>

        {/* Business Settings Section */}
        <section>
          <h2 style={sectionHeaderStyle}>Business Settings</h2>

          <div style={{
            background: c.surface,
            borderRadius: c.radius.lg,
            padding: 24,
            border: `1px solid ${c.border}`,
            boxShadow: c.shadowSm,
          }}>
            {loading ? (
              <div style={{ color: c.textMuted, fontSize: c.text.sm, textAlign: 'center', padding: '24px 0' }}>
                Loading settings…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Row 1: Company name + email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Company Name</label>
                    <input
                      value={fields.company_name}
                      onChange={e => setField('company_name', e.target.value)}
                      placeholder="Lux Smart Glass"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Company Email</label>
                    <input
                      type="email"
                      value={fields.company_email}
                      onChange={e => setField('company_email', e.target.value)}
                      placeholder="info@luxsmartglass.ca"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Row 2: Phone + Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input
                      value={fields.phone}
                      onChange={e => setField('phone', e.target.value)}
                      placeholder="+1 (416) 000-0000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Address</label>
                    <input
                      value={fields.address}
                      onChange={e => setField('address', e.target.value)}
                      placeholder="123 Main St, Toronto ON"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Row 3: Financial settings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>USD/CAD Exchange Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fields.usd_cad_rate}
                      onChange={e => setField('usd_cad_rate', e.target.value)}
                      placeholder="1.37"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Default Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={fields.default_tax_rate}
                      onChange={e => setField('default_tax_rate', e.target.value)}
                      placeholder="13"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Default Deposit (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={fields.default_deposit_pct}
                      onChange={e => setField('default_deposit_pct', e.target.value)}
                      placeholder="50"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                  <Button variant="primary" loading={saving} onClick={handleSave}>
                    {saving ? 'Saving…' : 'Save Settings'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 style={{
            ...sectionHeaderStyle,
            color: c.danger,
            borderBottomColor: `${c.danger}33`,
          }}>
            Danger Zone
          </h2>
          <div style={{
            background: c.surface,
            borderRadius: c.radius.lg,
            padding: 20,
            border: `1px solid ${c.danger}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ color: c.textPrimary, fontSize: c.text.base, fontWeight: c.weight.strong, margin: 0 }}>
                Clear All Local Data
              </p>
              <p style={{ color: c.textMuted, fontSize: c.text.sm, margin: '3px 0 0' }}>
                Removes cached tokens, OAuth credentials, and local preferences from this browser.
              </p>
            </div>
            <Button variant="danger" onClick={handleClearLocalData}>
              Clear Local Data
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

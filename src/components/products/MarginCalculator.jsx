import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../theme/useTheme'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { Button } from '../ui/Button'
import { ZONE_TYPES, filmCostPerSqm, glassCostPerSqm, DEFAULT_FX } from '../../lib/pricingDatabase'

function marginColor(pct, c) {
  if (pct >= 50) return c.success
  if (pct >= 30) return c.warning
  return c.danger
}

function ToggleSwitch({ checked, onChange, label, c }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? c.accent : c.border,
          position: 'relative',
          transition: 'background 0.2s',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ color: c.textPrimary, fontSize: c.text.sm }}>{label}</span>
    </label>
  )
}

function OutputRow({ label, value, highlight, c }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: `1px solid ${c.border}`,
    }}>
      <span style={{ color: c.textMuted, fontSize: c.text.sm }}>{label}</span>
      <span style={{
        color: highlight ? c.accent : c.textPrimary,
        fontSize: highlight ? c.text.md : c.text.sm,
        fontWeight: highlight ? c.weight.strong : c.weight.body,
      }}>
        {value}
      </span>
    </div>
  )
}

export default function MarginCalculator() {
  const { c } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [fx, setFx] = useState(DEFAULT_FX)
  const [sqm, setSqm] = useState('')
  const [zone, setZone] = useState(ZONE_TYPES[0].label)
  const [sellFilm, setSellFilm] = useState(700)
  const [sellGlass, setSellGlass] = useState(1050)
  const [useDimming, setUseDimming] = useState(false)
  const [inclElec, setInclElec] = useState(false)
  const [complexity, setComplexity] = useState(1.0)

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['usd_cad_rate'])
        if (data) {
          data.forEach(row => {
            if (row.key === 'usd_cad_rate') setFx(parseFloat(row.value) || DEFAULT_FX)
          })
        }
      } catch {
        // use defaults
      }
    }
    loadSettings()
  }, [])

  // Derived zone type
  const zoneInfo = ZONE_TYPES.find(z => z.label === zone) || ZONE_TYPES[0]
  const isGlass = zoneInfo.type === 'glass'
  const isColour = zoneInfo.type === 'film-colour'

  const sqmNum = parseFloat(sqm) || 0

  // Revenue
  const sellPricePerSqm = isGlass ? sellGlass : sellFilm
  const filmGlassRevenue = sqmNum * sellPricePerSqm
  const installRate = 40
  const installRevenue = sqmNum * installRate * complexity
  const transformerSell = useDimming ? 239 : 189
  const elecRevenue = inclElec ? 977 : 0
  const totalRevenue = filmGlassRevenue + installRevenue + transformerSell + elecRevenue

  // Cost
  const costPerSqm = isGlass
    ? glassCostPerSqm(sqmNum, fx)
    : filmCostPerSqm(sqmNum, isColour ? 'film-colour' : 'film', fx)
  const filmGlassCost = sqmNum * costPerSqm
  const tfCostUSD = useDimming ? 95 : 46
  const transformerCost = tfCostUSD * fx
  const totalCost = filmGlassCost + transformerCost + elecRevenue
  const netProfit = totalRevenue - totalCost
  const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const fmt = (n) => `$${n.toFixed(2)}`

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
    color: c.textMuted,
    fontSize: c.text.sm,
    fontWeight: c.weight.label,
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: 6,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, alignItems: 'start' }}>
      {/* Input Panel */}
      <div style={{ background: c.surface, borderRadius: c.radius.lg, padding: 24, border: `1px solid ${c.border}`, boxShadow: c.shadowSm }}>
        <h3 style={{ color: c.textPrimary, fontSize: c.text.md, fontWeight: c.weight.strong, margin: '0 0 22px', fontFamily: c.font.heading }}>
          Calculator Inputs
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Sqm */}
          <div>
            <label style={labelStyle}>Area (sqm)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={sqm}
              onChange={e => setSqm(e.target.value)}
              placeholder="e.g. 10"
              style={inputStyle}
            />
          </div>

          {/* Zone Type */}
          <div>
            <label style={labelStyle}>Zone Type</label>
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {ZONE_TYPES.map(z => (
                <option key={z.label} value={z.label}>{z.label} — {z.product}</option>
              ))}
            </select>
          </div>

          {/* Sell Price */}
          <div>
            <label style={labelStyle}>
              {isGlass ? 'Glass Sell Price ($/sqm)' : 'Film Sell Price ($/sqm)'}
            </label>
            <input
              type="number"
              min="0"
              value={isGlass ? sellGlass : sellFilm}
              onChange={e => isGlass ? setSellGlass(Number(e.target.value)) : setSellFilm(Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          {/* Complexity */}
          <div>
            <label style={labelStyle}>Complexity Multiplier — {complexity.toFixed(1)}×</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={complexity}
                onChange={e => setComplexity(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: c.accent, cursor: 'pointer' }}
              />
              <span style={{ color: c.accent, fontSize: c.text.sm, fontWeight: c.weight.strong, minWidth: 30 }}>
                {complexity.toFixed(1)}×
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ color: c.textMuted, fontSize: c.text.xs }}>Simple (0.5×)</span>
              <span style={{ color: c.textMuted, fontSize: c.text.xs }}>Complex (2.0×)</span>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ToggleSwitch
              checked={useDimming}
              onChange={setUseDimming}
              label="Use Dimming Transformer (+$50)"
              c={c}
            />
            <ToggleSwitch
              checked={inclElec}
              onChange={setInclElec}
              label="Include Electrician (+$977)"
              c={c}
            />
          </div>
        </div>
      </div>

      {/* Output Panel */}
      <div style={{ background: c.surface, borderRadius: c.radius.lg, padding: 24, border: `1px solid ${c.border}`, boxShadow: c.shadowSm }}>
        <h3 style={{ color: c.textPrimary, fontSize: c.text.md, fontWeight: c.weight.strong, margin: '0 0 22px', fontFamily: c.font.heading }}>
          Margin Analysis
        </h3>

        {sqmNum === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: c.textMuted,
            fontSize: c.text.sm,
          }}>
            Enter an area to see margin analysis
          </div>
        ) : (
          <>
            {/* Margin bar */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: c.textMuted, fontSize: c.text.xs, fontWeight: c.weight.label, letterSpacing: '0.05em' }}>OVERALL MARGIN</span>
                <span style={{
                  color: marginColor(marginPct, c),
                  fontSize: c.text.xl,
                  fontWeight: c.weight.hero,
                }}>
                  {marginPct.toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 10, background: c.surfaceHover, borderRadius: 5 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, marginPct))}%`,
                  background: marginColor(marginPct, c),
                  borderRadius: 5,
                  transition: 'width 0.35s, background 0.35s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ color: c.danger, fontSize: c.text.xs }}>Low &lt;30%</span>
                <span style={{ color: c.warning, fontSize: c.text.xs }}>Amber 30–50%</span>
                <span style={{ color: c.success, fontSize: c.text.xs }}>Good &gt;50%</span>
              </div>
            </div>

            {/* Revenue breakdown */}
            <div style={{
              background: c.surfaceHover,
              borderRadius: c.radius.md,
              padding: '4px 16px 4px',
              marginBottom: 16,
            }}>
              <p style={{ color: c.textMuted, fontSize: c.text.xs, fontWeight: c.weight.label, letterSpacing: '0.07em', margin: '14px 0 2px' }}>
                REVENUE
              </p>
              <OutputRow label={isGlass ? 'Glass Revenue' : 'Film Revenue'} value={fmt(filmGlassRevenue)} c={c} />
              <OutputRow label={`Install Revenue (${complexity.toFixed(1)}× complexity)`} value={fmt(installRevenue)} c={c} />
              <OutputRow label={`Transformer (${useDimming ? 'Dimming' : 'Normal'})`} value={fmt(transformerSell)} c={c} />
              {inclElec && <OutputRow label="Electrician" value={fmt(elecRevenue)} c={c} />}
              <OutputRow label="Total Revenue" value={fmt(totalRevenue)} highlight c={c} />
            </div>

            {/* Cost breakdown */}
            <div style={{
              background: c.surfaceHover,
              borderRadius: c.radius.md,
              padding: '4px 16px 4px',
              marginBottom: 16,
            }}>
              <p style={{ color: c.textMuted, fontSize: c.text.xs, fontWeight: c.weight.label, letterSpacing: '0.07em', margin: '14px 0 2px' }}>
                COST (CAD @ {fx.toFixed(2)})
              </p>
              <OutputRow label={`${isGlass ? 'Glass' : 'Film'} Cost ($${costPerSqm.toFixed(2)}/sqm)`} value={fmt(filmGlassCost)} c={c} />
              <OutputRow label="Transformer Cost" value={fmt(transformerCost)} c={c} />
              {inclElec && <OutputRow label="Electrician Pass-through" value={fmt(elecRevenue)} c={c} />}
              <OutputRow label="Total Cost" value={fmt(totalCost)} c={c} />
            </div>

            {/* Net profit */}
            <div style={{
              background: c.surfaceHover,
              borderRadius: c.radius.md,
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <span style={{ color: c.textPrimary, fontSize: c.text.md, fontWeight: c.weight.strong }}>Net Profit</span>
              <span style={{
                color: netProfit >= 0 ? c.success : c.danger,
                fontSize: c.text.xl,
                fontWeight: c.weight.hero,
              }}>
                {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
              </span>
            </div>

            {/* Add to Quote */}
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate('/estimator', {
                state: {
                  prefill: {
                    zones: [{ type: zoneInfo.type, sqm: String(sqmNum) }],
                    film_price: sellPricePerSqm,
                    glass_price: sellPricePerSqm,
                  }
                }
              })}
            >
              Add to Quote
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

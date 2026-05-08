import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import { ZONE_TYPES, filmCostPerSqm, glassCostPerSqm, DEFAULT_FX } from '../../lib/pricingDatabase'

const COLORS = {
  navy: '#1c2b4a',
  gold: '#c9a84c',
  cream: '#f4f1eb',
  bg: '#0f1d35',
  cardBg: '#162236',
}

function marginColor(pct) {
  if (pct >= 50) return '#22c55e'
  if (pct >= 30) return '#f59e0b'
  return '#ef4444'
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

function Label({ children }) {
  return (
    <label style={{ color: '#8a9bb5', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
      {children}
    </label>
  )
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? COLORS.gold : '#1e3352',
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
      <span style={{ color: COLORS.cream, fontSize: 13.5 }}>{label}</span>
    </label>
  )
}

function OutputRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #1e3352',
    }}>
      <span style={{ color: '#8a9bb5', fontSize: 13 }}>{label}</span>
      <span style={{
        color: highlight ? COLORS.gold : COLORS.cream,
        fontSize: highlight ? 16 : 13.5,
        fontWeight: highlight ? 700 : 500,
      }}>
        {value}
      </span>
    </div>
  )
}

export default function MarginCalculator() {
  const addToast = useToast()

  const [fx, setFx] = useState(DEFAULT_FX)
  const [sqm, setSqm] = useState('')
  const [zone, setZone] = useState(ZONE_TYPES[0].label)
  const [sellFilm, setSellFilm] = useState(700)
  const [sellGlass, setSellGlass] = useState(1050)
  const [useDimming, setUseDimming] = useState(false)
  const [inclElec, setInclElec] = useState(false)
  const [complexity, setComplexity] = useState(1.0)
  const [focused, setFocused] = useState({})

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
  let costPerSqm = 0
  if (isGlass) {
    costPerSqm = glassCostPerSqm(sqmNum, fx)
  } else {
    costPerSqm = filmCostPerSqm(sqmNum, isColour ? 'film-colour' : 'film', fx)
  }
  const filmGlassCost = sqmNum * costPerSqm
  const tfCostUSD = useDimming ? 95 : 46
  const transformerCost = tfCostUSD * fx
  const totalCost = filmGlassCost + transformerCost + elecRevenue
  const netProfit = totalRevenue - totalCost
  const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const fmt = (n) => `$${n.toFixed(2)}`

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      {/* Input Panel */}
      <div style={{ background: COLORS.cardBg, borderRadius: 14, padding: 24, border: '1px solid #1e3352' }}>
        <h3 style={{ color: COLORS.cream, fontSize: 16, fontWeight: 700, margin: '0 0 22px' }}>
          Calculator Inputs
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Sqm */}
          <div>
            <Label>Area (sqm)</Label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={sqm}
              onChange={e => setSqm(e.target.value)}
              onFocus={() => setFocused(f => ({ ...f, sqm: true }))}
              onBlur={() => setFocused(f => ({ ...f, sqm: false }))}
              placeholder="e.g. 10"
              style={inputStyle(focused.sqm)}
            />
          </div>

          {/* Zone Type */}
          <div>
            <Label>Zone Type</Label>
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              onFocus={() => setFocused(f => ({ ...f, zone: true }))}
              onBlur={() => setFocused(f => ({ ...f, zone: false }))}
              style={{ ...inputStyle(focused.zone), cursor: 'pointer' }}
            >
              {ZONE_TYPES.map(z => (
                <option key={z.label} value={z.label}>{z.label} — {z.product}</option>
              ))}
            </select>
          </div>

          {/* Sell Price */}
          <div>
            <Label>
              {isGlass ? 'Glass Sell Price ($/sqm)' : 'Film Sell Price ($/sqm)'}
            </Label>
            <input
              type="number"
              min="0"
              value={isGlass ? sellGlass : sellFilm}
              onChange={e => isGlass ? setSellGlass(Number(e.target.value)) : setSellFilm(Number(e.target.value))}
              onFocus={() => setFocused(f => ({ ...f, sell: true }))}
              onBlur={() => setFocused(f => ({ ...f, sell: false }))}
              style={inputStyle(focused.sell)}
            />
          </div>

          {/* Complexity */}
          <div>
            <Label>Complexity Multiplier — {complexity.toFixed(1)}×</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={complexity}
                onChange={e => setComplexity(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: COLORS.gold, cursor: 'pointer' }}
              />
              <span style={{ color: COLORS.gold, fontSize: 13, fontWeight: 600, minWidth: 30 }}>
                {complexity.toFixed(1)}×
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ color: '#637a96', fontSize: 11 }}>Simple (0.5×)</span>
              <span style={{ color: '#637a96', fontSize: 11 }}>Complex (2.0×)</span>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ToggleSwitch
              checked={useDimming}
              onChange={setUseDimming}
              label="Use Dimming Transformer (+$50)"
            />
            <ToggleSwitch
              checked={inclElec}
              onChange={setInclElec}
              label="Include Electrician (+$977)"
            />
          </div>
        </div>
      </div>

      {/* Output Panel */}
      <div style={{ background: COLORS.cardBg, borderRadius: 14, padding: 24, border: '1px solid #1e3352' }}>
        <h3 style={{ color: COLORS.cream, fontSize: 16, fontWeight: 700, margin: '0 0 22px' }}>
          Margin Analysis
        </h3>

        {sqmNum === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#637a96',
            fontSize: 13.5,
          }}>
            Enter an area to see margin analysis
          </div>
        ) : (
          <>
            {/* Margin bar */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#8a9bb5', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>OVERALL MARGIN</span>
                <span style={{
                  color: marginColor(marginPct),
                  fontSize: 22,
                  fontWeight: 800,
                }}>
                  {marginPct.toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 10, background: '#0f1d35', borderRadius: 5 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, marginPct))}%`,
                  background: marginColor(marginPct),
                  borderRadius: 5,
                  transition: 'width 0.35s, background 0.35s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ color: '#ef4444', fontSize: 10.5 }}>Low &lt;30%</span>
                <span style={{ color: '#f59e0b', fontSize: 10.5 }}>Amber 30–50%</span>
                <span style={{ color: '#22c55e', fontSize: 10.5 }}>Good &gt;50%</span>
              </div>
            </div>

            {/* Revenue breakdown */}
            <div style={{
              background: '#0f1d35',
              borderRadius: 10,
              padding: '4px 16px 4px',
              marginBottom: 16,
            }}>
              <p style={{ color: '#8a9bb5', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', margin: '14px 0 2px' }}>
                REVENUE
              </p>
              <OutputRow label={isGlass ? 'Glass Revenue' : 'Film Revenue'} value={fmt(filmGlassRevenue)} />
              <OutputRow label={`Install Revenue (${complexity.toFixed(1)}× complexity)`} value={fmt(installRevenue)} />
              <OutputRow label={`Transformer (${useDimming ? 'Dimming' : 'Normal'})`} value={fmt(transformerSell)} />
              {inclElec && <OutputRow label="Electrician" value={fmt(elecRevenue)} />}
              <OutputRow label="Total Revenue" value={fmt(totalRevenue)} highlight />
            </div>

            {/* Cost breakdown */}
            <div style={{
              background: '#0f1d35',
              borderRadius: 10,
              padding: '4px 16px 4px',
              marginBottom: 16,
            }}>
              <p style={{ color: '#8a9bb5', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', margin: '14px 0 2px' }}>
                COST (CAD @ {fx.toFixed(2)})
              </p>
              <OutputRow label={`${isGlass ? 'Glass' : 'Film'} Cost ($${costPerSqm.toFixed(2)}/sqm)`} value={fmt(filmGlassCost)} />
              <OutputRow label="Transformer Cost" value={fmt(transformerCost)} />
              {inclElec && <OutputRow label="Electrician Pass-through" value={fmt(elecRevenue)} />}
              <OutputRow label="Total Cost" value={fmt(totalCost)} />
            </div>

            {/* Net profit */}
            <div style={{
              background: '#0f1d35',
              borderRadius: 10,
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <span style={{ color: COLORS.cream, fontSize: 15, fontWeight: 700 }}>Net Profit</span>
              <span style={{
                color: netProfit >= 0 ? '#22c55e' : '#ef4444',
                fontSize: 20,
                fontWeight: 800,
              }}>
                {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
              </span>
            </div>

            {/* Add to Quote */}
            <button
              onClick={() => addToast('Quote item added! Head to the Estimator to build a full quote.', 'success')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 9,
                border: 'none',
                background: COLORS.gold,
                color: '#0f1d35',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.target.style.opacity = '0.85'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              Add to Quote
            </button>
          </>
        )}
      </div>
    </div>
  )
}

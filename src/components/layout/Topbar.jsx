import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../theme/useTheme'
import { SunIcon, MoonIcon, PlusIcon } from '../ui/icons'

const TITLES = {
  '/': 'Home',
  '/pipeline': 'Pipeline',
  '/estimator': 'New Estimate',
  '/contacts': 'Contacts',
  '/invoices': 'Invoices',
  '/products': 'Product Catalog',
  '/settings': 'Settings',
}

export default function Topbar({ session }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { c, mode, pref, cycleMode } = useTheme()
  const title = TITLES[location.pathname] || 'LSG Hub'
  const isEstimator = location.pathname.startsWith('/estimator')

  const themeTitle = `Theme: ${pref} — click to cycle`

  return (
    <div style={{
      height:56, minHeight:56, background:c.surface,
      borderBottom:'1px solid '+c.border,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 28px', boxShadow:c.shadowSm,
      transition:'background-color 0.25s ease, border-color 0.25s ease',
    }}>
      <div style={{ fontFamily:c.font.heading, fontSize:19, fontWeight:c.weight.strong, color:c.textPrimary }}>{title}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span id="sync-indicator" style={{ fontSize:12, color:c.textMuted, transition:'color 0.2s' }} />

        {/* QuickCreate "+" — disabled placeholder; enabled in a later chunk */}
        <button
          disabled
          title="Quick create (coming soon)"
          style={{
            width:32, height:32, borderRadius:c.radius.md,
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            color:c.textMuted, cursor:'not-allowed', border:'1px solid '+c.border,
            background:'transparent', opacity:0.5,
          }}
        >
          <PlusIcon size={16} />
        </button>

        {/* Theme toggle: Sun (light) / Moon (dark) / Monitor (system) — cycles light→dark→system */}
        <button
          onClick={cycleMode}
          title={themeTitle}
          style={{
            width:32, height:32, borderRadius:c.radius.md,
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            color:c.textSecondary, cursor:'pointer', border:'1px solid '+c.border,
            background:'transparent', transition:'background-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background=c.surfaceHover; e.currentTarget.style.color=c.textPrimary }}
          onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=c.textSecondary }}
        >
          {mode === 'light' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>

        {!isEstimator && (
          <button
            onClick={() => navigate('/estimator')}
            style={{
              display:'flex', alignItems:'center', gap:6, padding:'9px 18px',
              background:c.accent, color:c.accentText, border:'none', borderRadius:c.radius.md,
              fontSize:13.5, fontWeight:c.weight.button, cursor:'pointer', fontFamily:c.font.body,
              transition:'background-color 0.15s',
            }}
            onMouseEnter={e=>e.currentTarget.style.background=c.accentHover}
            onMouseLeave={e=>e.currentTarget.style.background=c.accent}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Estimate
          </button>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../theme/useTheme'
import { SunIcon, MoonIcon, MonitorIcon, PlusIcon } from '../ui/icons'
import { IconButton } from '../ui/IconButton'
import { Button } from '../ui/Button'

const TITLES = {
  '/': 'Home',
  '/pipeline': 'Pipeline',
  '/estimator': 'New Estimate',
  '/estimates': 'All Estimates',
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

  // Subtle icon rotation on each cycle click
  const [rotated, setRotated] = useState(false)

  function handleThemeClick() {
    cycleMode()
    setRotated(r => !r)
  }

  const themeIcon = mode === 'light'
    ? <SunIcon size={16} />
    : pref === 'system'
      ? <MonitorIcon size={16} />
      : <MoonIcon size={16} />

  const themeLabel = `Theme: ${pref} (click to cycle)`

  function openCommandPalette() {
    window.dispatchEvent(new Event('lsg:open-command-palette'))
  }

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

        {/* Quick create "+" — opens ⌘K command palette */}
        <IconButton
          variant="ghost"
          label="Quick create (⌘K)"
          onClick={openCommandPalette}
        >
          <PlusIcon size={16} />
        </IconButton>

        {/* Theme toggle: Sun (light) / Monitor (system) / Moon (dark) — cycles light→dark→system */}
        <IconButton
          variant="ghost"
          label={themeLabel}
          onClick={handleThemeClick}
          style={{
            // 180° rotate on each click; respects reduced-motion globally via CSS
            transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'background-color .15s, color .15s, transform 0.3s',
          }}
        >
          {themeIcon}
        </IconButton>

        {!isEstimator && (
          <Button
            variant="primary"
            size="md"
            icon={<PlusIcon size={14} />}
            onClick={() => navigate('/estimator')}
          >
            New Estimate
          </Button>
        )}
      </div>
    </div>
  )
}

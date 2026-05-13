import { useTheme } from '../../theme/useTheme'
import { Badge } from './Badge'

export function Tabs({ tabs, active, onChange }) {
  const { c } = useTheme()

  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid ' + c.border,
      gap: 0,
    }}>
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              fontWeight: c.weight.button,
              fontSize: c.text.base,
              fontFamily: c.font.body,
              padding: '8px 14px',
              background: 'transparent',
              cursor: 'pointer',
              border: 'none',
              borderBottom: isActive ? '2px solid ' + c.accent : '2px solid transparent',
              color: isActive ? c.accent : c.textMuted,
              transition: 'color .15s, border-color .15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: -1,
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.color = c.textSecondary
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.color = c.textMuted
            }}
          >
            {tab.label}
            {tab.badge != null && (
              <Badge tone="accent">{tab.badge}</Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function SegmentedControl({ options, value, onChange, size = 'sm' }) {
  const { c } = useTheme()

  return (
    <div style={{
      background: c.surfaceHover,
      borderRadius: c.radius.pill,
      padding: 3,
      display: 'inline-flex',
      gap: 2,
    }}>
      {options.map((opt) => {
        const isSelected = opt.key === value
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              borderRadius: c.radius.pill,
              padding: size === 'sm' ? '4px 10px' : '6px 14px',
              fontWeight: c.weight.button,
              fontSize: size === 'sm' ? c.text.sm : c.text.base,
              fontFamily: c.font.body,
              background: isSelected ? c.surface : 'transparent',
              color: isSelected ? (opt.color || c.textPrimary) : c.textMuted,
              boxShadow: isSelected ? c.shadowSm : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color .15s, color .15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

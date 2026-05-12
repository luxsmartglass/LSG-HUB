import { useTheme } from '../../theme/useTheme'

const TONE_KEYS = {
  neutral: null,
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  highlight: 'highlight',
}

export function Badge({ tone = 'neutral', solid = false, children }) {
  const { c } = useTheme()

  let background, color

  if (solid) {
    if (tone === 'neutral') {
      background = c.surfaceElevated
      color = c.textPrimary
    } else {
      background = c[TONE_KEYS[tone]] || c.accent
      color = '#fff'
    }
  } else {
    // Soft (default)
    if (tone === 'neutral') {
      background = c.surfaceHover
      color = c.textSecondary
    } else {
      const key = TONE_KEYS[tone]
      background = c[key + 'Soft'] || c.surfaceHover
      color = c[key] || c.textSecondary
    }
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: c.text.xs,
      fontWeight: c.weight.label,
      padding: '2px 8px',
      borderRadius: c.radius.pill,
      lineHeight: 1.6,
      whiteSpace: 'nowrap',
      background,
      color,
    }}>
      {children}
    </span>
  )
}

export default Badge

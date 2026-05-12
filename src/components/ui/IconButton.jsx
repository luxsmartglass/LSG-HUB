import { useState } from 'react'
import { useTheme } from '../../theme/useTheme'

export function IconButton({
  label,
  size = 32,
  variant = 'ghost',
  children,
  style,
  ...rest
}) {
  const { c } = useTheme()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const background = (() => {
    if (variant === 'solid') return hovered ? c.accentHover : c.accent
    if (hovered) return c.surfaceHover
    return 'transparent'
  })()

  const color = hovered ? c.textPrimary : c.textSecondary

  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      style={{
        width: size,
        height: size,
        borderRadius: c.radius.md,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: variant === 'solid' ? '#fff' : color,
        cursor: 'pointer',
        border: variant === 'ghost' ? '1px solid ' + c.border : 'none',
        background,
        transition: 'background-color .15s, color .15s',
        boxShadow: focused ? '0 0 0 3px ' + c.accentSoft : 'none',
        outline: 'none',
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </button>
  )
}

export default IconButton

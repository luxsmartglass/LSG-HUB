import { useState } from 'react'
import { useTheme } from '../../theme/useTheme'
import { useIsMobile } from '../../hooks/useMediaQuery'

export function IconButton({
  label,
  size,
  variant = 'ghost',
  children,
  style,
  ...rest
}) {
  const { c } = useTheme()
  const isMobile = useIsMobile()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pressed, setPressed] = useState(false)

  // Effective size: callers passing nothing get 40 on mobile / 32 on desktop.
  // Explicit size props are respected but floored at 40 on mobile.
  const effectiveSize = Math.max(size ?? 32, isMobile ? 40 : 32)

  const background = (() => {
    if (variant === 'solid') return hovered ? c.accentHover : c.accent
    if (hovered) return c.surfaceHover
    return 'transparent'
  })()

  const color = hovered ? c.textPrimary : c.textSecondary

  const scaleTransform = pressed
    ? 'scale(0.92)'
    : hovered
    ? 'scale(1.08)'
    : 'scale(1)'

  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      style={{
        width: effectiveSize,
        height: effectiveSize,
        borderRadius: c.radius.md,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: variant === 'solid' ? '#fff' : color,
        cursor: 'pointer',
        border: variant === 'ghost' ? '1px solid ' + c.border : 'none',
        background,
        transition: 'background-color .15s, color .15s, transform .12s',
        transform: scaleTransform,
        boxShadow: focused ? '0 0 0 3px ' + c.accentSoft : 'none',
        outline: 'none',
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </button>
  )
}

export default IconButton

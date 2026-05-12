import { useState } from 'react'
import { useTheme } from '../../theme/useTheme'

function SpinRing({ trackColor }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 14,
      height: 14,
      border: '2px solid ' + trackColor,
      borderTopColor: 'currentColor',
      borderRadius: '50%',
      animation: 'spin .6s linear infinite',
      flexShrink: 0,
    }} />
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  as: Tag = 'button',
  disabled,
  children,
  style,
  onClick,
  ...rest
}) {
  const { c } = useTheme()
  const [pressed, setPressed] = useState(false)

  const isDisabled = disabled || loading

  const variantStyles = {
    primary: {
      background: c.accent,
      color: c.accentText,
      border: 'none',
    },
    secondary: {
      background: c.surfaceHover,
      color: c.textPrimary,
      border: '1px solid ' + c.border,
    },
    ghost: {
      background: 'transparent',
      color: c.textSecondary,
      border: '1px solid ' + c.border,
    },
    danger: {
      background: c.danger,
      color: '#fff',
      border: 'none',
    },
    subtle: {
      background: 'transparent',
      color: c.textSecondary,
      border: 'none',
    },
  }

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: c.text.sm },
    md: { padding: '9px 16px', fontSize: c.text.base },
    lg: { padding: '12px 22px', fontSize: c.text.md },
  }

  const vs = variantStyles[variant] || variantStyles.primary
  const ss = sizeStyles[size] || sizeStyles.md

  const computedStyle = {
    fontFamily: c.font.body,
    fontWeight: c.weight.button,
    borderRadius: c.radius.md,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background-color .15s, transform .08s, box-shadow .15s',
    opacity: isDisabled ? 0.6 : 1,
    transform: pressed && !isDisabled ? 'scale(0.97)' : 'scale(1)',
    width: fullWidth ? '100%' : undefined,
    textDecoration: 'none',
    lineHeight: 1,
    ...vs,
    ...ss,
    ...style,
  }

  function handleMouseDown(e) {
    if (!isDisabled) setPressed(true)
    rest.onMouseDown?.(e)
  }
  function handleMouseUp(e) {
    setPressed(false)
    rest.onMouseUp?.(e)
  }
  function handleMouseLeave(e) {
    setPressed(false)
    rest.onMouseLeave?.(e)
  }

  // Hover effect via JS for inline-style compatibility
  const [hovered, setHovered] = useState(false)
  const hoverOverrides = hovered && !isDisabled ? {
    primary: { background: c.accentHover },
    secondary: { background: c.surfaceHover },
    ghost: { background: c.surfaceHover },
    danger: {},
    subtle: { background: c.surfaceHover },
  }[variant] || {} : {}

  return (
    <Tag
      {...rest}
      disabled={Tag === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      style={{ ...computedStyle, ...hoverOverrides }}
      onClick={isDisabled ? undefined : onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={(e) => { handleMouseLeave(e); setHovered(false) }}
      onMouseEnter={() => setHovered(true)}
    >
      {loading ? <SpinRing trackColor={c.border} /> : icon}
      {children}
    </Tag>
  )
}

export default Button

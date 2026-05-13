import { forwardRef, useState } from 'react'
import { useTheme } from '../../theme/useTheme'

function useInputStyle(c, { error, focused } = {}) {
  return {
    width: '100%',
    background: c.mode === 'dark' ? 'rgba(255,255,255,0.06)' : c.bg,
    border: '1px solid ' + (error ? c.danger : focused ? c.accent : c.border),
    borderRadius: c.radius.md,
    padding: '9px 12px',
    color: c.textPrimary,
    fontSize: c.text.base,
    fontFamily: c.font.body,
    fontWeight: c.weight.body,
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
    boxShadow: focused ? '0 0 0 3px ' + c.accentSoft : 'none',
    boxSizing: 'border-box',
  }
}

export const Input = forwardRef(function Input({
  error,
  style,
  onFocus,
  onBlur,
  ...rest
}, ref) {
  const { c } = useTheme()
  const [focused, setFocused] = useState(false)

  return (
    <input
      ref={ref}
      style={{ ...useInputStyle(c, { error, focused }), ...style }}
      onFocus={(e) => { setFocused(true); onFocus?.(e) }}
      onBlur={(e) => { setFocused(false); onBlur?.(e) }}
      {...rest}
    />
  )
})

export function Textarea({ error, style, onFocus, onBlur, ...rest }) {
  const { c } = useTheme()
  const [focused, setFocused] = useState(false)

  return (
    <textarea
      style={{
        ...useInputStyle(c, { error, focused }),
        minHeight: 80,
        resize: 'vertical',
        ...style,
      }}
      onFocus={(e) => { setFocused(true); onFocus?.(e) }}
      onBlur={(e) => { setFocused(false); onBlur?.(e) }}
      {...rest}
    />
  )
}

export function Select({ error, style, onFocus, onBlur, children, ...rest }) {
  const { c } = useTheme()
  const [focused, setFocused] = useState(false)

  // Encode the chevron SVG as a data URI — use a fixed dark/light stroke matching textMuted
  const stroke = encodeURIComponent(c.textMuted)
  const chevronUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${stroke}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`

  return (
    <select
      style={{
        ...useInputStyle(c, { error, focused }),
        appearance: 'none',
        paddingRight: 32,
        backgroundImage: chevronUri,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        cursor: 'pointer',
        ...style,
      }}
      onFocus={(e) => { setFocused(true); onFocus?.(e) }}
      onBlur={(e) => { setFocused(false); onBlur?.(e) }}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Field({ label, hint, error, children }) {
  const { c } = useTheme()

  return (
    <label style={{ display: 'block' }}>
      {label && (
        <span style={{
          fontSize: c.text.xs,
          fontWeight: c.weight.label,
          color: c.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: 6,
        }}>
          {label}
        </span>
      )}
      {children}
      {error && (
        <span style={{
          display: 'block',
          marginTop: 4,
          fontSize: c.text.xs,
          color: c.danger,
        }}>
          {error}
        </span>
      )}
      {!error && hint && (
        <span style={{
          display: 'block',
          marginTop: 4,
          fontSize: c.text.xs,
          color: c.textMuted,
        }}>
          {hint}
        </span>
      )}
    </label>
  )
}

export default Input

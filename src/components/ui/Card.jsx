import { useState } from 'react'
import { useTheme } from '../../theme/useTheme'

export function Card({
  as: Tag = 'div',
  hover = false,
  pad = 20,
  header,
  interactive = false,
  style,
  onClick,
  children,
  ...rest
}) {
  const { c } = useTheme()
  const [lifted, setLifted] = useState(false)
  const [focused, setFocused] = useState(false)

  const baseStyle = {
    background: c.surface,
    border: '1px solid ' + c.border,
    borderRadius: c.radius.lg,
    boxShadow: interactive
      ? (focused ? '0 0 0 3px ' + c.accentSoft : (lifted && hover ? c.shadowMd : c.shadowSm))
      : (lifted && hover ? c.shadowMd : c.shadowSm),
    transform: lifted && hover ? 'translateY(-2px)' : 'translateY(0)',
    borderColor: lifted && hover ? c.borderStrong : c.border,
    transition: 'background-color .25s, border-color .25s, box-shadow .2s, transform .2s',
    cursor: interactive ? 'pointer' : undefined,
    outline: 'none',
    overflow: 'hidden',
  }

  const headerStyle = {
    padding: `${Math.round(pad * 0.7)}px ${pad}px`,
    borderBottom: '1px solid ' + c.border,
    background: c.surfaceHover,
  }

  const bodyStyle = {
    padding: pad,
  }

  function handleMouseEnter() {
    if (hover) setLifted(true)
  }
  function handleMouseLeave() {
    if (hover) setLifted(false)
  }

  return (
    <Tag
      {...rest}
      tabIndex={interactive ? 0 : undefined}
      style={{ ...baseStyle, ...style }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={interactive ? () => setFocused(true) : undefined}
      onBlur={interactive ? () => setFocused(false) : undefined}
    >
      {header && <div style={headerStyle}>{header}</div>}
      <div style={bodyStyle}>{children}</div>
    </Tag>
  )
}

export default Card

import { useState } from 'react'
import { useTheme } from '../../theme/useTheme'

const PLACEMENT_STYLES = {
  top: {
    bottom: 'calc(100% + 6px)',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  bottom: {
    top: 'calc(100% + 6px)',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  left: {
    right: 'calc(100% + 6px)',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  right: {
    left: 'calc(100% + 6px)',
    top: '50%',
    transform: 'translateY(-50%)',
  },
}

export function Tooltip({ label, placement = 'top', children }) {
  const { c } = useTheme()
  const [visible, setVisible] = useState(false)

  const placementStyle = PLACEMENT_STYLES[placement] || PLACEMENT_STYLES.top

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute',
          ...placementStyle,
          background: c.surfaceElevated,
          color: c.textPrimary,
          border: '1px solid ' + c.border,
          boxShadow: c.shadowMd,
          borderRadius: c.radius.sm,
          padding: '5px 9px',
          fontSize: c.text.xs,
          fontWeight: c.weight.body,
          fontFamily: c.font.body,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9600,
          animation: 'fadeIn .12s ease both',
        }}>
          {label}
        </span>
      )}
    </span>
  )
}

export default Tooltip

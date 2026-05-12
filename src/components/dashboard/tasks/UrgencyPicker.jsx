import { useTheme } from '../../../theme/useTheme'
import { SegmentedControl } from '../../ui/Tabs'

export function UrgencyDot({ urgency, size = 7 }) {
  const { c } = useTheme()
  const color = urgency === 'high' ? c.danger : urgency === 'medium' ? c.warning : c.textMuted
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }} />
  )
}

export function UrgencyPicker({ value, onChange, size = 'sm' }) {
  const { c } = useTheme()

  const options = [
    { key: 'low',    label: 'Low',  color: c.textMuted },
    { key: 'medium', label: 'Med',  color: c.warning   },
    { key: 'high',   label: 'High', color: c.danger    },
  ]

  return (
    <SegmentedControl
      options={options}
      value={value}
      onChange={onChange}
      size={size}
    />
  )
}

export default UrgencyPicker

import { useTheme } from '../../theme/useTheme'

export default function Spinner({ size = 18, color }) {
  const { c } = useTheme()
  const spinColor = color || c.accent
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid ' + c.border,
        borderTopColor: spinColor,
        animation: 'spin .6s linear infinite',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}

export default function Spinner({ size = 24, color = '#c9a84c' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}22`,
      borderTopColor: color,
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block'
    }} />
  )
}

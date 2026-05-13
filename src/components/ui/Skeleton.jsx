import { useTheme } from '../../theme/useTheme'

export function Skeleton({ w, h = 14, radius, style }) {
  const { c } = useTheme()

  const resolvedRadius = radius !== undefined ? radius : c.radius.sm

  const gradient = c.mode === 'dark'
    ? 'linear-gradient(90deg,#1c1828 25%,#26202f 50%,#1c1828 75%)'
    : 'linear-gradient(90deg,#ece9f2 25%,#f3f1f9 50%,#ece9f2 75%)'

  return (
    <div style={{
      width: w,
      height: h,
      borderRadius: resolvedRadius,
      background: gradient,
      backgroundSize: '400px 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  )
}

export default Skeleton

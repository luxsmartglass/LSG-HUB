import Spinner from './Spinner'
import { useTheme } from '../../theme/useTheme'

export default function LoadingScreen({ message = 'Loading...' }) {
  const { c } = useTheme()
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 16,
      background: 'transparent',
    }}>
      <Spinner size={36} />
      <p style={{
        color: c.textMuted,
        fontFamily: c.font.body,
        fontSize: c.text.base,
        margin: 0,
      }}>
        {message}
      </p>
    </div>
  )
}

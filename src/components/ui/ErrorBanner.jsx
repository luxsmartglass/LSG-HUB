import { useTheme } from '../../theme/useTheme'
import { Button } from './Button'

export default function ErrorBanner({ error, message, onRetry }) {
  const { c } = useTheme()
  // Support both `error` prop (standard) and legacy `message` prop used by EstimateList
  const err = error || message
  if (!err) return null
  const displayMsg = err?.message || String(err)
  return (
    <div style={{
      background: c.dangerSoft,
      border: '1px solid ' + c.danger,
      color: c.danger,
      borderRadius: c.radius.md,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      margin: '16px 0',
      fontFamily: c.font.body,
      fontSize: c.text.base,
    }}>
      <span>⚠️ {displayMsg}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

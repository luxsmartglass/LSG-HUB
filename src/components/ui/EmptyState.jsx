import { useTheme } from '../../theme/useTheme'
import { Button } from './Button'
import { ILLUSTRATIONS, EmptyGeneric } from './illustrations'

export default function EmptyState({
  // New props
  illustration = 'EmptyGeneric',
  title,
  message,
  action,
  onAction,
  compact = false,
  // Legacy prop — accepted but ignored (callers that still pass `icon` won't crash)
  // eslint-disable-next-line no-unused-vars
  icon,
}) {
  const { c } = useTheme()

  // Resolve illustration: string name → component, ReactNode passthrough
  let IllustrationNode
  if (typeof illustration === 'string') {
    const Comp = ILLUSTRATIONS[illustration] || EmptyGeneric
    IllustrationNode = <Comp />
  } else {
    IllustrationNode = illustration
  }

  return (
    <div style={{
      textAlign: 'center',
      padding: compact ? '32px 16px' : '56px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ marginBottom: 4 }}>
        {IllustrationNode}
      </div>
      {title && (
        <div style={{
          fontFamily: c.font.heading,
          fontSize: c.text.lg,
          color: c.textPrimary,
          fontWeight: c.weight.strong,
          lineHeight: c.leading.snug,
        }}>
          {title}
        </div>
      )}
      {message && (
        <div style={{
          fontSize: c.text.base,
          color: c.textMuted,
          lineHeight: c.leading.normal,
          maxWidth: 320,
        }}>
          {message}
        </div>
      )}
      {action && (
        <div style={{ marginTop: 4 }}>
          <Button variant="primary" size="sm" onClick={onAction}>
            {action}
          </Button>
        </div>
      )}
    </div>
  )
}

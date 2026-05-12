import { useEffect, useRef } from 'react'
import { useTheme } from '../../theme/useTheme'
import { XIcon } from './icons'

const SIZE_WIDTHS = {
  sm: 420,
  md: 560,
  lg: 820,
  full: 'min(1100px, 94vw)',
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}) {
  const { c } = useTheme()
  const panelRef = useRef(null)

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // ESC to close
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Focus panel on open
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus()
    }
  }, [open])

  if (!open) return null

  const width = SIZE_WIDTHS[size] || SIZE_WIDTHS.md
  const maxHeight = '92vh'

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: c.overlay,
        backdropFilter: 'blur(3px)',
        zIndex: 9500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn .2s ease both',
      }}
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{
          background: c.surface,
          border: '1px solid ' + c.border,
          borderRadius: c.radius.xl,
          boxShadow: c.shadowLg,
          width,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn .22s cubic-bezier(.22,1,.36,1) both',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid ' + c.border,
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: c.font.heading,
            fontWeight: c.weight.strong,
            fontSize: c.text.lg,
            color: c.textPrimary,
          }}>
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: c.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: c.radius.md,
              padding: 6,
              transition: 'background-color .15s, color .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = c.surfaceHover
              e.currentTarget.style.color = c.textPrimary
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = c.textMuted
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: 24,
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            borderTop: '1px solid ' + c.border,
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal

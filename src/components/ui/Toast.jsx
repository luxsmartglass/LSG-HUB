import { useState, createContext, useContext, useCallback } from 'react'
import { useTheme } from '../../theme/useTheme'

const ToastContext = createContext(null)

function ToastList({ toasts, dismiss }) {
  const { c } = useTheme()
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => {
        const isError = t.type === 'error'
        const isWarning = t.type === 'warning'
        const bg = isError ? c.danger : isWarning ? c.warning : c.surfaceElevated
        const color = isError || isWarning ? '#fff' : c.textPrimary
        const border = isError || isWarning ? 'none' : '1px solid ' + c.border
        return (
          <div
            key={t.id}
            style={{
              padding: t.action ? '10px 12px 10px 20px' : '12px 20px',
              borderRadius: c.radius.md,
              fontSize: c.text.sm,
              fontWeight: c.weight.body,
              fontFamily: c.font.body,
              background: bg,
              color,
              border,
              boxShadow: c.shadowMd,
              animation: 'fadeUp .25s ease both',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 240,
              maxWidth: 380,
            }}
          >
            <span style={{ flex: 1 }}>{t.msg}</span>
            {t.action && (
              <button
                onClick={() => { t.action.onClick(); dismiss(t.id) }}
                style={{
                  background: 'transparent',
                  border: isError || isWarning ? '1px solid rgba(255,255,255,0.3)' : '1px solid ' + c.border,
                  color: isError || isWarning ? '#fff' : c.textPrimary,
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: c.font.body,
                  fontSize: c.text.sm,
                  flexShrink: 0,
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const show = useCallback((msg, type = 'success', opts = {}) => {
    const id = Date.now()
    const action = opts.action || null
    const duration = opts.duration != null ? opts.duration : (action ? 6000 : 3000)
    setToasts(t => [...t, { id, msg, type, action }])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastList toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- intentional: co-export hook with provider (ToastProvider + useToast)
export function useToast() {
  return useContext(ToastContext)
}

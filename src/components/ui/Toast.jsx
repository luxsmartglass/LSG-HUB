import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:9000, display:'flex', flexDirection:'column', gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding:'12px 20px', borderRadius:8, fontSize:13.5, fontWeight:500,
            background: t.type === 'error' ? '#dc2626' : t.type === 'warning' ? '#d97706' : '#1c2b4a',
            color:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
            animation:'fadeUp 0.25s ease both', fontFamily:"'DM Sans',sans-serif"
          }}>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

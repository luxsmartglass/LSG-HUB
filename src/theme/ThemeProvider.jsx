import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { THEMES, resolveMode } from './tokens'

const KEY = 'lsg_theme'           // stored value: 'light' | 'dark' | 'system'
const ThemeContext = createContext(null)

function prefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
}
function readStored() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(() => readStored() || 'system')   // user preference
  const [mode, setMode] = useState(() => resolveMode(readStored(), prefersDark()))

  // keep `mode` in sync when pref changes or when OS theme changes (only while pref === 'system')
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync derived mode from pref+OS preference
    setMode(resolveMode(pref === 'system' ? null : pref, prefersDark()))
    if (pref !== 'system' || typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setMode(prefersDark() ? 'dark' : 'light')
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [pref])

  // persist + reflect on <html data-theme> for global CSS (scrollbars, body bg)
  useEffect(() => {
    try { localStorage.setItem(KEY, pref) } catch { /* ignore */ }
  }, [pref])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const setPreference = useCallback((p) => setPref(p), [])           // 'light'|'dark'|'system'
  const cycleMode = useCallback(() => {
    setPref(p => (p === 'light' ? 'dark' : p === 'dark' ? 'system' : 'light'))
  }, [])

  const value = { mode, pref, c: THEMES[mode], setPreference, cycleMode }
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- intentional: co-export hook with provider for ergonomic import
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}

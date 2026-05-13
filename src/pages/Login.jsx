import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../theme/useTheme'

export default function Login() {
  const { c } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://opxmhebabfuqktiftcdn.supabase.co/auth/v1/callback',
        queryParams: { hd: 'luxsmartglass.ca' }
      }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: c.gradientHero,
      fontFamily: c.font.body,
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: `${c.accent}10`, filter: 'blur(60px)', top: -80, right: -80, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: `${c.highlight}0a`, filter: 'blur(60px)', bottom: -60, left: -60, pointerEvents: 'none' }} />

      <div style={{
        background: c.surface,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${c.accent}33`,
        borderRadius: c.radius.xl,
        padding: '48px 52px', maxWidth: 420, width: '90%',
        boxShadow: c.shadowLg,
        animation: 'scaleIn 0.4s ease both', textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ fontFamily: c.font.heading, fontSize: 56, fontWeight: c.weight.hero, color: c.accent, letterSpacing: 8, marginBottom: 4 }}>LSG</div>
        <div style={{ width: 60, height: 1, background: `linear-gradient(90deg,transparent,${c.accent},transparent)`, margin: '12px auto 14px' }} />
        <div style={{ fontFamily: c.font.heading, fontSize: 16, letterSpacing: 5, textTransform: 'uppercase', color: `${c.textPrimary}cc`, marginBottom: 6 }}>Lux Smart Glass</div>
        <div style={{ fontSize: 11.5, letterSpacing: 2.5, textTransform: 'uppercase', color: c.textMuted, marginBottom: 40 }}>Internal Hub</div>

        {error && (
          <div style={{ background: c.dangerSoft, border: `1px solid ${c.danger}55`, borderRadius: c.radius.md, padding: '12px 16px', marginBottom: 20, color: c.danger, fontSize: c.text.sm }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 20px', border: `1px solid ${c.accent}66`,
            borderRadius: c.radius.lg, background: c.accentSoft, color: c.textPrimary,
            fontSize: c.text.base, fontWeight: c.weight.strong, cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s', fontFamily: c.font.body,
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = c.accentSoft; e.currentTarget.style.borderColor = `${c.accent}aa` }}
          onMouseLeave={e => { e.currentTarget.style.background = c.accentSoft; e.currentTarget.style.borderColor = `${c.accent}66` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <div style={{ marginTop: 24, fontSize: 11.5, color: c.textMuted, lineHeight: 1.7 }}>
          Access restricted to<br />Lux Smart Glass team members
        </div>
      </div>
    </div>
  )
}

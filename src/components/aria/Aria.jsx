import { useTheme } from '../../theme/useTheme'
import { useIsMobile } from '../../hooks/useMediaQuery'
import AriaChat from './AriaChat'

export default function Aria() {
  const { c } = useTheme()
  const isMobile = useIsMobile()

  return (
    <div className="fade-up" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: c.bg,
      padding: isMobile ? '16px 12px' : '32px 24px',
      fontFamily: c.font.body,
      boxSizing: 'border-box',
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: c.radius.md,
            background: `linear-gradient(135deg, ${c.surface} 0%, ${c.surfaceElevated} 100%)`,
            border: `1px solid ${c.accent}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}>
            ✦
          </div>
          <div>
            <h1 style={{ color: c.textPrimary, fontSize: c.text['2xl'], fontWeight: c.weight.hero, margin: 0, letterSpacing: '-0.01em', fontFamily: c.font.heading }}>
              ARIA
            </h1>
            <p style={{ color: c.textMuted, fontSize: c.text.sm, margin: 0 }}>
              AI Revenue Intelligence Assistant
            </p>
          </div>
        </div>

        {/* Info bar */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: c.surface,
          border: `1px solid ${c.accent}33`,
          borderRadius: c.radius.pill,
          padding: '5px 14px',
          marginTop: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent, display: 'inline-block' }} />
          <span style={{ color: c.textMuted, fontSize: c.text.xs }}>
            ARIA has context about your pipeline, estimates, and business metrics
          </span>
        </div>
      </div>

      {/* Chat — fills remaining space */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AriaChat />
      </div>
    </div>
  )
}

import AriaChat from './AriaChat'

const COLORS = {
  navy: '#1c2b4a',
  gold: '#c9a84c',
  cream: '#f4f1eb',
  bg: '#0f1d35',
}

export default function Aria() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: COLORS.bg,
      padding: '32px 24px',
      fontFamily: "'DM Sans', sans-serif",
      boxSizing: 'border-box',
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${COLORS.navy} 0%, #2a3f6b 100%)`,
            border: `1px solid ${COLORS.gold}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}>
            ✦
          </div>
          <div>
            <h1 style={{ color: COLORS.cream, fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              ARIA
            </h1>
            <p style={{ color: '#8a9bb5', fontSize: 13, margin: 0 }}>
              AI Revenue Intelligence Assistant
            </p>
          </div>
        </div>

        {/* Info bar */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: COLORS.navy,
          border: `1px solid ${COLORS.gold}33`,
          borderRadius: 20,
          padding: '5px 14px',
          marginTop: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.gold, display: 'inline-block' }} />
          <span style={{ color: '#8a9bb5', fontSize: 12 }}>
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

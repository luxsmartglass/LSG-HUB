import { useTheme } from '../../theme/useTheme'

export default function StripeSettings() {
  const { c } = useTheme()

  return (
    <div style={{
      background: c.surface,
      borderRadius: c.radius.lg,
      padding: 24,
      border: `1px solid ${c.border}`,
      boxShadow: c.shadowSm,
      opacity: 0.75,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {/* Stripe wordmark placeholder */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: c.radius.md,
          background: 'rgba(99,91,255,0.12)',
          border: '1px solid rgba(99,91,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.929 3.477 1.674 3.477 2.705 0 1.023-.84 1.609-2.332 1.609-1.932 0-4.638-.916-6.526-2.101l-.96 5.766C5.535 23.342 8.408 24 11.52 24c2.637 0 4.822-.613 6.286-1.787 1.617-1.297 2.448-3.233 2.448-5.544 0-4.139-2.531-5.843-6.278-7.52z"
              fill="#635bff"
            />
          </svg>
        </div>
        <div>
          <h3 style={{ color: c.textPrimary, fontSize: c.text.md, fontWeight: c.weight.strong, margin: 0 }}>
            Stripe Payments
          </h3>
          <p style={{ color: c.textMuted, fontSize: c.text.sm, margin: '2px 0 0' }}>
            Accept payments and deposits via credit card
          </p>
        </div>
      </div>

      <div style={{
        background: c.surfaceHover,
        borderRadius: c.radius.md,
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(99,91,255,0.10)',
          border: '1px solid rgba(99,91,255,0.25)',
          borderRadius: c.radius.pill,
          padding: '5px 14px',
          marginBottom: 12,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.warning, display: 'inline-block' }} />
          <span style={{ color: '#635bff', fontSize: c.text.sm, fontWeight: c.weight.strong }}>Coming Soon</span>
        </div>
        <p style={{ color: c.textMuted, fontSize: c.text.sm, margin: 0, lineHeight: c.leading.normal }}>
          Stripe payments integration coming soon. You'll be able to collect deposits and full payments directly from estimates and invoices.
        </p>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useToast } from '../ui/Toast'
import { useTheme } from '../../theme/useTheme'
import { Button } from '../ui/Button'
import { sendEmail } from '../../lib/gmailApi'

function loadGIS() {
  return new Promise(resolve => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    document.head.appendChild(s)
  })
}

export default function GmailSettings() {
  const { c } = useTheme()
  const addToast = useToast()

  const [token, setToken] = useState(null)
  const [email, setEmail] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tokenClient, setTokenClient] = useState(null)

  // Restore token from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('lsg_gmail_tokens') || 'null')
      if (stored?.access_token && Date.now() < stored.expires_at - 30000) {
        setToken(stored.access_token)
        setEmail(stored.email || 'Connected Account')
      }
    } catch {
      // ignore
    }
  }, [])

  async function handleConnect() {
    setConnecting(true)
    try {
      await loadGIS()
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GMAIL_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
        callback: async (resp) => {
          if (resp.error) {
            addToast('Gmail connection failed: ' + resp.error, 'error')
            setConnecting(false)
            return
          }
          const accessToken = resp.access_token
          // Fetch user email
          let userEmail = 'Connected Account'
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            const data = await res.json()
            if (data.email) userEmail = data.email
          } catch {
            // ignore, use fallback
          }
          const tokens = {
            access_token: accessToken,
            expires_at: Date.now() + resp.expires_in * 1000,
            scope: resp.scope,
            email: userEmail,
          }
          localStorage.setItem('lsg_gmail_tokens', JSON.stringify(tokens))
          setToken(accessToken)
          setEmail(userEmail)
          addToast(`Gmail connected: ${userEmail}`, 'success')
          setConnecting(false)
        },
      })
      setTokenClient(client)
      client.requestAccessToken()
    } catch (err) {
      addToast('Failed to load Google Identity Services', 'error')
      setConnecting(false)
    }
  }

  function handleDisconnect() {
    const stored = JSON.parse(localStorage.getItem('lsg_gmail_tokens') || 'null')
    if (stored?.access_token) {
      window.google?.accounts?.oauth2?.revoke(stored.access_token, () => {})
    }
    localStorage.removeItem('lsg_gmail_tokens')
    setToken(null)
    setEmail(null)
    setTokenClient(null)
    addToast('Gmail disconnected', 'success')
  }

  async function handleTestEmail() {
    if (!email) return
    setTesting(true)
    try {
      await sendEmail({
        to: email,
        subject: 'LSG Hub — Gmail Connection Test',
        body: 'Your Gmail integration is working correctly. This is a test email from LSG Hub.',
      })
      addToast('Test email sent successfully!', 'success')
    } catch (err) {
      addToast('Failed to send test email: ' + err.message, 'error')
    } finally {
      setTesting(false)
    }
  }

  const isConnected = !!token

  return (
    <div style={{
      background: c.surface,
      borderRadius: c.radius.lg,
      padding: 24,
      border: `1px solid ${c.border}`,
      boxShadow: c.shadowSm,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: c.radius.md,
          background: c.accentSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}>
          ✉️
        </div>
        <div>
          <h3 style={{ color: c.textPrimary, fontSize: c.text.md, fontWeight: c.weight.strong, margin: 0 }}>
            Gmail Integration
          </h3>
          <p style={{ color: c.textMuted, fontSize: c.text.sm, margin: '2px 0 0' }}>
            Connect your Gmail to send estimates, invoices, and follow-ups
          </p>
        </div>
      </div>

      {/* Status */}
      <div style={{
        background: c.surfaceHover,
        borderRadius: c.radius.md,
        padding: '14px 16px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: isConnected ? c.success : c.textMuted,
            flexShrink: 0,
          }} />
          <div>
            <p style={{ color: isConnected ? c.success : c.textMuted, fontSize: c.text.sm, fontWeight: c.weight.strong, margin: 0 }}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </p>
            {isConnected && email && (
              <p style={{ color: c.textMuted, fontSize: c.text.xs, margin: '2px 0 0' }}>{email}</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {isConnected ? (
            <>
              <Button variant="ghost" size="sm" loading={testing} onClick={handleTestEmail}>
                {testing ? 'Sending…' : 'Test Email'}
              </Button>
              <button
                onClick={handleDisconnect}
                style={{
                  padding: '7px 16px',
                  borderRadius: c.radius.sm,
                  border: `1px solid ${c.danger}55`,
                  background: 'transparent',
                  color: c.danger,
                  fontSize: c.text.sm,
                  fontWeight: c.weight.strong,
                  cursor: 'pointer',
                  fontFamily: c.font.body,
                }}
              >
                Disconnect
              </button>
            </>
          ) : (
            <Button variant="primary" loading={connecting} onClick={handleConnect}>
              {connecting ? 'Connecting…' : 'Connect Gmail'}
            </Button>
          )}
        </div>
      </div>

      {/* Info box */}
      <div style={{
        border: `1px solid ${c.border}`,
        borderRadius: c.radius.sm,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>🔒</span>
        <p style={{ color: c.textMuted, fontSize: c.text.sm, margin: 0, lineHeight: c.leading.normal }}>
          Your Gmail credentials are never stored on our servers. The OAuth token is kept in browser memory only and is used solely to send emails on your behalf.
        </p>
      </div>
    </div>
  )
}

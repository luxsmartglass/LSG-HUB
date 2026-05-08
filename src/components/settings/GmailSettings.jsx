import { useState, useEffect } from 'react'
import { useToast } from '../ui/Toast'
import { sendEmail } from '../../lib/gmailApi'

const COLORS = {
  navy: '#1c2b4a',
  gold: '#c9a84c',
  cream: '#f4f1eb',
  bg: '#0f1d35',
  cardBg: '#162236',
}

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
      background: COLORS.cardBg,
      borderRadius: 14,
      padding: 24,
      border: '1px solid #1e3352',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: '#1a2f50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}>
          ✉️
        </div>
        <div>
          <h3 style={{ color: COLORS.cream, fontSize: 15, fontWeight: 700, margin: 0 }}>
            Gmail Integration
          </h3>
          <p style={{ color: '#8a9bb5', fontSize: 12.5, margin: '2px 0 0' }}>
            Connect your Gmail to send estimates, invoices, and follow-ups
          </p>
        </div>
      </div>

      {/* Status */}
      <div style={{
        background: '#0f1d35',
        borderRadius: 10,
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
            background: isConnected ? '#22c55e' : '#637a96',
            flexShrink: 0,
          }} />
          <div>
            <p style={{ color: isConnected ? '#22c55e' : '#8a9bb5', fontSize: 13.5, fontWeight: 600, margin: 0 }}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </p>
            {isConnected && email && (
              <p style={{ color: '#8a9bb5', fontSize: 12, margin: '2px 0 0' }}>{email}</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {isConnected ? (
            <>
              <button
                onClick={handleTestEmail}
                disabled={testing}
                style={{
                  padding: '7px 16px',
                  borderRadius: 7,
                  border: `1px solid #1e3352`,
                  background: 'transparent',
                  color: COLORS.cream,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: testing ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: testing ? 0.6 : 1,
                }}
              >
                {testing ? 'Sending…' : 'Test Email'}
              </button>
              <button
                onClick={handleDisconnect}
                style={{
                  padding: '7px 16px',
                  borderRadius: 7,
                  border: '1px solid #ef444455',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                border: 'none',
                background: COLORS.gold,
                color: '#0f1d35',
                fontSize: 13,
                fontWeight: 700,
                cursor: connecting ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: connecting ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {connecting ? 'Connecting…' : 'Connect Gmail'}
            </button>
          )}
        </div>
      </div>

      {/* Info box */}
      <div style={{
        background: '#0f1d2200',
        border: '1px solid #1e3352',
        borderRadius: 9,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>🔒</span>
        <p style={{ color: '#8a9bb5', fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>
          Your Gmail credentials are never stored on our servers. The OAuth token is kept in browser memory only and is used solely to send emails on your behalf.
        </p>
      </div>
    </div>
  )
}

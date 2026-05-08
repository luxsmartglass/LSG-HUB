const CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID;
const SCOPE = 'https://mail.google.com/';

let tokenClient = null;

export function getStoredTokens() {
  try { return JSON.parse(localStorage.getItem('lsg_gmail_tokens') || 'null'); } catch { return null; }
}

export function isGmailConnected() {
  const t = getStoredTokens();
  return t && t.access_token && Date.now() < t.expires_at - 30000;
}

export function connectGmail(callback) {
  if (typeof google === 'undefined') {
    console.error('Google Identity Services not loaded');
    return;
  }
  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) { callback?.({ error: resp.error }); return; }
        const tokens = { access_token: resp.access_token, expires_at: Date.now() + resp.expires_in * 1000, scope: resp.scope };
        localStorage.setItem('lsg_gmail_tokens', JSON.stringify(tokens));
        callback?.({ success: true, tokens });
      },
    });
  }
  tokenClient.requestAccessToken();
}

export function disconnectGmail() {
  const t = getStoredTokens();
  if (t?.access_token) window.google?.accounts?.oauth2?.revoke(t.access_token, () => {});
  localStorage.removeItem('lsg_gmail_tokens');
}

export async function getAccessToken() {
  if (isGmailConnected()) return getStoredTokens().access_token;
  return new Promise(resolve => {
    if (!tokenClient) {
      tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPE,
        callback: (resp) => {
          if (!resp.error) {
            localStorage.setItem('lsg_gmail_tokens', JSON.stringify({ access_token: resp.access_token, expires_at: Date.now() + resp.expires_in * 1000 }));
            resolve(resp.access_token);
          } else resolve(null);
        },
      });
    }
    tokenClient?.requestAccessToken({ prompt: '' });
  });
}

export async function sendEmail({ to, subject, body }) {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail not connected');
  const mime = [`From: Lux Smart Glass <info@luxsmartglass.ca>`, `To: ${to}`, `Subject: ${subject}`, `MIME-Version: 1.0`, `Content-Type: text/plain; charset=UTF-8`, ``, body].join('\r\n');
  const encoded = btoa(unescape(encodeURIComponent(mime))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!resp.ok) { const err = await resp.json(); throw new Error(err.error?.message || resp.statusText); }
  return await resp.json();
}

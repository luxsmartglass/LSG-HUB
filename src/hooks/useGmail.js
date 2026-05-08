import { useState, useEffect } from 'react';
import { isGmailConnected, connectGmail, disconnectGmail, sendEmail } from '../lib/gmailApi';

export function useGmail() {
  const [connected, setConnected] = useState(isGmailConnected());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setConnected(isGmailConnected()), 30000);
    return () => clearInterval(interval);
  }, []);

  function connect() {
    connectGmail(({ success, error: err }) => {
      if (success) setConnected(true);
      else setError(err);
    });
  }

  function disconnect() {
    disconnectGmail();
    setConnected(false);
  }

  async function send(emailData) {
    setSending(true);
    setError(null);
    try {
      const result = await sendEmail(emailData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSending(false);
    }
  }

  return { connected, connect, disconnect, send, sending, error };
}

export default useGmail;

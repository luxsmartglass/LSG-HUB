import { useState, useEffect, useRef } from 'react'

const COLORS = {
  navy: '#1c2b4a',
  gold: '#c9a84c',
  cream: '#f4f1eb',
  bg: '#0f1d35',
  cardBg: '#162236',
}

const GREETING = "👋 Hi! I'm ARIA — your AI Revenue Intelligence Assistant for Lux Smart Glass. I can help you analyze your pipeline, forecast revenue, and surface opportunities. What would you like to know?"

function getAriaResponse(text) {
  const lower = text.toLowerCase()
  if (/pipeline|deal/.test(lower)) {
    return "I can see your pipeline has deals across multiple stages. Your highest-value stage appears to be Contract Signed. Would you like me to identify follow-up opportunities?"
  }
  if (/revenue|money|sales/.test(lower)) {
    return "Based on your current pipeline, your projected close value for this month is approximately $X. I recommend focusing on the Negotiating stage where deals are most likely to convert."
  }
  if (/estimate|quote/.test(lower)) {
    return "I can help you build an estimate. Head to the Estimator section and I'll be here if you need margin guidance."
  }
  if (/install|scheduled/.test(lower)) {
    return "You have deals in the Install Scheduled stage. Make sure to confirm site visits at least 48 hours in advance."
  }
  return "I'm analyzing your business data. Ask me about your pipeline, revenue projections, or specific deals and I'll provide insights."
}

function TypingDots() {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 4), 400)
    return () => clearInterval(id)
  }, [])
  const dots = '.'.repeat(frame)
  return (
    <span style={{ letterSpacing: 2, color: '#8a9bb5', fontSize: 14 }}>
      ARIA is thinking{dots}
    </span>
  )
}

function AriaBubble({ text, isTyping }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, maxWidth: '72%' }}>
      <span style={{
        color: COLORS.gold,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.08em',
        paddingLeft: 2,
      }}>
        ARIA
      </span>
      <div style={{
        background: COLORS.navy,
        color: '#e2e8f0',
        padding: '11px 15px',
        borderRadius: '4px 14px 14px 14px',
        fontSize: 13.5,
        lineHeight: 1.6,
        border: '1px solid #1e3352',
      }}>
        {isTyping ? <TypingDots /> : text}
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        background: COLORS.gold,
        color: '#0f1d35',
        padding: '11px 15px',
        borderRadius: '14px 4px 14px 14px',
        fontSize: 13.5,
        fontWeight: 500,
        lineHeight: 1.6,
        maxWidth: '72%',
      }}>
        {text}
      </div>
    </div>
  )
}

export default function AriaChat() {
  const [messages, setMessages] = useState([
    { id: 0, role: 'aria', text: GREETING },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  function handleSend() {
    const text = input.trim()
    if (!text || thinking) return

    const userMsg = { id: Date.now(), role: 'user', text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setThinking(true)

    setTimeout(() => {
      const response = getAriaResponse(text)
      setThinking(false)
      setMessages(m => [...m, { id: Date.now() + 1, role: 'aria', text: response }])
    }, 800)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      background: COLORS.cardBg,
      borderRadius: 14,
      border: '1px solid #1e3352',
      overflow: 'hidden',
    }}>
      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        scrollbarWidth: 'thin',
        scrollbarColor: '#1e3352 transparent',
      }}>
        {messages.map(msg =>
          msg.role === 'user'
            ? <UserBubble key={msg.id} text={msg.text} />
            : <AriaBubble key={msg.id} text={msg.text} />
        )}
        {thinking && (
          <AriaBubble isTyping />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        borderTop: '1px solid #1e3352',
        padding: '14px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        background: '#0f1d35',
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="Ask ARIA about your pipeline, revenue, or estimates…"
          disabled={thinking}
          style={{
            flex: 1,
            background: COLORS.cardBg,
            border: `1px solid ${inputFocused ? COLORS.gold : '#1e3352'}`,
            borderRadius: 9,
            color: COLORS.cream,
            fontSize: 13.5,
            padding: '10px 14px',
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'border-color 0.15s',
            opacity: thinking ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || thinking}
          style={{
            width: 40,
            height: 40,
            borderRadius: 9,
            border: 'none',
            background: input.trim() && !thinking ? COLORS.gold : '#1e3352',
            color: input.trim() && !thinking ? '#0f1d35' : '#637a96',
            cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s, color 0.15s',
          }}
          aria-label="Send"
        >
          ➤
        </button>
      </div>
    </div>
  )
}

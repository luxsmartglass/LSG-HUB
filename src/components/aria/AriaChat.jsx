import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../theme/useTheme'

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

function TypingDots({ c }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 4), 400)
    return () => clearInterval(id)
  }, [])
  const dots = '.'.repeat(frame)
  return (
    <span style={{ letterSpacing: 2, color: c.textMuted, fontSize: c.text.base }}>
      ARIA is thinking{dots}
    </span>
  )
}

function AriaBubble({ text, isTyping, c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, maxWidth: '72%' }}>
      <span style={{
        color: c.accent,
        fontSize: c.text.xs,
        fontWeight: c.weight.label,
        letterSpacing: '0.08em',
        paddingLeft: 2,
      }}>
        ARIA
      </span>
      <div style={{
        background: c.surface,
        color: c.textPrimary,
        padding: '11px 15px',
        borderRadius: `${c.radius.sm}px ${c.radius.lg}px ${c.radius.lg}px ${c.radius.lg}px`,
        fontSize: c.text.sm,
        lineHeight: c.leading.normal,
        border: `1px solid ${c.border}`,
      }}>
        {isTyping ? <TypingDots c={c} /> : text}
      </div>
    </div>
  )
}

function UserBubble({ text, c }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        background: c.accent,
        color: c.accentText,
        padding: '11px 15px',
        borderRadius: `${c.radius.lg}px ${c.radius.sm}px ${c.radius.lg}px ${c.radius.lg}px`,
        fontSize: c.text.sm,
        fontWeight: c.weight.body,
        lineHeight: c.leading.normal,
        maxWidth: '72%',
      }}>
        {text}
      </div>
    </div>
  )
}

export default function AriaChat() {
  const { c } = useTheme()
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
      background: c.surface,
      borderRadius: c.radius.lg,
      border: `1px solid ${c.border}`,
      overflow: 'hidden',
      boxShadow: c.shadowMd,
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
        scrollbarColor: `${c.border} transparent`,
      }}>
        {messages.map(msg =>
          msg.role === 'user'
            ? <UserBubble key={msg.id} text={msg.text} c={c} />
            : <AriaBubble key={msg.id} text={msg.text} c={c} />
        )}
        {thinking && (
          <AriaBubble isTyping c={c} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        borderTop: `1px solid ${c.border}`,
        padding: '14px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        background: c.surfaceHover,
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
            background: c.surface,
            border: `1px solid ${inputFocused ? c.accent : c.border}`,
            borderRadius: c.radius.md,
            color: c.textPrimary,
            fontSize: c.text.sm,
            padding: '10px 14px',
            outline: 'none',
            fontFamily: c.font.body,
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
            borderRadius: c.radius.md,
            border: 'none',
            background: input.trim() && !thinking ? c.accent : c.surfaceHover,
            color: input.trim() && !thinking ? c.accentText : c.textMuted,
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

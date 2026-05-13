import { useRef, useState, useEffect } from 'react'
import { useTheme } from '../theme/useTheme'

export default function Splash({ onComplete }) {
  const { c } = useTheme()
  const [tapped, setTapped] = useState(false)
  const [irisOpen, setIrisOpen] = useState(false)
  const [done, setDone] = useState(false)
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const dismissedRef = useRef(false)

  function triggerIris() {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setIrisOpen(true)
  }

  function handleDone() {
    setDone(true)
    onComplete()
  }

  const handleTap = () => {
    if (tapped) return
    setTapped(true)

    const vid = videoRef.current
    const aud = audioRef.current

    if (vid) {
      vid.play().catch(() => {
        setTimeout(() => {
          if (!dismissedRef.current) {
            dismissedRef.current = true
            handleDone()
          }
        }, 500)
      })

      vid.addEventListener('timeupdate', () => {
        if (vid.duration > 1 && vid.currentTime > 0 && vid.currentTime >= vid.duration - 1.0) {
          triggerIris()
        }
      })

      vid.addEventListener('ended', () => {
        triggerIris()
      }, { once: true })

      vid.addEventListener('error', () => {
        setTimeout(() => {
          if (!dismissedRef.current) {
            dismissedRef.current = true
            handleDone()
          }
        }, 500)
      }, { once: true })
    } else {
      setTimeout(() => handleDone(), 500)
    }

    if (aud) {
      setTimeout(() => {
        aud.play().catch(() => {})
      }, 1000)
    }
  }

  useEffect(() => {
    if (!irisOpen) return
    const timer = setTimeout(() => {
      handleDone()
    }, 1500)
    return () => clearTimeout(timer)
  }, [irisOpen])

  if (done) return null

  return (
    <>
      <style>{`
        @keyframes tapPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes textFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineDraw {
          from { width: 0; opacity: 0; }
          to   { width: 48px; opacity: 1; }
        }
      `}</style>

      {/* Video — always in DOM for preloading; invisible until tapped */}
      <video
        ref={videoRef}
        src="/intro.mp4"
        preload="auto"
        playsInline
        muted
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 10,
          pointerEvents: 'none',
          opacity: tapped ? 1 : 0,
          transition: 'opacity 0.4s',
        }}
      />

      {/* Text overlay — appears over video while playing */}
      {tapped && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 11,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {/* LSG wordmark */}
          <div
            style={{
              fontFamily: c.font.heading,
              fontSize: 'clamp(52px, 10vw, 88px)',
              fontWeight: c.weight.hero,
              color: c.accent,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              textShadow: `0 0 60px ${c.accent}5a, 0 2px 30px rgba(0,0,0,0.7)`,
              animation: 'textFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s both',
            }}
          >
            LSG
          </div>

          {/* Divider line */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`,
              animation: 'lineDraw 0.7s ease-out 0.8s both',
              alignSelf: 'center',
            }}
          />

          {/* Full name */}
          <div
            style={{
              fontFamily: c.font.body,
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 400,
              color: `${c.textPrimary}cc`,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              textShadow: '0 1px 20px rgba(0,0,0,0.9)',
              animation: 'textFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.55s both',
            }}
          >
            Lux Smart Glass
          </div>

          {/* Tagline */}
          <div
            style={{
              fontFamily: c.font.body,
              fontSize: 'clamp(9px, 1.2vw, 11px)',
              fontWeight: 500,
              color: `${c.accent}8c`,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              marginTop: 4,
              animation: 'textFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.85s both',
            }}
          >
            Excellence in Every Detail
          </div>
        </div>
      )}

      {/* Iris circle — grows from centre outward at end of video */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 12,
          background: c.bg,
          clipPath: irisOpen ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)',
          transition: irisOpen ? 'clip-path 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Audio */}
      <audio ref={audioRef} src="/intro.mp3" preload="auto" />

      {/* Tap gate */}
      {!tapped && (
        <div
          onClick={handleTap}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20,
            background: c.bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            gap: 20,
          }}
        >
          <div
            style={{
              fontFamily: c.font.heading,
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: c.weight.hero,
              color: c.accent,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            LSG
          </div>
          <div
            style={{
              fontFamily: c.font.body,
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontWeight: 500,
              color: c.textMuted,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginTop: -12,
            }}
          >
            Lux Smart Glass
          </div>
          <span
            style={{
              fontFamily: c.font.body,
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 400,
              color: `${c.accent}b3`,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              animation: 'tapPulse 2s ease-in-out infinite',
              userSelect: 'none',
              marginTop: 24,
            }}
          >
            Tap to Enter
          </span>
        </div>
      )}
    </>
  )
}

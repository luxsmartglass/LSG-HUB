import { useRef, useState, useEffect } from 'react'

export default function Splash({ onComplete }) {
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
        // Video failed to play — skip intro after 500ms
        setTimeout(() => {
          if (!dismissedRef.current) {
            dismissedRef.current = true
            handleDone()
          }
        }, 500)
      })

      vid.addEventListener('timeupdate', () => {
        if (vid.duration && vid.currentTime >= vid.duration - 1.0) {
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
      // No video element — skip after 500ms
      setTimeout(() => handleDone(), 500)
    }

    if (aud) {
      setTimeout(() => {
        aud.play().catch(() => {})
      }, 1000)
    }
  }

  // When iris finishes (1.2s transition), clean up and call onComplete
  useEffect(() => {
    if (!irisOpen) return
    const timer = setTimeout(() => {
      handleDone()
    }, 1200)
    return () => clearTimeout(timer)
  }, [irisOpen])

  if (done) return null

  return (
    <>
      {/* Iris wrapper — children (app) rendered behind video, revealed by iris animation */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 5,
          clipPath: irisOpen ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)',
          transition: irisOpen ? 'clip-path 1.2s ease-in-out' : 'none',
          background: 'transparent',
          pointerEvents: 'none',
        }}
      />

      {/* Video — fullscreen cover, z-index 10, shown after tap */}
      {tapped && (
        <video
          ref={videoRef}
          src="/intro.mp4"
          playsInline
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Audio — not tied to video end */}
      <audio ref={audioRef} src="/intro.mp3" preload="auto" />

      {/* Tap gate — shown until tapped */}
      {!tapped && (
        <div
          onClick={handleTap}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20,
            background: '#0f1d35',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <style>{`
            @keyframes tapPulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.35; }
            }
          `}</style>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 48,
              color: '#c9a84c',
              letterSpacing: 8,
              textTransform: 'uppercase',
              animation: 'tapPulse 2s ease-in-out infinite',
              userSelect: 'none',
            }}
          >
            TAP TO ENTER
          </span>
        </div>
      )}
    </>
  )
}

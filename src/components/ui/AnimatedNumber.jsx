import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../lib/motion'

export default function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }) {
  const ref = useRef(null)
  const prev = useRef(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!ref.current || value === undefined) return

    if (reduced) {
      // Skip the rAF loop; set value immediately
      ref.current.textContent =
        prefix + (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-CA')) + suffix
      prev.current = value
      return () => {}
    }

    const start = prev.current
    const end = value
    const duration = 900
    const startTime = performance.now()
    let rafId
    function step(now) {
      const pct = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - pct, 3)
      const v = start + (end - start) * ease
      if (ref.current) ref.current.textContent = prefix + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-CA')) + suffix
      if (pct < 1) rafId = requestAnimationFrame(step)
      else prev.current = end
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [value, reduced, decimals, prefix, suffix])

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}0{suffix}
    </span>
  )
}

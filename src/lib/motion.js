// Shared motion constants for framer-motion. Keep effects calm and consistent.
export { useReducedMotion } from 'framer-motion'

// Springs
export const spring       = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }
export const springSoft   = { type: 'spring', stiffness: 220, damping: 28 }
export const springSnappy = { type: 'spring', stiffness: 520, damping: 34 }

// Tween durations / easings
export const ease = [0.22, 1, 0.36, 1]   // "easeOutExpo"-ish
export const dur  = { fast: 0.16, base: 0.22, slow: 0.32 }

// Common list-item enter/exit (use with <motion.div layout>)
export const listItem = {
  initial: { opacity: 0, y: -6, height: 0 },
  animate: { opacity: 1, y: 0, height: 'auto' },
  exit:    { opacity: 0, y: -6, height: 0 },
  transition: spring,
}

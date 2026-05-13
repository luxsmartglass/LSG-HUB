import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { dur, ease, useReducedMotion } from '../../lib/motion'

// Fade + slight slide-up of the routed content on each navigation.
export default function PageTransition({ children }) {
  const location = useLocation()
  const reduced = useReducedMotion()
  return (
    <motion.div
      key={location.pathname}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : dur.base, ease }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  )
}

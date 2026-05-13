import { useState, useEffect } from 'react'

/**
 * Subscribe to a CSS media query. SSR / no-matchMedia safe (returns false).
 */
export function useMediaQuery(query) {
  const get = () =>
    (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
      ? window.matchMedia(query).matches
      : false

  const [matches, setMatches] = useState(get)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange() // sync in case it changed between render and effect
    if (mql.addEventListener) mql.addEventListener('change', onChange)
    else mql.addListener(onChange) // legacy Safari
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange)
      else mql.removeListener(onChange)
    }
  }, [query])

  return matches
}

export function useIsMobile()  { return useMediaQuery('(max-width: 768px)') }
export function useIsNarrow()  { return useMediaQuery('(max-width: 520px)') }

export default useMediaQuery

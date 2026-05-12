// Semantic design tokens. Components read these via useTheme() -> `c`.
// NEVER hardcode raw hex in components; add a token here instead.

export const weight = { body: 500, meta: 500, label: 700, button: 600, strong: 700, hero: 800 }
export const text = { xs: 11, sm: 12.5, base: 14, md: 15, lg: 18, xl: 22, '2xl': 28, display: 38 }
export const leading = { tight: 1.2, snug: 1.35, normal: 1.55 }
export const radius = { sm: 6, md: 8, lg: 12, xl: 16, pill: 999 }
export const space = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48]
export const font = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif",
}

const dark = {
  mode: 'dark',
  bg: '#0c0a12',
  surface: '#15121d',
  surfaceHover: '#1c1828',
  surfaceElevated: '#221d2e',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.16)',
  textPrimary: '#ece9f2',
  textSecondary: '#b6b0c4',
  textMuted: '#8b85a0',
  textInverse: '#15121d',
  accent: '#8b5cf6',
  accentHover: '#7c4ddb',
  accentSoft: 'rgba(139,92,246,0.16)',
  accentText: '#ffffff',
  highlight: '#22d3ee',
  highlightSoft: 'rgba(34,211,238,0.14)',
  success: '#34d399', successSoft: 'rgba(52,211,153,0.14)',
  warning: '#fbbf24', warningSoft: 'rgba(251,191,36,0.14)',
  danger: '#f87171', dangerSoft: 'rgba(248,113,113,0.14)',
  overlay: 'rgba(7,5,12,0.6)',
  shadowSm: '0 1px 3px rgba(0,0,0,0.4)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.35)',
  shadowLg: '0 12px 40px rgba(0,0,0,0.5)',
  gradientHero: 'radial-gradient(120% 140% at 80% -20%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(100% 120% at -10% 120%, rgba(34,211,238,0.12), transparent 55%), linear-gradient(135deg, #1c1330 0%, #0c0a12 45%, #0e1b2e 100%)',
  font, weight, text, leading, radius, space,
}

const light = {
  mode: 'light',
  bg: '#f7f6fb',
  surface: '#ffffff',
  surfaceHover: '#f3f1f9',
  surfaceElevated: '#ffffff',
  border: '#e6e4ee',
  borderStrong: '#d4d1e0',
  textPrimary: '#1a1726',
  textSecondary: '#4a4658',
  textMuted: '#6b6680',
  textInverse: '#ffffff',
  accent: '#7c3aed',
  accentHover: '#6d28d9',
  accentSoft: 'rgba(124,58,237,0.10)',
  accentText: '#ffffff',
  highlight: '#0891b2',
  highlightSoft: 'rgba(8,145,178,0.10)',
  success: '#059669', successSoft: 'rgba(5,150,105,0.10)',
  warning: '#d97706', warningSoft: 'rgba(217,119,6,0.10)',
  danger: '#dc2626', dangerSoft: 'rgba(220,38,38,0.10)',
  overlay: 'rgba(26,23,38,0.4)',
  shadowSm: '0 1px 2px rgba(20,16,32,0.06)',
  shadowMd: '0 4px 16px rgba(20,16,32,0.08)',
  shadowLg: '0 12px 40px rgba(20,16,32,0.12)',
  gradientHero: 'radial-gradient(120% 140% at 80% -20%, rgba(124,58,237,0.10), transparent 55%), radial-gradient(100% 120% at -10% 120%, rgba(8,145,178,0.08), transparent 55%), linear-gradient(135deg, #ede9fe 0%, #f7f6fb 50%, #e0f2fe 100%)',
  font, weight, text, leading, radius, space,
}

export const THEMES = { light, dark }
export { light, dark }

export function resolveMode(stored, prefersDark) {
  if (stored === 'light' || stored === 'dark') return stored
  if (stored === 'system' || stored == null) return prefersDark ? 'dark' : 'light'
  return 'dark' // unknown/garbage value → default dark
}

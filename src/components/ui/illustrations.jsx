// Inline SVG illustrations for empty states.
// All are ~120×100, 2px strokes, abstract/geometric.
// Colors come from useTheme() → c.border, c.accentSoft, c.highlightSoft, c.accent.
import { useTheme } from '../../theme/useTheme'

function Svg({ size = 120, children }) {
  const aspect = 100 / 120
  const h = Math.round(size * aspect)
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// Checklist — represents tasks
export function EmptyTasks({ size }) {
  const { c } = useTheme()
  return (
    <Svg size={size}>
      {/* Outer card */}
      <rect x="20" y="10" width="80" height="80" rx="8" fill={c.accentSoft} stroke={c.border} strokeWidth="2" />
      {/* Row 1 — checked */}
      <rect x="32" y="28" width="14" height="14" rx="3" fill={c.accent} stroke={c.accent} strokeWidth="1.5" />
      <polyline points="35,35 38,38 43,33" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="54" y1="35" x2="88" y2="35" stroke={c.border} strokeWidth="2" strokeLinecap="round" />
      {/* Row 2 */}
      <rect x="32" y="48" width="14" height="14" rx="3" fill="transparent" stroke={c.accent} strokeWidth="1.5" />
      <line x1="54" y1="55" x2="88" y2="55" stroke={c.border} strokeWidth="2" strokeLinecap="round" />
      {/* Row 3 */}
      <rect x="32" y="68" width="14" height="14" rx="3" fill="transparent" stroke={c.borderStrong} strokeWidth="1.5" />
      <line x1="54" y1="75" x2="76" y2="75" stroke={c.border} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

// Two person silhouettes — represents contacts
export function EmptyContacts({ size }) {
  const { c } = useTheme()
  return (
    <Svg size={size}>
      {/* Background circle */}
      <circle cx="60" cy="50" r="42" fill={c.accentSoft} stroke={c.border} strokeWidth="2" />
      {/* Person 1 (left) */}
      <circle cx="44" cy="38" r="10" fill="transparent" stroke={c.accent} strokeWidth="2" />
      <path d="M24 72 Q24 58 44 58 Q64 58 64 72" fill={c.highlightSoft} stroke={c.border} strokeWidth="2" strokeLinecap="round" />
      {/* Person 2 (right) — slightly overlapping */}
      <circle cx="74" cy="34" r="10" fill="transparent" stroke={c.border} strokeWidth="2" />
      <path d="M54 70 Q54 56 74 56 Q94 56 94 70" fill="transparent" stroke={c.borderStrong} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

// Document with lines — represents estimates
export function EmptyEstimates({ size }) {
  const { c } = useTheme()
  return (
    <Svg size={size}>
      {/* Document */}
      <rect x="25" y="8" width="70" height="84" rx="6" fill={c.accentSoft} stroke={c.border} strokeWidth="2" />
      {/* Folded corner */}
      <path d="M79 8 L95 24 L79 24 Z" fill={c.highlightSoft} stroke={c.border} strokeWidth="1.5" />
      {/* Lines */}
      <line x1="36" y1="38" x2="84" y2="38" stroke={c.border} strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="50" x2="84" y2="50" stroke={c.border} strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="62" x2="68" y2="62" stroke={c.border} strokeWidth="2" strokeLinecap="round" />
      {/* Accent total line */}
      <line x1="36" y1="76" x2="84" y2="76" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

// Kanban columns — represents pipeline
export function EmptyPipeline({ size }) {
  const { c } = useTheme()
  return (
    <Svg size={size}>
      {/* Three columns */}
      <rect x="10" y="18" width="28" height="64" rx="5" fill={c.accentSoft} stroke={c.border} strokeWidth="2" />
      <rect x="46" y="18" width="28" height="64" rx="5" fill={c.highlightSoft} stroke={c.border} strokeWidth="2" />
      <rect x="82" y="18" width="28" height="64" rx="5" fill="transparent" stroke={c.borderStrong} strokeWidth="2" />
      {/* Cards in col 1 */}
      <rect x="15" y="24" width="18" height="10" rx="3" fill={c.accent} />
      <rect x="15" y="38" width="18" height="10" rx="3" fill={c.border} />
      {/* Cards in col 2 */}
      <rect x="51" y="24" width="18" height="10" rx="3" fill={c.highlight} opacity="0.7" />
      {/* Header labels */}
      <line x1="15" y1="14" x2="33" y2="14" stroke={c.accentSoft} strokeWidth="2" strokeLinecap="round" />
      <line x1="51" y1="14" x2="69" y2="14" stroke={c.highlightSoft} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

// Receipt / invoice — represents invoices
export function EmptyInvoices({ size }) {
  const { c } = useTheme()
  return (
    <Svg size={size}>
      {/* Receipt shape with zigzag bottom */}
      <path
        d="M22 8 L98 8 L98 78 L88 72 L78 78 L68 72 L58 78 L48 72 L38 78 L28 72 L22 78 Z"
        fill={c.accentSoft}
        stroke={c.border}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Lines */}
      <line x1="34" y1="26" x2="86" y2="26" stroke={c.border} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="38" x2="86" y2="38" stroke={c.border} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="50" x2="70" y2="50" stroke={c.border} strokeWidth="1.5" strokeLinecap="round" />
      {/* Amount accent */}
      <line x1="34" y1="62" x2="86" y2="62" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

// Sparkles / stars — generic empty state
export function EmptyGeneric({ size }) {
  const { c } = useTheme()
  return (
    <Svg size={size}>
      {/* Central soft circle */}
      <circle cx="60" cy="50" r="30" fill={c.accentSoft} stroke={c.border} strokeWidth="2" />
      {/* Sparkle large */}
      <path
        d="M60 22 L63 34 L75 37 L63 40 L60 52 L57 40 L45 37 L57 34 Z"
        fill="transparent"
        stroke={c.accent}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Sparkle small top-right */}
      <path
        d="M86 18 L87.5 23 L93 24.5 L87.5 26 L86 31 L84.5 26 L79 24.5 L84.5 23 Z"
        fill={c.highlightSoft}
        stroke={c.border}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Sparkle small bottom-left */}
      <path
        d="M26 68 L27 72 L31 73 L27 74 L26 78 L25 74 L21 73 L25 72 Z"
        fill={c.accentSoft}
        stroke={c.borderStrong}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Dots */}
      <circle cx="92" cy="55" r="3" fill={c.accentSoft} stroke={c.border} strokeWidth="1.5" />
      <circle cx="18" cy="42" r="2.5" fill={c.highlightSoft} stroke={c.border} strokeWidth="1.5" />
    </Svg>
  )
}

// Map of string name → component
// eslint-disable-next-line react-refresh/only-export-components
export const ILLUSTRATIONS = {
  EmptyTasks,
  EmptyContacts,
  EmptyEstimates,
  EmptyPipeline,
  EmptyInvoices,
  EmptyGeneric,
}

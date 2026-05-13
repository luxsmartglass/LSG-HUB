import { useNavigate } from 'react-router-dom'
import { formatDistanceToNowStrict } from 'date-fns'
import { motion } from 'framer-motion'
import { useTheme } from '../../theme/useTheme'
import { spring, useReducedMotion } from '../../lib/motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'

// Small text glyph for each activity kind
const KIND_GLYPH = {
  estimate: '📋',
  deal: '🔥',
  invoice: '🧾',
  invoice_paid: '✅',
  contact: '👤',
}

// Map tone name → Soft background key and text color key in `c`
function toneColors(c, tone) {
  const validTones = ['accent', 'highlight', 'success', 'warning', 'danger']
  if (validTones.includes(tone)) {
    return {
      bg: c[tone + 'Soft'] || c.surfaceHover,
      fg: c[tone] || c.textSecondary,
    }
  }
  // neutral fallback
  return { bg: c.surfaceHover, fg: c.textSecondary }
}

function RelativeTime({ at }) {
  try {
    return formatDistanceToNowStrict(new Date(at), { addSuffix: true })
  } catch {
    return ''
  }
}

export default function ActivityFeed({ items = [], loading = false }) {
  const { c } = useTheme()
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  const header = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{
        fontFamily: c.font.heading,
        fontSize: c.text.md,
        fontWeight: c.weight.strong,
        color: c.textPrimary,
      }}>
        Activity
      </span>
      <Button
        variant="subtle"
        size="sm"
        onClick={() => navigate('/estimates')}
      >
        View all
      </Button>
    </div>
  )

  return (
    <Card header={header} pad={0}>
      {loading ? (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} h={36} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          illustration="EmptyGeneric"
          title="Nothing yet"
          message="Activity across the hub shows up here."
          compact
        />
      ) : (
        reduced ? (
          <div>
            {items.map((item, i) => {
              const { bg, fg } = toneColors(c, item.tone)
              const isLast = i === items.length - 1
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 20px',
                    borderBottom: isLast ? 'none' : '1px solid ' + c.border,
                  }}
                >
                  {/* Icon chip */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: fg,
                    flexShrink: 0,
                  }}>
                    {KIND_GLYPH[item.kind] || '•'}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: c.textPrimary,
                      fontWeight: c.weight.button,
                      fontSize: c.text.base,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      color: c.textMuted,
                      fontSize: c.text.sm,
                      marginTop: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.sub}
                    </div>
                  </div>

                  {/* Relative time */}
                  <div style={{
                    color: c.textMuted,
                    fontSize: c.text.xs,
                    flexShrink: 0,
                    textAlign: 'right',
                  }}>
                    <RelativeTime at={item.at} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          >
            {items.map((item, i) => {
              const { bg, fg } = toneColors(c, item.tone)
              const isLast = i === items.length - 1
              return (
                <motion.div
                  key={item.id}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  transition={spring}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 20px',
                    borderBottom: isLast ? 'none' : '1px solid ' + c.border,
                  }}
                >
                {/* Icon chip */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: fg,
                  flexShrink: 0,
                }}>
                  {KIND_GLYPH[item.kind] || '•'}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: c.textPrimary,
                    fontWeight: c.weight.button,
                    fontSize: c.text.base,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    color: c.textMuted,
                    fontSize: c.text.sm,
                    marginTop: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.sub}
                  </div>
                </div>

                {/* Relative time */}
                <div style={{
                  color: c.textMuted,
                  fontSize: c.text.xs,
                  flexShrink: 0,
                  textAlign: 'right',
                }}>
                  <RelativeTime at={item.at} />
                </div>
                </motion.div>
              )
            })}
          </motion.div>
        )
      )}
    </Card>
  )
}

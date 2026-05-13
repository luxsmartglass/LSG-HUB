import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../../theme/useTheme'
import { useIsMobile } from '../../../hooks/useMediaQuery'
import { CheckIcon, XIcon } from '../../ui/icons'
import { Badge } from '../../ui/Badge'
import { IconButton } from '../../ui/IconButton'
import { carriedOverDays } from '../../../lib/tasks'

export function TaskRow({
  task,
  today,
  onToggle,
  onDelete,
  onRename,
  onSetDue,
  showDue = false,
}) {
  const { c } = useTheme()
  const isMobile = useIsMobile()
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(task.title)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef(null)

  const carried = carriedOverDays(task, today)
  const urgencyColor = task.urgency === 'high' ? c.danger : task.urgency === 'medium' ? c.warning : c.textMuted

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function commitEdit() {
    const trimmed = editVal.trim()
    if (trimmed && trimmed !== task.title) {
      onRename?.(task.id, trimmed)
    } else {
      setEditVal(task.title)
    }
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { commitEdit() }
    if (e.key === 'Escape') { setEditVal(task.title); setEditing(false) }
  }

  const isGlowing = task.urgency === 'high' && carried > 0

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: isMobile ? '12px 12px' : '10px 12px',
    borderRadius: c.radius.md,
    borderLeft: '3px solid ' + urgencyColor,
    background: hovered ? c.surfaceHover : 'transparent',
    transition: 'background-color .15s',
    cursor: 'default',
    position: 'relative',
    ...(isGlowing ? { animation: 'pulseGlow 2.2s ease-in-out infinite' } : {}),
  }

  const checkboxStyle = {
    width: isMobile ? 22 : 18,
    height: isMobile ? 22 : 18,
    borderRadius: c.radius.sm,
    border: '2px solid ' + (task.completed ? c.accent : c.border),
    background: task.completed ? c.accent : 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color .15s, border-color .15s',
    animation: task.completed ? 'scaleIn .18s ease both' : undefined,
  }

  const titleStyle = {
    flex: 1,
    fontSize: c.text.base,
    color: task.completed ? c.textMuted : c.textPrimary,
    textDecoration: task.completed ? 'line-through' : 'none',
    fontWeight: c.weight.body,
    cursor: editing ? 'text' : 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  }

  const dateInputStyle = {
    background: c.mode === 'dark' ? 'rgba(255,255,255,0.06)' : c.bg,
    border: '1px solid ' + c.border,
    borderRadius: c.radius.sm,
    padding: '2px 6px',
    color: c.textSecondary,
    fontSize: c.text.xs,
    fontFamily: c.font.body,
    outline: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  }

  return (
    <div
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <div
        style={checkboxStyle}
        onClick={() => onToggle?.(task)}
        role="checkbox"
        aria-checked={task.completed}
        tabIndex={0}
        onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onToggle?.(task)}
      >
        {task.completed && <CheckIcon size={12} style={{ color: '#fff' }} />}
      </div>

      {/* Title / inline editor */}
      {editing ? (
        <input
          ref={inputRef}
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: c.mode === 'dark' ? 'rgba(255,255,255,0.06)' : c.bg,
            border: '1px solid ' + c.accent,
            borderRadius: c.radius.sm,
            padding: '2px 6px',
            color: c.textPrimary,
            fontSize: c.text.base,
            fontFamily: c.font.body,
            outline: 'none',
            boxShadow: '0 0 0 3px ' + c.accentSoft,
          }}
        />
      ) : (
        <span
          style={titleStyle}
          onClick={() => !task.completed && setEditing(true)}
          title={task.title}
        >
          {task.title}
        </span>
      )}

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Carried over badge */}
        {carried > 0 && (
          <Badge
            tone="neutral"
            title={'Carried over from ' + task.due_date}
          >
            ↻ {carried}d
          </Badge>
        )}

        {/* Due date picker */}
        {showDue && (
          <input
            type="date"
            value={task.due_date || ''}
            onChange={e => onSetDue?.(task.id, e.target.value)}
            style={dateInputStyle}
          />
        )}

        {/* Delete button (hover-revealed on desktop; always visible at reduced opacity on mobile) */}
        <div style={{ opacity: isMobile ? 0.55 : hovered ? 1 : 0, transition: 'opacity .15s' }}>
          <IconButton
            variant="subtle"
            label="Delete task"
            size={24}
            onClick={() => onDelete?.(task.id)}
          >
            <XIcon size={14} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}

export default TaskRow

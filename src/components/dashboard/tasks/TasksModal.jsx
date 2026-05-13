import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../theme/useTheme'
import { listItem, useReducedMotion } from '../../../lib/motion'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Badge } from '../../ui/Badge'
import { Tabs } from '../../ui/Tabs'
import EmptyState from '../../ui/EmptyState'
import { PlusIcon } from '../../ui/icons'
import { UrgencyPicker } from './UrgencyPicker'
import { TaskRow } from './TaskRow'
import { partitionTodayTasks, sortOpenTasks } from '../../../lib/tasks'

const URGENCY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
]

const DAY_MS = 86400000

function withinDays(iso, days) {
  if (!iso) return false
  return Date.now() - new Date(iso).getTime() <= days * DAY_MS
}

function ymd(iso) {
  // 'YYYY-MM-DD' from an ISO timestamp
  return new Date(iso).toISOString().slice(0, 10)
}

export default function TasksModal({ open, onClose, tasks, today, addTask, toggleTask, updateTask, deleteTask }) {
  const { c } = useTheme()
  const reduced = useReducedMotion()
  const [filter, setFilter] = useState('all')
  const [newTitle, setNewTitle] = useState('')
  const [newUrgency, setNewUrgency] = useState('medium')
  const addInputRef = useRef(null)

  const { open: openTasks, hidden } = partitionTodayTasks(tasks || [], today)
  const matchesFilter = (t) => filter === 'all' || t.urgency === filter

  const openFiltered = openTasks.filter(matchesFilter)
  const scheduled = sortOpenTasks(
    (hidden || []).filter(t => !t.completed && t.due_date > today && matchesFilter(t))
  )

  // Completed history (last 30 days), grouped by completion date, newest group first
  const completed = (tasks || []).filter(t => t.completed && withinDays(t.completed_at, 30))
  const groups = {}
  for (const t of completed) {
    const key = ymd(t.completed_at)
    ;(groups[key] = groups[key] || []).push(t)
  }
  const groupKeys = Object.keys(groups).sort().reverse()

  const onRename = (id, t) => updateTask(id, { title: t })
  const onSetDue = (id, d) => updateTask(id, { due_date: d })

  function handleAdd() {
    if (!newTitle.trim()) return
    addTask(newTitle, newUrgency)
    setNewTitle('')
  }

  const subheaderStyle = {
    color: c.textMuted,
    fontWeight: c.weight.label,
    fontSize: c.text.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '18px 0 6px',
  }

  const hasAnything = openFiltered.length > 0 || scheduled.length > 0 || groupKeys.length > 0

  return (
    <Modal open={open} onClose={onClose} size="full" title="Tasks">
      {/* Add row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        <Input
          ref={addInputRef}
          placeholder="Add a task…"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1 }}
        />
        <UrgencyPicker value={newUrgency} onChange={setNewUrgency} />
        <Button size="sm" icon={<PlusIcon size={14} />} onClick={handleAdd}>Add</Button>
      </div>

      {/* Filter */}
      <Tabs tabs={URGENCY_FILTERS} active={filter} onChange={setFilter} />

      {!hasAnything && (
        <EmptyState compact title="No tasks here" message="Nothing matches this filter." />
      )}

      {/* Open */}
      {openFiltered.length > 0 && (
        <>
          <div style={subheaderStyle}>Open · {openFiltered.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reduced ? (
              openFiltered.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  showDue
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onRename={onRename}
                  onSetDue={onSetDue}
                />
              ))
            ) : (
              <AnimatePresence initial={false}>
                {openFiltered.map(task => (
                  <motion.div key={task.id} layout {...listItem}>
                    <TaskRow
                      task={task}
                      today={today}
                      showDue
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onRename={onRename}
                      onSetDue={onSetDue}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      )}

      {/* Scheduled (future) */}
      {scheduled.length > 0 && (
        <>
          <div style={subheaderStyle}>Scheduled · {scheduled.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reduced ? (
              scheduled.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TaskRow
                      task={task}
                      today={today}
                      showDue
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onRename={onRename}
                      onSetDue={onSetDue}
                    />
                  </div>
                  <Badge tone="highlight">{task.due_date}</Badge>
                </div>
              ))
            ) : (
              <AnimatePresence initial={false}>
                {scheduled.map(task => (
                  <motion.div key={task.id} layout {...listItem} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <TaskRow
                        task={task}
                        today={today}
                        showDue
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onRename={onRename}
                        onSetDue={onSetDue}
                      />
                    </div>
                    <Badge tone="highlight">{task.due_date}</Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      )}

      {/* Completed history */}
      {groupKeys.length > 0 && (
        <>
          <div style={subheaderStyle}>Completed · last 30 days</div>
          {groupKeys.map(key => (
            <div key={key}>
              <div style={{ ...subheaderStyle, margin: '12px 0 4px', color: c.textSecondary, textTransform: 'none', letterSpacing: 0, fontWeight: c.weight.button }}>
                {format(new Date(key + 'T00:00:00'), 'EEE, MMM d')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.7 }}>
                {reduced ? (
                  groups[key].map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      today={today}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onRename={onRename}
                    />
                  ))
                ) : (
                  <AnimatePresence initial={false}>
                    {groups[key].map(task => (
                      <motion.div key={task.id} layout {...listItem}>
                        <TaskRow
                          task={task}
                          today={today}
                          onToggle={toggleTask}
                          onDelete={deleteTask}
                          onRename={onRename}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </Modal>
  )
}

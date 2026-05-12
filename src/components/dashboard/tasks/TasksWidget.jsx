import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../../theme/useTheme'
import { useDailyTasks } from '../../../hooks/useDailyTasks'
import { partitionTodayTasks, todayStr } from '../../../lib/tasks'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Badge } from '../../ui/Badge'
import { IconButton } from '../../ui/IconButton'
import { Skeleton } from '../../ui/Skeleton'
import EmptyState from '../../ui/EmptyState'
import ErrorBanner from '../../ui/ErrorBanner'
import { PlusIcon } from '../../ui/icons'
import { UrgencyPicker } from './UrgencyPicker'
import { TaskRow } from './TaskRow'
import TasksModal from './TasksModal'

// Inline expand icon
function ExpandIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

export function TasksWidget({ onCount }) {
  const { c } = useTheme()
  const { tasks, loading, error, addTask, toggleTask, updateTask, deleteTask } = useDailyTasks()
  const today = todayStr()
  const { open, doneToday } = partitionTodayTasks(tasks, today)

  const [modalOpen, setModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrgency, setNewUrgency] = useState('medium')
  const addInputRef = useRef(null)
  const prevOpenLen = useRef(0)

  // Notify parent of open count
  useEffect(() => {
    onCount?.(open.length)
  }, [open.length, onCount])

  // Listen for command palette "New Task" event
  useEffect(() => {
    function handleNewTask() {
      addInputRef.current?.focus()
    }
    window.addEventListener('lsg:new-task', handleNewTask)
    return () => window.removeEventListener('lsg:new-task', handleNewTask)
  }, [])

  // All-clear confetti
  useEffect(() => {
    if (prevOpenLen.current > 0 && open.length === 0 && !loading) {
      import('canvas-confetti').then(m => m.default({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        disableForReducedMotion: true,
      }))
    }
    prevOpenLen.current = open.length
  }, [open.length, loading])

  function handleAdd() {
    if (!newTitle.trim()) return
    addTask(newTitle, newUrgency)
    setNewTitle('')
    // keep newUrgency
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  const headerRow = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => setModalOpen(true)}
    >
      <span style={{
        fontFamily: c.font.heading,
        fontWeight: c.weight.strong,
        fontSize: c.text.md,
        color: c.textPrimary,
        flex: 1,
      }}>
        Today's Tasks
      </span>
      <Badge tone="accent">{open.length}</Badge>
      <IconButton
        label="Expand tasks"
        size={28}
        variant="ghost"
        onClick={e => { e.stopPropagation(); setModalOpen(true) }}
        style={{ border: 'none' }}
      >
        <ExpandIcon size={14} />
      </IconButton>
    </div>
  )

  function renderBody() {
    if (error) {
      return (
        <ErrorBanner error={{
          message: 'Tasks need a one-time setup — run db/2026-05-12-daily_tasks.sql in your Supabase SQL editor. (' + (error.message || '') + ')',
        }} />
      )
    }

    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton h={42} />
          <Skeleton h={42} />
          <Skeleton h={42} />
        </div>
      )
    }

    if (open.length === 0 && doneToday.length === 0) {
      return (
        <EmptyState
          illustration="EmptyTasks"
          title="Nothing on the list"
          message="Add your first task above."
          compact
        />
      )
    }

    const visibleOpen = open.slice(0, 5)
    const moreCount = open.length - 5

    return (
      <div>
        {/* Open tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleOpen.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onRename={(id, t) => updateTask(id, { title: t })}
            />
          ))}
        </div>

        {/* "More" button */}
        {moreCount > 0 && (
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setModalOpen(true)}
            style={{ marginTop: 4 }}
          >
            +{moreCount} more
          </Button>
        )}

        {/* Divider */}
        {doneToday.length > 0 && (
          <div style={{ height: 1, background: c.border, margin: '10px 0' }} />
        )}

        {/* Done today */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.65 }}>
          {doneToday.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onRename={(id, t) => updateTask(id, { title: t })}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <Card header={headerRow}>
        {/* Add row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <Input
            ref={addInputRef}
            placeholder="Add a task…"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
          />
          <UrgencyPicker value={newUrgency} onChange={setNewUrgency} />
          <Button
            size="sm"
            icon={<PlusIcon size={14} />}
            onClick={handleAdd}
          >
            Add
          </Button>
        </div>

        {/* Body */}
        {renderBody()}
      </Card>

      <TasksModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tasks={tasks}
        today={today}
        addTask={addTask}
        toggleTask={toggleTask}
        updateTask={updateTask}
        deleteTask={deleteTask}
      />
    </>
  )
}

export default TasksWidget

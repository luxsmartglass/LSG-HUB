import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtime } from './useRealtime'
import { useToast } from '../components/ui/Toast'

export function useDailyTasks() {
  const toast = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) { setError(error); setTasks([]) }     // table missing / RLS -> widget shows ErrorBanner with instructions
    else { setError(null); setTasks(data || []) }
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload]) // eslint-disable-line react-hooks/set-state-in-effect -- intentional: load on mount; reload() is async
  useRealtime('daily_tasks', () => { reload() })

  const addTask = useCallback(async (title, urgency = 'medium', due_date) => {
    const t = title.trim()
    if (!t) return
    const record = { title: t, urgency }
    if (due_date) record.due_date = due_date
    const { data, error } = await supabase.from('daily_tasks').insert(record).select()
    if (error) { toast(error.message, 'error'); return }
    setTasks(prev => [...prev, ...(data || [])])
  }, [toast])

  const updateTask = useCallback(async (id, patch) => {
    const prev = tasks
    setTasks(p => p.map(x => x.id === id ? { ...x, ...patch } : x))   // optimistic
    const { error } = await supabase.from('daily_tasks').update(patch).eq('id', id)
    if (error) { toast(error.message, 'error'); setTasks(prev) }
  }, [tasks, toast])

  const toggleTask = useCallback((task) => {
    return updateTask(task.id, task.completed
      ? { completed: false, completed_at: null }
      : { completed: true, completed_at: new Date().toISOString() })
  }, [updateTask])

  const deleteTask = useCallback(async (id) => {
    const prev = tasks
    setTasks(p => p.filter(x => x.id !== id))   // optimistic
    const { error } = await supabase.from('daily_tasks').delete().eq('id', id)
    if (error) { toast(error.message, 'error'); setTasks(prev) }
  }, [tasks, toast])

  return { tasks, loading, error, reload, addTask, updateTask, toggleTask, deleteTask }
}

export default useDailyTasks

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtime } from './useRealtime'

function todayIso() { return new Date().toISOString().slice(0, 10) }

export function useCounts() {
  const [counts, setCounts] = useState({ tasks: 0, invoices: 0, deals: 0 })

  const reload = useCallback(async () => {
    const today = todayIso()

    const [tasksRes, invoicesRes, dealsRes] = await Promise.all([
      supabase
        .from('daily_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('completed', false)
        .lte('due_date', today),
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .is('paid_date', null),
      supabase
        .from('pipeline')
        .select('id', { count: 'exact', head: true })
        .not('stage', 'in', '(lost,won)'),
    ])

    setCounts({
      tasks: tasksRes.error ? 0 : (tasksRes.count || 0),
      invoices: invoicesRes.error ? 0 : (invoicesRes.count || 0),
      deals: dealsRes.error ? 0 : (dealsRes.count || 0),
    })
  }, [])

  useEffect(() => { reload() }, [reload])

  // Refetch when any of the three tables change via realtime
  useRealtime('daily_tasks', reload)
  useRealtime('invoices', reload)
  useRealtime('pipeline', reload)

  return counts
}

export default useCounts

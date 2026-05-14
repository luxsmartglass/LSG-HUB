import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtime } from './useRealtime'
import { useToast } from '../components/ui/Toast'

export function useColdCalls() {
  const toast = useToast()
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const deleteTimers = useRef([])

  useEffect(() => {
    return () => { deleteTimers.current.forEach(id => clearTimeout(id)) }
  }, [])

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('cold_calls')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setError(error); setCalls([]) }     // table missing / RLS -> page shows ErrorBanner with instructions
    else { setError(null); setCalls(data || []) }
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload]) // eslint-disable-line react-hooks/set-state-in-effect -- intentional: load on mount; reload() is async
  useRealtime('cold_calls', () => { reload() })

  const addCall = useCallback(async (patch = {}) => {
    const record = {
      lead_name: patch.lead_name ?? '',
      ...(patch.caller ? { caller: patch.caller } : {}),
      ...(patch.notes ? { notes: patch.notes } : {}),
      ...(patch.outcome ? { outcome: patch.outcome } : {}),
    }
    const { data, error } = await supabase.from('cold_calls').insert(record).select()
    if (error) { toast(error.message, 'error'); return null }
    const created = data?.[0]
    if (created) setCalls(prev => [created, ...prev])
    return created
  }, [toast])

  const updateCall = useCallback(async (id, patch) => {
    const prev = calls
    setCalls(p => p.map(x => x.id === id ? { ...x, ...patch } : x))   // optimistic
    const { error } = await supabase.from('cold_calls').update(patch).eq('id', id)
    if (error) { toast(error.message, 'error'); setCalls(prev) }
  }, [calls, toast])

  const deleteCall = useCallback((id) => {
    const removed = calls.find(t => t.id === id)
    if (!removed) {
      // fallback: immediate delete
      supabase.from('cold_calls').delete().eq('id', id).then(({ error }) => {
        if (error) toast(error.message, 'error')
      })
      return
    }
    setCalls(p => p.filter(x => x.id !== id))   // optimistic remove
    const timer = setTimeout(async () => {
      deleteTimers.current = deleteTimers.current.filter(t => t !== timer)
      const { error } = await supabase.from('cold_calls').delete().eq('id', id)
      if (error) {
        toast(error.message, 'error')
        setCalls(p => [removed, ...p])
      }
    }, 6000)
    deleteTimers.current.push(timer)
    toast('Call deleted', 'success', {
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timer)
          deleteTimers.current = deleteTimers.current.filter(t => t !== timer)
          setCalls(p => p.some(t => t.id === id) ? p : [removed, ...p].sort((a, b) =>
            (b.created_at || '').localeCompare(a.created_at || '')
          ))
        },
      },
      duration: 6000,
    })
  }, [calls, toast])

  return { calls, loading, error, reload, addCall, updateCall, deleteCall }
}

export default useColdCalls

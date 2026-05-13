import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useQuery(queryFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: loading state set at effect start, updated in async callback
    setLoading(true)
    setError(null)
    queryFn().then(({ data, error }) => {
      if (cancelled) return
      if (error) setError(error)
      else setData(data)
      setLoading(false)
    }).catch(err => {
      if (!cancelled) { setError(err); setLoading(false) }
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const refetch = useCallback(() => setTick(t => t + 1), [])
  return { data, loading, error, refetch }
}

export async function insertRecord(table, record) {
  const { data, error } = await supabase.from(table).insert(record).select().single()
  if (error) throw error
  return data
}

export async function updateRecord(table, id, updates) {
  const { data, error } = await supabase.from(table).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteRecord(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export async function upsertRecord(table, record, onConflict = 'id') {
  const { data, error } = await supabase.from(table).upsert(record, { onConflict }).select().single()
  if (error) throw error
  return data
}

export default useQuery

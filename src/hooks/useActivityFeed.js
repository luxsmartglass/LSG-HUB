import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useActivityFeed(limit)
 * Fetches recent activity across estimates, pipeline, invoices, and contacts.
 * Returns { items, loading, error }.
 * - items: sorted by `at` desc, sliced to `limit`
 * - Each item: { kind, id, label, sub, at, tone }
 * - If a source query errors, that source is skipped; `error` is set to the first error seen.
 * - No realtime subscription.
 */
export function useActivityFeed(limit = 8) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      // Run all four queries in parallel
      const [estRes, pipeRes, invRes, contactRes] = await Promise.all([
        supabase
          .from('estimates')
          .select('id, client_name, total_revenue, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('pipeline')
          .select('id, client_name, stage, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('invoices')
          .select('id, client_name, total_amount, paid_date, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('contacts')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
      ])

      if (cancelled) return

      let firstError = null
      const allItems = []

      // Estimates
      if (estRes.error) {
        firstError = firstError || estRes.error
      } else {
        for (const row of estRes.data || []) {
          const amt = row.total_revenue ? '$' + Math.round(row.total_revenue).toLocaleString('en-CA') : null
          allItems.push({
            kind: 'estimate',
            id: 'est-' + row.id,
            label: row.client_name || 'Unknown client',
            sub: amt ? `Estimate · ${amt}` : 'Estimate saved',
            at: row.created_at,
            tone: 'accent',
          })
        }
      }

      // Pipeline (deals)
      if (pipeRes.error) {
        firstError = firstError || pipeRes.error
      } else {
        for (const row of pipeRes.data || []) {
          allItems.push({
            kind: 'deal',
            id: 'deal-' + row.id,
            label: row.client_name || 'Unknown client',
            sub: row.stage ? `Deal · ${row.stage.replace(/_/g, ' ')}` : 'Deal added',
            at: row.created_at,
            tone: 'highlight',
          })
        }
      }

      // Invoices — an invoice row with a non-null paid_date ALSO yields an invoice_paid item
      if (invRes.error) {
        firstError = firstError || invRes.error
      } else {
        for (const row of invRes.data || []) {
          const amt = row.total_amount ? '$' + Math.round(row.total_amount).toLocaleString('en-CA') : null
          // Base invoice item
          allItems.push({
            kind: 'invoice',
            id: 'inv-' + row.id,
            label: row.client_name || 'Unknown client',
            sub: amt ? `Invoice · ${amt}` : 'Invoice created',
            at: row.created_at,
            tone: 'neutral',
          })
          // Additional invoice_paid item if paid
          if (row.paid_date) {
            allItems.push({
              kind: 'invoice_paid',
              id: 'invpaid-' + row.id,
              label: row.client_name || 'Unknown client',
              sub: amt ? `Invoice paid · ${amt}` : 'Invoice paid',
              at: row.paid_date,
              tone: 'success',
            })
          }
        }
      }

      // Contacts
      if (contactRes.error) {
        firstError = firstError || contactRes.error
      } else {
        for (const row of contactRes.data || []) {
          allItems.push({
            kind: 'contact',
            id: 'contact-' + row.id,
            label: row.name || 'New contact',
            sub: 'Contact added',
            at: row.created_at,
            tone: 'accent',
          })
        }
      }

      // Sort by at desc, slice to limit
      allItems.sort((a, b) => new Date(b.at) - new Date(a.at))
      const result = allItems.slice(0, limit)

      setItems(result)
      if (firstError) setError(firstError)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [limit])

  return { items, loading, error }
}

export default useActivityFeed

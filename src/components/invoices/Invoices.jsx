import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import InvoiceList from './InvoiceList'
import InvoiceGenerator from './InvoiceGenerator'
import InvoicePDF from './InvoicePDF'

const NAVY = '#1c2b4a'
const GOLD = '#c9a84c'
const CREAM = '#f4f1eb'
const BG = '#0f1d35'

function SummaryCard({ label, value, accent }) {
  return (
    <div style={{
      background: NAVY, borderRadius: 10, padding: '20px 24px',
      borderTop: `3px solid ${accent || GOLD}`, flex: 1, minWidth: 160
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(244,241,235,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: CREAM }}>
        {value}
      </div>
    </div>
  )
}

const today = new Date().toISOString().split('T')[0]

export default function Invoices() {
  const addToast = useToast()
  const [invoices, setInvoices] = useState([])
  const [estimates, setEstimates] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' | 'edit' | 'pdf'
  const [selected, setSelected] = useState(null)
  const [settings, setSettings] = useState({})

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [invRes, estRes] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('estimates').select('id, client_name, zones, film_price, glass_price, total_revenue').order('created_at', { ascending: false }),
    ])
    if (invRes.error) addToast('Failed to load invoices', 'error')
    else setInvoices(invRes.data || [])
    if (!estRes.error) setEstimates(estRes.data || [])
    setLoading(false)
  }, [addToast])

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('key, value')
    if (data) setSettings(Object.fromEntries(data.map(r => [r.key, r.value])))
  }

  useEffect(() => {
    fetchAll()
    loadSettings()
  }, [fetchAll])

  const handleNew = () => {
    setSelected(null)
    setView('edit')
  }

  const handleSelect = (invoice) => {
    setSelected(invoice)
    setView('pdf')
  }

  const handleEdit = (invoice) => {
    setSelected(invoice)
    setView('edit')
  }

  const handleSave = async (invoice) => {
    let result
    if (invoice.id) {
      const { id, ...rest } = invoice
      result = await supabase.from('invoices').update(rest).eq('id', id).select().single()
    } else {
      result = await supabase.from('invoices').insert(invoice).select().single()
    }
    if (result.error) {
      addToast('Save failed: ' + result.error.message, 'error')
    } else {
      addToast('Invoice saved')
      setInvoices(prev =>
        invoice.id
          ? prev.map(i => i.id === result.data.id ? result.data : i)
          : [result.data, ...prev]
      )
      setSelected(result.data)
      setView('list')
    }
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) {
      addToast('Delete failed', 'error')
    } else {
      addToast('Invoice deleted')
      setInvoices(prev => prev.filter(i => i.id !== id))
      if (selected?.id === id) { setSelected(null); setView('list') }
    }
  }

  const handleMarkPaid = async (id) => {
    const { data, error } = await supabase
      .from('invoices').update({ status: 'paid' }).eq('id', id).select().single()
    if (error) {
      addToast('Update failed', 'error')
    } else {
      addToast('Marked as paid!')
      setInvoices(prev => prev.map(i => i.id === id ? data : i))
    }
  }

  // Summary stats
  const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total_amount || 0), 0)
  const overdueCount = invoices.filter(i =>
    i.status !== 'paid' && i.due_date && i.due_date < today
  ).length

  const fmt = (n) => '$' + Math.round(n).toLocaleString()

  return (
    <div style={{ background: BG, minHeight: '100vh', color: CREAM, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid rgba(201,168,76,0.2)`
      }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: CREAM }}>Invoices</h1>
        <button
          onClick={handleNew}
          style={{
            background: GOLD, color: NAVY, border: 'none', borderRadius: 8,
            padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700
          }}
        >
          + New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ padding: '24px 32px 0' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <SummaryCard label="Total Invoiced"  value={fmt(totalInvoiced)}  accent={GOLD} />
          <SummaryCard label="Paid"            value={fmt(totalPaid)}      accent="#10b981" />
          <SummaryCard label="Outstanding"     value={fmt(totalOutstanding)} accent="#f59e0b" />
          <SummaryCard label="Overdue"         value={overdueCount}        accent="#ef4444" />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(244,241,235,0.5)', padding: 60 }}>
            Loading invoices…
          </div>
        ) : (
          <InvoiceList
            invoices={invoices}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkPaid={handleMarkPaid}
          />
        )}
      </div>

      {/* Invoice Generator modal */}
      {view === 'edit' && (
        <InvoiceGenerator
          invoice={selected}
          estimates={estimates}
          onSave={handleSave}
          onClose={() => setView('list')}
          settings={settings}
        />
      )}

      {/* PDF viewer modal */}
      {view === 'pdf' && selected && (
        <InvoicePDF
          invoice={selected}
          onClose={() => setView('list')}
          onEdit={() => setView('edit')}
          settings={settings}
        />
      )}
    </div>
  )
}

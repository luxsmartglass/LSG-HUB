import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

const NAVY = '#1c2b4a'
const GOLD = '#c9a84c'
const CREAM = '#f4f1eb'
const BG = '#0f1d35'

function generateInvoiceNumber() {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 900) + 100)
  return `INV-${yy}${mm}-${rand}`
}

const inputStyle = {
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6, padding: '8px 12px', color: CREAM, fontSize: 14,
  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit'
}

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: GOLD,
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block'
}

export default function InvoiceGenerator({ invoice, estimates, onSave, onClose, settings = {} }) {
  const addToast = useToast()

  const [form, setForm] = useState({
    invoice_number:  invoice?.invoice_number || generateInvoiceNumber(),
    client_name:     invoice?.client_name || '',
    estimate_id:     invoice?.estimate_id || '',
    line_items:      invoice?.line_items || [{ description: '', qty: 1, unit_price: 0 }],
    tax_pct:         invoice?.hst_amount != null && invoice?.subtotal
                       ? ((invoice.hst_amount / invoice.subtotal) * 100).toFixed(1)
                       : parseFloat(settings.default_tax_rate) ?? 13,
    deposit_pct:     invoice?.deposit_pct ?? parseFloat(settings.default_deposit_pct) ?? 50,
    deposit_paid_ui: invoice?.paid_date ? true : false,
    due_date:        invoice?.due_date || '',
    notes:           invoice?.notes || '',
    status:          invoice?.status || 'draft',
    ...(invoice?.id ? { id: invoice.id } : {}),
  })

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleEstimateSelect = (e) => {
    const estId = e.target.value
    setField('estimate_id', estId)
    if (!estId) return
    const est = estimates.find(es => String(es.id) === String(estId))
    if (!est) return
    setField('client_name', est.client_name || form.client_name)
    // Estimates store zones, not line_items — build line items from zones
    const line_items = Array.isArray(est.zones) && est.zones.length > 0
      ? est.zones.map(z => ({
          description: `${z.type} — ${z.sqm} sqm`,
          qty: 1,
          unit_price: parseFloat(z.sqm) * (
            ['Sauna', 'Window (Exterior)'].includes(z.type)
              ? (est.glass_price || 1050)
              : (est.film_price || 700)
          ),
        }))
      : [{ description: '', qty: 1, unit_price: est.total_revenue || 0 }]
    setField('line_items', line_items)
  }

  const updateItem = (i, key, val) => {
    const updated = form.line_items.map((it, idx) =>
      idx === i ? { ...it, [key]: val } : it
    )
    setField('line_items', updated)
  }

  const addItem = () => setField('line_items', [...form.line_items, { description: '', qty: 1, unit_price: 0 }])

  const removeItem = (i) => {
    if (form.line_items.length === 1) return
    setField('line_items', form.line_items.filter((_, idx) => idx !== i))
  }

  const subtotal = form.line_items.reduce((s, it) => {
    const qty = parseFloat(it.qty) || 0
    const price = parseFloat(it.unit_price) || 0
    return s + qty * price
  }, 0)

  const taxAmt      = subtotal * (parseFloat(form.tax_pct) || 0) / 100
  const total_amount = subtotal + taxAmt
  const depositAmt  = total_amount * (parseFloat(form.deposit_pct) || 0) / 100
  const balanceDue  = total_amount - depositAmt

  const fmt = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const buildRecord = (statusOverride) => {
    const hst_amount = subtotal * (parseFloat(form.tax_pct) || 13) / 100
    const computed_total = subtotal + hst_amount
    const deposit_amount = computed_total * (parseFloat(form.deposit_pct) || 50) / 100
    const amount_due = form.deposit_paid_ui ? computed_total - deposit_amount : computed_total
    return {
      ...(form.id ? { id: form.id } : {}),
      invoice_number: form.invoice_number,
      client_name:    form.client_name,
      estimate_id:    form.estimate_id || null,
      due_date:       form.due_date || null,
      line_items:     form.line_items,
      deposit_pct:    parseFloat(form.deposit_pct) || 50,
      subtotal,
      hst_amount,
      hst_enabled:    (parseFloat(form.tax_pct) || 0) > 0,
      tax_pct:        parseFloat(form.tax_pct) || 0,
      total_amount:   computed_total,
      amount_due,
      paid_date:      form.deposit_paid_ui ? new Date().toISOString() : null,
      status:         statusOverride || form.status || 'draft',
      notes:          form.notes || '',
      updated_at:     new Date().toISOString(),
    }
  }

  const handleSaveDraft = () => {
    onSave(buildRecord('draft'))
  }

  const handleGeneratePDF = () => {
    onSave(buildRecord(form.status === 'draft' ? 'sent' : form.status))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      overflowY: 'auto', padding: '24px 16px', fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        background: '#162238', borderRadius: 12, width: '100%', maxWidth: 780,
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(201,168,76,0.2)'
      }}>
        {/* Header */}
        <div style={{
          background: NAVY, padding: '20px 28px', borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `2px solid rgba(201,168,76,0.3)`
        }}>
          <h2 style={{ margin: 0, color: CREAM, fontSize: 18, fontWeight: 700 }}>
            {invoice?.id ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: CREAM,
            width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
            fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>×</button>
        </div>

        <div style={{ padding: 28 }}>
          {/* Top row: invoice # / client / estimate / due date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Invoice Number</label>
              <input
                style={inputStyle}
                value={form.invoice_number}
                onChange={e => setField('invoice_number', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                style={inputStyle}
                value={form.due_date}
                onChange={e => setField('due_date', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Client Name</label>
              <input
                style={inputStyle}
                value={form.client_name}
                onChange={e => setField('client_name', e.target.value)}
                placeholder="Client name"
              />
            </div>
            <div>
              <label style={labelStyle}>Link to Estimate</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.estimate_id}
                onChange={handleEstimateSelect}
              >
                <option value="">— None —</option>
                {estimates.map(est => (
                  <option key={est.id} value={est.id}>
                    EST-{String(est.id).slice(0, 6).toUpperCase()} — {est.client_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ ...labelStyle, marginBottom: 0 }}>Line Items</span>
              <button
                onClick={addItem}
                style={{
                  background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.3)`,
                  color: GOLD, borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600
                }}
              >
                + Add Item
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.25)' }}>
                  {['Description', 'Qty', 'Unit Price', 'Total', ''].map(h => (
                    <th key={h} style={{
                      padding: '8px 10px', textAlign: 'left',
                      color: GOLD, fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.06em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.line_items.map((item, i) => {
                  const lineTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '8px 10px', width: '45%' }}>
                        <input
                          style={inputStyle}
                          value={item.description}
                          onChange={e => updateItem(i, 'description', e.target.value)}
                          placeholder="Description"
                        />
                      </td>
                      <td style={{ padding: '8px 10px', width: '10%' }}>
                        <input
                          type="number"
                          style={inputStyle}
                          value={item.qty}
                          min="0"
                          onChange={e => updateItem(i, 'qty', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', width: '18%' }}>
                        <input
                          type="number"
                          style={inputStyle}
                          value={item.unit_price}
                          min="0"
                          step="0.01"
                          onChange={e => updateItem(i, 'unit_price', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', color: CREAM, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {fmt(lineTotal)}
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <button
                          onClick={() => removeItem(i)}
                          disabled={form.line_items.length === 1}
                          style={{
                            background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)',
                            color: '#fca5a5', borderRadius: 6, padding: '4px 8px',
                            cursor: form.line_items.length === 1 ? 'not-allowed' : 'pointer',
                            opacity: form.line_items.length === 1 ? 0.4 : 1, fontSize: 13
                          }}
                        >✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Tax + Deposit side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Tax Rate (%)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.tax_pct}
                min="0"
                max="30"
                step="0.5"
                onChange={e => setField('tax_pct', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Deposit % — {form.deposit_pct}%
                <span style={{ color: 'rgba(244,241,235,0.4)', fontWeight: 400, textTransform: 'none', fontSize: 12, marginLeft: 8 }}>
                  (Deposit: {fmt(depositAmt)} | Balance: {fmt(balanceDue)})
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.deposit_pct}
                onChange={e => setField('deposit_pct', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: GOLD, marginTop: 10 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(244,241,235,0.4)', marginTop: 4 }}>
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>

          {/* Deposit paid toggle */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="deposit_paid"
              checked={form.deposit_paid_ui}
              onChange={e => setField('deposit_paid_ui', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: GOLD, cursor: 'pointer' }}
            />
            <label htmlFor="deposit_paid" style={{ color: CREAM, fontSize: 14, cursor: 'pointer' }}>
              Deposit has been received
            </label>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Payment terms, special instructions, etc."
            />
          </div>

          {/* Totals */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 10,
            padding: '16px 20px', marginBottom: 24,
            border: '1px solid rgba(201,168,76,0.15)'
          }}>
            {[
              ['Subtotal', fmt(subtotal)],
              [`Tax (${form.tax_pct}%)`, fmt(taxAmt)],
              ['Total', fmt(total_amount)],
              [`Deposit Required (${form.deposit_pct}%)`, fmt(depositAmt)],
              ['Balance Due', fmt(balanceDue)],
            ].map(([label, value], i) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0',
                borderTop: i === 2 ? `1px solid rgba(201,168,76,0.3)` : 'none',
                borderBottom: i === 2 ? `1px solid rgba(201,168,76,0.3)` : 'none',
                marginTop: i === 2 ? 6 : 0, marginBottom: i === 2 ? 6 : 0
              }}>
                <span style={{ color: 'rgba(244,241,235,0.6)', fontSize: 14 }}>{label}</span>
                <span style={{
                  color: i === 2 ? GOLD : CREAM,
                  fontWeight: i === 2 ? 700 : 500, fontSize: i === 2 ? 16 : 14
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                color: CREAM, borderRadius: 8, padding: '10px 22px',
                cursor: 'pointer', fontSize: 14
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDraft}
              style={{
                background: 'rgba(201,168,76,0.15)', border: `1px solid ${GOLD}`,
                color: GOLD, borderRadius: 8, padding: '10px 22px',
                cursor: 'pointer', fontSize: 14, fontWeight: 600
              }}
            >
              Save Draft
            </button>
            <button
              onClick={handleGeneratePDF}
              style={{
                background: GOLD, color: NAVY, border: 'none',
                borderRadius: 8, padding: '10px 26px',
                cursor: 'pointer', fontSize: 14, fontWeight: 700
              }}
            >
              Generate PDF →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

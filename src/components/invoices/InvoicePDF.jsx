const NAVY = '#1c2b4a'
const GOLD = '#c9a84c'

const COMPANY = {
  name:    'LUX SMART GLASS',
  tagline: 'Premium Smart Glass Solutions',
  address: '123 King Street West, Suite 400\nToronto, ON  M5H 1J9',
  phone:   '(416) 555-0199',
  email:   'info@luxsmartglass.ca',
  website: 'www.luxsmartglass.ca',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtMoney(n) {
  return '$' + (n || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function GoldLine() {
  return (
    <div style={{
      height: 2,
      background: `linear-gradient(90deg, ${GOLD} 0%, rgba(201,168,76,0.2) 100%)`,
      margin: '16px 0'
    }} />
  )
}

export default function InvoicePDF({ invoice, onClose, onEdit }) {
  const items = Array.isArray(invoice.items) ? invoice.items : []
  const subtotal    = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0), 0)
  const taxPct      = parseFloat(invoice.tax_pct) || 13
  const taxAmt      = subtotal * taxPct / 100
  const total       = subtotal + taxAmt
  const depositPct  = parseFloat(invoice.deposit_pct) || 50
  const depositAmt  = total * depositPct / 100
  const balanceDue  = total - depositAmt

  const invoiceNum = invoice.invoice_number ||
    `INV-${String(invoice.id || '0000').slice(-4).toUpperCase()}`

  return (
    <>
      {/* Print-specific CSS */}
      <style>{`
        @media print {
          body > *:not(#invoice-print-root) { display: none !important; }
          #invoice-print-root { position: static !important; }
          #invoice-print-overlay { display: none !important; }
          #invoice-print-actions { display: none !important; }
          #invoice-print-doc {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Modal overlay */}
      <div
        id="invoice-print-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 1000
        }}
      />

      {/* Modal container */}
      <div
        id="invoice-print-root"
        style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-start',
          overflowY: 'auto', padding: '24px 16px',
          fontFamily: "'DM Sans', Georgia, serif"
        }}
      >
        {/* Toolbar */}
        <div
          id="invoice-print-actions"
          style={{
            display: 'flex', gap: 10, marginBottom: 16,
            width: '100%', maxWidth: 760, justifyContent: 'flex-end'
          }}
          onClick={e => e.stopPropagation()}
        >
          {onEdit && (
            <button
              onClick={onEdit}
              style={{
                background: 'rgba(201,168,76,0.15)', border: `1px solid ${GOLD}`,
                color: GOLD, borderRadius: 8, padding: '8px 20px',
                cursor: 'pointer', fontSize: 13, fontWeight: 600
              }}
            >
              Edit Invoice
            </button>
          )}
          <button
            onClick={() => window.print()}
            style={{
              background: GOLD, color: NAVY, border: 'none',
              borderRadius: 8, padding: '8px 20px',
              cursor: 'pointer', fontSize: 13, fontWeight: 700
            }}
          >
            🖨 Print / Save PDF
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: 8, padding: '8px 16px',
              cursor: 'pointer', fontSize: 13
            }}
          >
            Close
          </button>
        </div>

        {/* Invoice document */}
        <div
          id="invoice-print-doc"
          onClick={e => e.stopPropagation()}
          style={{
            background: '#ffffff', borderRadius: 8, width: '100%', maxWidth: 760,
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            padding: '48px 52px', color: '#1a1a1a',
            fontFamily: "'DM Sans', Arial, sans-serif",
            fontSize: 14, lineHeight: 1.5
          }}
        >
          {/* Company Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{
                fontSize: 28, fontWeight: 900, color: NAVY,
                letterSpacing: '0.04em', lineHeight: 1
              }}>
                {COMPANY.name}
              </div>
              <div style={{ fontSize: 13, color: GOLD, fontWeight: 600, marginTop: 4 }}>
                {COMPANY.tagline}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#555', lineHeight: 1.7 }}>
              {COMPANY.address.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              <div>{COMPANY.phone}</div>
              <div>{COMPANY.email}</div>
              <div style={{ color: NAVY }}>{COMPANY.website}</div>
            </div>
          </div>

          <GoldLine />

          {/* Invoice Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
                INVOICE
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{invoiceNum}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#555', lineHeight: 2 }}>
              <div>
                <span style={{ fontWeight: 600, color: '#333' }}>Date: </span>
                {fmtDate(invoice.created_at)}
              </div>
              <div>
                <span style={{ fontWeight: 600, color: '#333' }}>Due Date: </span>
                <span style={{
                  color: invoice.due_date && invoice.due_date < new Date().toISOString().split('T')[0] && invoice.status !== 'paid'
                    ? '#dc2626' : '#333'
                }}>
                  {fmtDate(invoice.due_date)}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: '#333' }}>Status: </span>
                <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{invoice.status || 'Draft'}</span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{
            background: '#f8f6f1', borderRadius: 8, padding: '14px 20px',
            borderLeft: `4px solid ${GOLD}`, marginBottom: 28
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              Bill To
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
              {invoice.client_name || '—'}
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {['Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: i === 0 ? 'left' : 'right',
                    color: '#ffffff', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const lineTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0)
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf8' }}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #eee' }}>
                      {item.description || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid #eee', color: '#555' }}>
                      {item.qty}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid #eee', color: '#555' }}>
                      {fmtMoney(parseFloat(item.unit_price) || 0)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 600 }}>
                      {fmtMoney(lineTotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <div style={{ width: 320 }}>
              {[
                ['Subtotal',              fmtMoney(subtotal),   false],
                [`HST / Tax (${taxPct}%)`, fmtMoney(taxAmt),    false],
                ['TOTAL',                  fmtMoney(total),      true ],
              ].map(([label, value, bold]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0',
                  borderTop: bold ? `2px solid ${GOLD}` : 'none',
                  borderBottom: bold ? `2px solid ${GOLD}` : 'none',
                  marginTop: bold ? 4 : 0, marginBottom: bold ? 4 : 0
                }}>
                  <span style={{ color: bold ? NAVY : '#555', fontWeight: bold ? 800 : 400, fontSize: bold ? 15 : 13 }}>
                    {label}
                  </span>
                  <span style={{ color: bold ? NAVY : '#333', fontWeight: bold ? 800 : 500, fontSize: bold ? 15 : 13 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <GoldLine />

          {/* Deposit Section */}
          <div style={{
            background: '#f8f6f1', borderRadius: 8, padding: '16px 20px', marginBottom: 24
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Payment Schedule
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#555', fontSize: 13 }}>Deposit Required ({depositPct}%)</span>
              <span style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{fmtMoney(depositAmt)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#555', fontSize: 13 }}>Deposit Status</span>
              <span style={{ fontWeight: 700, color: invoice.deposit_paid ? '#059669' : '#d97706', fontSize: 13 }}>
                {invoice.deposit_paid ? '✓ Received' : 'Pending'}
              </span>
            </div>
            <div style={{ height: 1, background: '#e5e0d8', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#333', fontWeight: 700, fontSize: 14 }}>Balance Due on Completion</span>
              <span style={{ fontWeight: 800, color: NAVY, fontSize: 14 }}>{fmtMoney(balanceDue)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Notes
              </div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                {invoice.notes}
              </div>
            </div>
          )}

          <GoldLine />

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: 12, color: '#999', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, color: NAVY, marginBottom: 2 }}>Thank you for choosing {COMPANY.name}</div>
            <div>{COMPANY.phone}  ·  {COMPANY.email}  ·  {COMPANY.website}</div>
            <div style={{ marginTop: 4 }}>Payment due within 30 days. Please reference invoice number {invoiceNum} with your payment.</div>
          </div>
        </div>
      </div>
    </>
  )
}

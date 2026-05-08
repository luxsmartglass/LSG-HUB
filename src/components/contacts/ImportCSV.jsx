import { useState, useRef, useCallback } from 'react'
import { useToast } from '../ui/Toast'

const NAVY = '#1c2b4a'
const GOLD = '#c9a84c'
const CREAM = '#f4f1eb'

// Map common CSV header variations to our contact field keys
const FIELD_MAP = {
  name:    ['name', 'full name', 'fullname', 'contact name', 'first name + last name'],
  email:   ['email', 'email address', 'e-mail'],
  phone:   ['phone', 'phone number', 'mobile', 'cell', 'telephone'],
  company: ['company', 'organization', 'organisation', 'business', 'account'],
  role:    ['role', 'title', 'job title', 'position', 'job'],
  notes:   ['notes', 'note', 'comments', 'description'],
  tags:    ['tags', 'tag', 'labels'],
  source:  ['source', 'lead source'],
}

function detectColumn(header) {
  const h = header.toLowerCase().trim()
  for (const [field, variants] of Object.entries(FIELD_MAP)) {
    if (variants.some(v => h === v || h.includes(v))) return field
  }
  return null
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }

  const parseRow = (line) => {
    const result = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    result.push(cur.trim())
    return result
  }

  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(parseRow)
  return { headers, rows }
}

export default function ImportCSV({ onImport, onClose }) {
  const addToast = useToast()
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [parsed, setParsed] = useState(null) // { headers, rows }
  const [mapping, setMapping] = useState({}) // csvIndex → field key
  const [importing, setImporting] = useState(false)

  const processFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      addToast('Please upload a .csv file', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target.result)
      if (!headers.length) {
        addToast('Could not parse CSV', 'error')
        return
      }
      // Auto-detect mapping
      const autoMap = {}
      headers.forEach((h, i) => {
        const field = detectColumn(h)
        if (field) autoMap[i] = field
      })
      setParsed({ headers, rows })
      setMapping(autoMap)
    }
    reader.readAsText(file)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }, [])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleFileInput = (e) => {
    processFile(e.target.files[0])
  }

  const buildContacts = () => {
    if (!parsed) return []
    return parsed.rows
      .filter(row => row.some(cell => cell))
      .map(row => {
        const contact = { source: 'CSV Import', tags: [] }
        Object.entries(mapping).forEach(([idx, field]) => {
          const val = row[parseInt(idx)] || ''
          if (field === 'tags') {
            contact.tags = val.split(',').map(t => t.trim()).filter(Boolean)
          } else {
            contact[field] = val
          }
        })
        // Merge first+last name if needed
        if (!contact.name) contact.name = 'Unknown'
        return contact
      })
  }

  const contacts = parsed ? buildContacts() : []
  const preview = contacts.slice(0, 5)

  const handleImport = async () => {
    if (!contacts.length) return
    setImporting(true)
    await onImport(contacts)
    setImporting(false)
  }

  const FIELD_OPTIONS = ['', 'name', 'email', 'phone', 'company', 'role', 'notes', 'tags', 'source', '(skip)']

  return (
    /* Overlay */
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* Modal */}
      <div style={{
        background: '#162238', borderRadius: 12, width: '90%', maxWidth: 700,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(201,168,76,0.2)'
      }}>
        {/* Modal Header */}
        <div style={{
          background: NAVY, padding: '20px 28px', borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `2px solid rgba(201,168,76,0.3)`
        }}>
          <h2 style={{ margin: 0, color: CREAM, fontSize: 18, fontWeight: 700 }}>
            Import Contacts from CSV
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: CREAM,
              width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
              fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 28 }}>
          {/* Drop zone */}
          {!parsed && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? GOLD : 'rgba(201,168,76,0.35)'}`,
                borderRadius: 10, padding: '48px 24px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                background: dragging ? 'rgba(201,168,76,0.06)' : 'transparent'
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <div style={{ color: CREAM, fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                Drag & drop your CSV file here
              </div>
              <div style={{ color: 'rgba(244,241,235,0.5)', fontSize: 13 }}>
                or click to browse
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Column mapping */}
          {parsed && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: CREAM, fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                  Column Mapping ({parsed.rows.length} rows detected)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {parsed.headers.map((header, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 14px'
                    }}>
                      <span style={{ color: 'rgba(244,241,235,0.6)', fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {header}
                      </span>
                      <span style={{ color: 'rgba(244,241,235,0.3)', fontSize: 12 }}>→</span>
                      <select
                        value={mapping[i] || ''}
                        onChange={e => setMapping(prev => ({ ...prev, [i]: e.target.value }))}
                        style={{
                          background: '#1c2b4a', border: `1px solid rgba(201,168,76,0.3)`,
                          color: CREAM, borderRadius: 6, padding: '4px 8px',
                          fontSize: 13, cursor: 'pointer', flex: 1
                        }}
                      >
                        {FIELD_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt || '(unmapped)'}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              {preview.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ color: CREAM, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
                    Preview (first {preview.length} rows)
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.3)' }}>
                          {['Name', 'Email', 'Phone', 'Company', 'Role'].map(h => (
                            <th key={h} style={{
                              padding: '8px 12px', textAlign: 'left',
                              color: GOLD, fontSize: 11, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.06em'
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['name', 'email', 'phone', 'company', 'role'].map(field => (
                              <td key={field} style={{ padding: '8px 12px', color: 'rgba(244,241,235,0.8)' }}>
                                {c[field] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setParsed(null); setMapping({}) }}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                    color: CREAM, borderRadius: 8, padding: '10px 20px',
                    cursor: 'pointer', fontSize: 14
                  }}
                >
                  Choose Different File
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || contacts.length === 0}
                  style={{
                    background: importing ? 'rgba(201,168,76,0.5)' : GOLD,
                    color: NAVY, border: 'none', borderRadius: 8,
                    padding: '10px 28px', cursor: importing ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontWeight: 700
                  }}
                >
                  {importing ? 'Importing…' : `Import ${contacts.length} Contact${contacts.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useCallback } from 'react'
import { useToast } from '../ui/Toast'
import { useTheme } from '../../theme/useTheme'
import { useIsNarrow } from '../../hooks/useMediaQuery'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

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

const FIELD_OPTIONS = ['', 'name', 'email', 'phone', 'company', 'role', 'notes', 'tags', 'source', '(skip)']

export default function ImportCSV({ onImport, onClose }) {
  const { c } = useTheme()
  const isNarrow = useIsNarrow()
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

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Import Contacts from CSV"
      size="lg"
      footer={
        parsed ? (
          <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              onClick={() => { setParsed(null); setMapping({}) }}
            >
              Choose Different File
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              loading={importing}
              disabled={importing || contacts.length === 0}
            >
              {importing ? 'Importing…' : `Import ${contacts.length} Contact${contacts.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        ) : null
      }
    >
      {/* Drop zone */}
      {!parsed && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? c.accent : c.border}`,
            borderRadius: c.radius.lg, padding: '48px 24px', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            background: dragging ? c.accentSoft : 'transparent',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ color: c.textPrimary, fontSize: c.text.md, fontWeight: c.weight.button, marginBottom: 6 }}>
            Drag &amp; drop your CSV file here
          </div>
          <div style={{ color: c.textMuted, fontSize: c.text.base }}>
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
            <div style={{ color: c.textPrimary, fontSize: c.text.md, fontWeight: c.weight.button, marginBottom: 12 }}>
              Column Mapping ({parsed.rows.length} rows detected)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 10 }}>
              {parsed.headers.map((header, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: c.surfaceHover, borderRadius: c.radius.md, padding: '10px 14px',
                }}>
                  <span style={{
                    color: c.textSecondary, fontSize: c.text.base, flex: 1,
                    minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {header}
                  </span>
                  <span style={{ color: c.textMuted, fontSize: c.text.sm }}>→</span>
                  <select
                    value={mapping[i] || ''}
                    onChange={e => setMapping(prev => ({ ...prev, [i]: e.target.value }))}
                    style={{
                      background: c.surface, border: `1px solid ${c.border}`,
                      color: c.textPrimary, borderRadius: c.radius.sm, padding: '4px 8px',
                      fontSize: c.text.base, cursor: 'pointer', flex: 1,
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
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: c.textPrimary, fontSize: c.text.base, fontWeight: c.weight.button, marginBottom: 10 }}>
                Preview (first {preview.length} rows)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: c.text.sm }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                      {['Name', 'Email', 'Phone', 'Company', 'Role'].map(h => (
                        <th key={h} style={{
                          padding: '8px 12px', textAlign: 'left',
                          color: c.accent, fontSize: c.text.xs, fontWeight: c.weight.label,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((ct, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${c.border}` }}>
                        {['name', 'email', 'phone', 'company', 'role'].map(field => (
                          <td key={field} style={{ padding: '8px 12px', color: c.textSecondary }}>
                            {ct[field] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

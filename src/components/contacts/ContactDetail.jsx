import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

const NAVY = '#1c2b4a'
const GOLD = '#c9a84c'
const CREAM = '#f4f1eb'

function EditableField({ label, value, fieldKey, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  const commit = () => {
    setEditing(false)
    if (draft !== (value || '')) onSave(fieldKey, draft)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: GOLD,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4
      }}>
        {label}
      </div>
      {editing ? (
        type === 'textarea' ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${GOLD}`, borderRadius: 6,
              padding: '8px 10px', color: CREAM, fontSize: 14,
              outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        ) : (
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit() }}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${GOLD}`, borderRadius: 6,
              padding: '8px 10px', color: CREAM, fontSize: 14,
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
            }}
          />
        )
      ) : (
        <div
          onClick={() => { setDraft(value || ''); setEditing(true) }}
          style={{
            color: value ? CREAM : 'rgba(244,241,235,0.35)',
            fontSize: 14, cursor: 'text', padding: '6px 8px',
            borderRadius: 6, border: '1px solid transparent',
            minHeight: 34, display: 'flex', alignItems: 'center',
            transition: 'border-color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
        >
          {value || 'Click to edit…'}
        </div>
      )}
    </div>
  )
}

export default function ContactDetail({ contact, onClose, onUpdate }) {
  const addToast = useToast()
  const [estimates, setEstimates] = useState([])
  const [activity, setActivity] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!contact) return

    supabase
      .from('estimates')
      .select('id, total_revenue, status, created_at')
      .ilike('client_name', `%${contact.name}%`)
      .then(({ data }) => setEstimates(data || []))

    supabase
      .from('activity_log')
      .select('*')
      .eq('entity_id', contact.id)
      .eq('entity_type', 'contact')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setActivity(data || []))
  }, [contact])

  const handleSave = async (field, value) => {
    setSaving(true)
    const { data, error } = await supabase
      .from('contacts')
      .update({ [field]: value })
      .eq('id', contact.id)
      .select()
      .single()
    setSaving(false)
    if (error) {
      addToast('Save failed: ' + error.message, 'error')
    } else {
      onUpdate(data)
      addToast('Contact updated')
    }
  }

  const handleTagsSave = async (_, rawValue) => {
    const tags = rawValue.split(',').map(t => t.trim()).filter(Boolean)
    await handleSave('tags', tags)
  }

  const handleAddToPipeline = async () => {
    const { error } = await supabase.from('pipeline').insert({
      client_name: contact.name,
      stage: 'New Lead',
      source: contact.source || '',
      notes: contact.company ? `Company: ${contact.company}` : '',
    })
    if (error) {
      addToast('Failed to add to pipeline: ' + error.message, 'error')
    } else {
      addToast('Added to pipeline!')
    }
  }

  const tags = Array.isArray(contact.tags)
    ? contact.tags
    : typeof contact.tags === 'string' && contact.tags
      ? contact.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 900
        }}
      />

      {/* Slide-in panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0,
        height: '100%', width: 420,
        background: '#162238', zIndex: 901,
        overflowY: 'auto',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        {/* Header */}
        <div style={{
          background: NAVY, padding: '20px 24px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `2px solid rgba(201,168,76,0.3)`
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: CREAM }}>
              {contact.name}
            </div>
            {contact.company && (
              <div style={{ fontSize: 13, color: GOLD, marginTop: 2 }}>
                {contact.company}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: CREAM,
              width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
              fontSize: 20, lineHeight: 1, display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Quick Actions */}
        <div style={{
          padding: '14px 24px', display: 'flex', gap: 8, flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <a
            href={`mailto:${contact.email || ''}`}
            style={{
              flex: 1, background: NAVY, border: `1px solid ${GOLD}`, color: GOLD,
              borderRadius: 8, padding: '8px 0', textAlign: 'center',
              fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'block'
            }}
          >
            ✉ Send Email
          </a>
          <button
            onClick={handleAddToPipeline}
            style={{
              flex: 1, background: GOLD, color: NAVY, border: 'none',
              borderRadius: 8, padding: '8px 0', cursor: 'pointer',
              fontSize: 13, fontWeight: 700
            }}
          >
            + Add to Pipeline
          </button>
        </div>

        {/* Editable Fields */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          {saving && (
            <div style={{ color: GOLD, fontSize: 12, marginBottom: 8 }}>Saving…</div>
          )}

          <EditableField label="Full Name"  value={contact.name}    fieldKey="name"    onSave={handleSave} />
          <EditableField label="Email"      value={contact.email}   fieldKey="email"   onSave={handleSave} type="email" />
          <EditableField label="Phone"      value={contact.phone}   fieldKey="phone"   onSave={handleSave} type="tel" />
          <EditableField label="Company"    value={contact.company} fieldKey="company" onSave={handleSave} />
          <EditableField label="Role"       value={contact.role}    fieldKey="role"    onSave={handleSave} />
          <EditableField label="Source"     value={contact.source}  fieldKey="source"  onSave={handleSave} />
          <EditableField
            label="Tags (comma-separated)"
            value={tags.join(', ')}
            fieldKey="tags"
            onSave={handleTagsSave}
          />
          <EditableField label="Notes" value={contact.notes} fieldKey="notes" onSave={handleSave} type="textarea" />

          {/* Linked Estimates */}
          <div style={{ marginTop: 28 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: GOLD,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12
            }}>
              Linked Estimates
            </div>
            {estimates.length === 0 ? (
              <div style={{ color: 'rgba(244,241,235,0.35)', fontSize: 13 }}>
                No linked estimates found
              </div>
            ) : estimates.map(est => (
              <div key={est.id} style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: 8,
                padding: '10px 14px', marginBottom: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ color: CREAM, fontSize: 13, fontWeight: 600 }}>
                  EST-{String(est.id).slice(0, 6).toUpperCase()}
                </span>
                <span style={{ color: 'rgba(244,241,235,0.6)', fontSize: 13 }}>
                  ${(est.total_revenue || 0).toLocaleString()}
                </span>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                  background: est.status === 'Approved' ? '#065f46' : '#374151',
                  color: est.status === 'Approved' ? '#a7f3d0' : '#d1d5db'
                }}>
                  {est.status}
                </span>
              </div>
            ))}
          </div>

          {/* Activity Timeline */}
          <div style={{ marginTop: 28, marginBottom: 24 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: GOLD,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12
            }}>
              Activity Timeline
            </div>
            {activity.length === 0 ? (
              <div style={{ color: 'rgba(244,241,235,0.35)', fontSize: 13 }}>
                No activity recorded
              </div>
            ) : (
              <div style={{ borderLeft: `2px solid rgba(201,168,76,0.25)`, paddingLeft: 16 }}>
                {activity.map(item => (
                  <div key={item.id} style={{ marginBottom: 16, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: -21, top: 5,
                      width: 8, height: 8, borderRadius: '50%', background: GOLD
                    }} />
                    <div style={{ fontSize: 11, color: 'rgba(244,241,235,0.4)', marginBottom: 3 }}>
                      {new Date(item.created_at).toLocaleDateString('en-CA', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </div>
                    <div style={{ fontSize: 13, color: CREAM }}>
                      {item.description || item.action || 'Activity recorded'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

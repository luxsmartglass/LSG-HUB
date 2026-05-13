import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PIPELINE_STAGES } from '../../lib/pricingDatabase'
import { useToast } from '../ui/Toast'
import { useTheme } from '../../theme/useTheme'
import { Field, Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import { useIsMobile } from '../../hooks/useMediaQuery'

// Inline-editable field for edit mode
function EditableField({ label, value, fieldKey, onSave, type = 'text', c }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  const commit = () => {
    setEditing(false)
    if (draft !== (value || '')) onSave(fieldKey, draft)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: c.text.xs, fontWeight: c.weight.label, color: c.accent,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
      }}>
        {label}
      </div>
      {editing ? (
        type === 'textarea' ? (
          <Textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            rows={3}
          />
        ) : (
          <Input
            autoFocus
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit() }}
          />
        )
      ) : (
        <div
          onClick={() => { setDraft(value || ''); setEditing(true) }}
          style={{
            color: value ? c.textPrimary : c.textMuted,
            fontSize: c.text.base, cursor: 'text', padding: '6px 8px',
            borderRadius: c.radius.md, border: `1px solid transparent`,
            minHeight: 34, display: 'flex', alignItems: 'center',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = c.border }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
        >
          {value || 'Click to edit…'}
        </div>
      )}
    </div>
  )
}

export default function ContactDetail({ contact, mode = 'edit', onClose, onUpdate, onCreate }) {
  const { c } = useTheme()
  const addToast = useToast()
  const isMobile = useIsMobile()

  // Derive isCreate from mode prop or absence of id
  const isCreate = mode === 'create' || !contact?.id

  // Create-mode form state
  const [form, setForm] = useState({
    name: '', company: '', role: '', email: '', phone: '', source: '', tags: '',
  })
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit-mode state
  const [estimates, setEstimates] = useState([])
  const [activity, setActivity] = useState([])
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    if (isCreate || !contact) return

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
      .then(({ data, error }) => { if (!error) setActivity(data || []) })
  }, [contact, isCreate])

  // Edit-mode save
  const handleSave = async (field, value) => {
    setEditSaving(true)
    const { data, error } = await supabase
      .from('contacts')
      .update({ [field]: value })
      .eq('id', contact.id)
      .select()
    setEditSaving(false)
    if (error) {
      addToast('Save failed: ' + error.message, 'error')
    } else {
      const updated = data?.[0]
      if (updated) onUpdate(updated)
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
      stage: PIPELINE_STAGES[0].id,
      source: contact.source || '',
      notes: contact.company ? `Company: ${contact.company}` : '',
    })
    if (error) {
      addToast('Failed to add to pipeline: ' + error.message, 'error')
    } else {
      addToast('Added to pipeline!')
    }
  }

  // Create-mode submit
  const handleCreate = async () => {
    if (!form.name.trim()) {
      setNameError('Name is required')
      return
    }
    setNameError('')
    setSaving(true)
    // Parse tags from comma-separated string
    const record = { ...form }
    record.tags = form.tags
      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []
    await onCreate(record)
    setSaving(false)
  }

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  // Panel header title
  const panelTitle = isCreate
    ? 'New Contact'
    : (contact?.name || 'Contact')

  const panelSubtitle = isCreate
    ? null
    : contact?.company || null

  // Edit-mode tags display
  const editTags = !isCreate && contact ? (
    Array.isArray(contact.tags)
      ? contact.tags
      : typeof contact.tags === 'string' && contact.tags
        ? contact.tags.split(',').map(t => t.trim()).filter(Boolean)
        : []
  ) : []

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: c.overlay, zIndex: 900,
        }}
      />

      {/* Slide-in panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0,
        height: '100%', width: isMobile ? '100%' : 420,
        background: c.surfaceElevated, zIndex: 901,
        overflowY: 'auto',
        boxShadow: c.shadowLg,
        display: 'flex', flexDirection: 'column',
        fontFamily: c.font.body,
      }}>
        {/* Header */}
        <div style={{
          background: c.surface, padding: '20px 24px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `2px solid ${c.border}`,
        }}>
          <div>
            <div style={{ fontSize: c.text.lg, fontWeight: c.weight.strong, color: c.textPrimary, fontFamily: c.font.heading }}>
              {panelTitle}
            </div>
            {panelSubtitle && (
              <div style={{ fontSize: c.text.sm, color: c.accent, marginTop: 2 }}>
                {panelSubtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: c.surfaceHover, border: 'none', color: c.textPrimary,
              width: 32, height: 32, borderRadius: c.radius.md, cursor: 'pointer',
              fontSize: 20, lineHeight: 1, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Create mode: form fields */}
        {isCreate ? (
          <div style={{ padding: isMobile ? '16px' : '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Full Name *" error={nameError}>
              <Input
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={setField('name')}
                autoFocus
                error={!!nameError}
              />
            </Field>
            <Field label="Company">
              <Input
                type="text"
                placeholder="Acme Corp"
                value={form.company}
                onChange={setField('company')}
              />
            </Field>
            <Field label="Role">
              <Input
                type="text"
                placeholder="CEO"
                value={form.role}
                onChange={setField('role')}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={setField('email')}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                placeholder="+1 555 000 0000"
                value={form.phone}
                onChange={setField('phone')}
              />
            </Field>
            <Field label="Source">
              <Input
                type="text"
                placeholder="Manual, Referral, Apollo…"
                value={form.source}
                onChange={setField('source')}
              />
            </Field>
            <Field label="Tags" hint="Comma-separated, e.g. vip, prospect">
              <Input
                type="text"
                placeholder="vip, prospect, hot-lead"
                value={form.tags}
                onChange={setField('tags')}
              />
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Button variant="ghost" onClick={onClose} fullWidth>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate} loading={saving} fullWidth>
                Create
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Edit mode: quick actions */}
            <div style={{
              padding: '14px 24px', display: 'flex', gap: 8, flexShrink: 0,
              borderBottom: `1px solid ${c.border}`,
            }}>
              <a
                href={`mailto:${contact?.email || ''}`}
                style={{
                  flex: 1, background: c.surface, border: `1px solid ${c.accent}`, color: c.accent,
                  borderRadius: c.radius.md, padding: '8px 0', textAlign: 'center',
                  fontSize: c.text.sm, fontWeight: c.weight.button, textDecoration: 'none',
                  display: 'block',
                }}
              >
                ✉ Send Email
              </a>
              <button
                onClick={handleAddToPipeline}
                style={{
                  flex: 1, background: c.accent, color: c.accentText, border: 'none',
                  borderRadius: c.radius.md, padding: '8px 0', cursor: 'pointer',
                  fontSize: c.text.sm, fontWeight: c.weight.button,
                }}
              >
                + Add to Pipeline
              </button>
            </div>

            {/* Edit mode: editable fields */}
            <div style={{ padding: isMobile ? '16px' : '20px 24px', flex: 1 }}>
              {editSaving && (
                <div style={{ color: c.accent, fontSize: c.text.sm, marginBottom: 8 }}>Saving…</div>
              )}

              <EditableField label="Full Name"  value={contact?.name}    fieldKey="name"    onSave={handleSave} c={c} />
              <EditableField label="Email"      value={contact?.email}   fieldKey="email"   onSave={handleSave} type="email" c={c} />
              <EditableField label="Phone"      value={contact?.phone}   fieldKey="phone"   onSave={handleSave} type="tel" c={c} />
              <EditableField label="Company"    value={contact?.company} fieldKey="company" onSave={handleSave} c={c} />
              <EditableField label="Role"       value={contact?.role}    fieldKey="role"    onSave={handleSave} c={c} />
              <EditableField label="Source"     value={contact?.source}  fieldKey="source"  onSave={handleSave} c={c} />
              <EditableField
                label="Tags (comma-separated)"
                value={editTags.join(', ')}
                fieldKey="tags"
                onSave={handleTagsSave}
                c={c}
              />
              <EditableField label="Notes" value={contact?.notes} fieldKey="notes" onSave={handleSave} type="textarea" c={c} />

              {/* Linked Estimates */}
              <div style={{ marginTop: 28 }}>
                <div style={{
                  fontSize: c.text.sm, fontWeight: c.weight.label, color: c.accent,
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
                }}>
                  Linked Estimates
                </div>
                {estimates.length === 0 ? (
                  <div style={{ color: c.textMuted, fontSize: c.text.base }}>
                    No linked estimates found
                  </div>
                ) : estimates.map(est => (
                  <div key={est.id} style={{
                    background: c.surfaceHover, borderRadius: c.radius.md,
                    padding: '10px 14px', marginBottom: 8,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ color: c.textPrimary, fontSize: c.text.base, fontWeight: c.weight.button }}>
                      EST-{String(est.id).slice(0, 6).toUpperCase()}
                    </span>
                    <span style={{ color: c.textSecondary, fontSize: c.text.base }}>
                      ${(est.total_revenue || 0).toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: c.text.xs, padding: '2px 8px', borderRadius: c.radius.pill,
                      fontWeight: c.weight.button,
                      background: est.status === 'Approved' ? c.successSoft : c.surfaceHover,
                      color: est.status === 'Approved' ? c.success : c.textMuted,
                    }}>
                      {est.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Activity Timeline */}
              <div style={{ marginTop: 28, marginBottom: 24 }}>
                <div style={{
                  fontSize: c.text.sm, fontWeight: c.weight.label, color: c.accent,
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
                }}>
                  Activity Timeline
                </div>
                {activity.length === 0 ? (
                  <div style={{ color: c.textMuted, fontSize: c.text.base }}>
                    No activity recorded
                  </div>
                ) : (
                  <div style={{ borderLeft: `2px solid ${c.border}`, paddingLeft: 16 }}>
                    {activity.map(item => (
                      <div key={item.id} style={{ marginBottom: 16, position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: -21, top: 5,
                          width: 8, height: 8, borderRadius: '50%', background: c.accent,
                        }} />
                        <div style={{ fontSize: c.text.xs, color: c.textMuted, marginBottom: 3 }}>
                          {new Date(item.created_at).toLocaleDateString('en-CA', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </div>
                        <div style={{ fontSize: c.text.base, color: c.textPrimary }}>
                          {item.description || item.action || 'Activity recorded'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

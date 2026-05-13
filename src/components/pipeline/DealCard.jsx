import { useState, useRef, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';
import { PIPELINE_STAGES } from '../../lib/pricingDatabase';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../theme/useTheme';


function formatValue(val) {
  const n = parseFloat(val) || 0;
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' CAD';
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function getStageMeta(stageId) {
  return PIPELINE_STAGES.find(s => s.id === stageId) || PIPELINE_STAGES[0];
}

export default function DealCard({ deal, index, onRefresh, onDelete }) {
  const addToast = useToast();
  const { c } = useTheme();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    client_name: deal.client_name || '',
    quote_value: deal.quote_value || '',
    notes: deal.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const popoverRef = useRef(null);
  const stage = getStageMeta(deal.stage);

  useEffect(() => {
    if (!editing) return;
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setEditing(false);
        setForm({ client_name: deal.client_name || '', quote_value: deal.quote_value || '', notes: deal.notes || '' });
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editing, deal]);

  function handleDelete(e) {
    e.stopPropagation();
    setEditing(false);
    if (onDelete) {
      onDelete(deal);
      return;
    }
    // Fallback: immediate delete if no onDelete prop
    supabase.from('pipeline').delete().eq('id', deal.id).then(({ error }) => {
      if (error) addToast('Failed to delete deal: ' + error.message, 'error');
      else if (onRefresh) onRefresh();
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('pipeline')
      .update({
        client_name: form.client_name,
        quote_value: parseFloat(form.quote_value) || 0,
        notes: form.notes,
      })
      .eq('id', deal.id);
    setSaving(false);
    if (error) {
      addToast('Failed to save: ' + error.message, 'error');
    } else {
      addToast('Deal updated');
      setEditing(false);
      if (onRefresh) onRefresh();
    }
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '7px 9px',
    fontSize: c.text.sm,
    border: '1px solid ' + c.border,
    borderRadius: c.radius.sm,
    marginBottom: 8,
    outline: 'none',
    color: c.textPrimary,
    background: c.surfaceHover,
    fontFamily: c.font.body,
  };

  const labelStyle = {
    display: 'block',
    fontSize: c.text.xs,
    fontWeight: c.weight.label,
    color: c.accent,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 3,
    fontFamily: c.font.body,
  };

  const cardStyle = {
    background: c.surface,
    borderRadius: c.radius.md,
    padding: '12px 14px',
    boxShadow: c.shadowSm,
    marginBottom: 8,
    position: 'relative',
    userSelect: 'none',
    border: '1px solid ' + c.border,
    transition: 'box-shadow 0.15s, border-color 0.15s',
  };

  const draggingStyle = {
    boxShadow: c.shadowLg,
    border: '1.5px solid ' + c.accent,
  };

  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...cardStyle,
            ...(snapshot.isDragging ? draggingStyle : {}),
            ...provided.draggableProps.style,
          }}
          onMouseEnter={e => { if (!snapshot.isDragging) e.currentTarget.style.boxShadow = c.shadowMd; }}
          onMouseLeave={e => { if (!snapshot.isDragging) e.currentTarget.style.boxShadow = c.shadowSm; }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: c.weight.strong, fontSize: c.text.base, color: c.textPrimary,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontFamily: c.font.body,
              }}>
                {deal.client_name || 'Unnamed Client'}
              </div>
              <div style={{ fontSize: c.text.sm, color: c.accent, marginTop: 2, opacity: 0.85 }}>
                {formatValue(deal.quote_value)}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setEditing(v => !v); }}
              title="Edit deal"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 4px', borderRadius: c.radius.sm,
                color: c.textMuted, flexShrink: 0, lineHeight: 1,
              }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          {/* Stage badge + time — stage.color/bg/border stay semantic */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 9, flexWrap: 'wrap', gap: 4 }}>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: c.radius.pill,
              fontSize: c.text.xs, fontWeight: c.weight.button,
              background: stage.bg, color: stage.color, border: `1px solid ${stage.border}`,
              whiteSpace: 'nowrap',
            }}>
              {stage.label}
            </span>
            <span style={{ fontSize: c.text.xs, color: c.textMuted }}>
              {relativeTime(deal.created_at)}
            </span>
          </div>

          {/* Notes preview */}
          {deal.notes && (
            <div style={{
              marginTop: 8, fontSize: c.text.sm,
              color: c.textMuted,
              background: c.surfaceHover,
              borderRadius: c.radius.sm, padding: '4px 8px',
              maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {deal.notes}
            </div>
          )}

          {/* Edit popover */}
          {editing && (
            <div
              ref={popoverRef}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                background: c.surfaceElevated,
                borderRadius: c.radius.md,
                boxShadow: c.shadowLg,
                border: '2px solid ' + c.accent,
                padding: '14px 16px',
                zIndex: 100,
              }}
            >
              <div style={{ fontWeight: c.weight.strong, fontSize: 13, color: c.textPrimary, marginBottom: 10 }}>Edit Deal</div>
              <form onSubmit={handleSave}>
                <label style={labelStyle}>Client Name</label>
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} style={inputStyle} />
                <label style={labelStyle}>Value (CAD)</label>
                <input type="number" min="0" step="0.01" value={form.quote_value} onChange={e => setForm(f => ({ ...f, quote_value: e.target.value }))} style={inputStyle} />
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleDelete}
                    title="Delete deal"
                    style={{ padding: '5px 10px', fontSize: c.text.sm, borderRadius: c.radius.sm, border: '1px solid ' + c.danger + '88', background: 'transparent', color: c.danger, cursor: 'pointer' }}
                  >Delete</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => { setEditing(false); setForm({ client_name: deal.client_name || '', quote_value: deal.quote_value || '', notes: deal.notes || '' }); }}
                      style={{ padding: '5px 12px', fontSize: c.text.sm, borderRadius: c.radius.sm, border: '1px solid ' + c.border, background: 'transparent', color: c.textSecondary, cursor: 'pointer' }}
                    >Cancel</button>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{ padding: '5px 14px', fontSize: c.text.sm, fontWeight: c.weight.button, borderRadius: c.radius.sm, border: 'none', background: c.accent, color: c.accentText, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                    >{saving ? 'Saving…' : 'Save'}</button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

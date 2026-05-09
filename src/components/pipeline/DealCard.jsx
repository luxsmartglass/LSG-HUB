import { useState, useRef, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';
import { PIPELINE_STAGES } from '../../lib/pricingDatabase';
import { useToast } from '../ui/Toast';

const GOLD = '#c9a84c';
const CREAM = '#f4f1eb';
const NAVY = '#1c2b4a';

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

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '7px 9px',
  fontSize: 12.5,
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6,
  marginBottom: 8,
  outline: 'none',
  color: CREAM,
  background: 'rgba(255,255,255,0.07)',
  fontFamily: "'DM Sans', sans-serif",
};

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 700,
  color: GOLD,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 3,
  fontFamily: "'DM Sans', sans-serif",
};

export default function DealCard({ deal, index, onRefresh }) {
  const addToast = useToast();
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

  const cardStyle = {
    background: '#162238',
    borderRadius: 8,
    padding: '12px 14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    marginBottom: 8,
    position: 'relative',
    userSelect: 'none',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'box-shadow 0.15s, border-color 0.15s',
  };

  const draggingStyle = {
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: `1.5px solid ${GOLD}`,
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
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: 13.5, color: CREAM,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {deal.client_name || 'Unnamed Client'}
              </div>
              <div style={{ fontSize: 12.5, color: GOLD, marginTop: 2, fontFamily: "'DM Sans', sans-serif", opacity: 0.85 }}>
                {formatValue(deal.quote_value)}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setEditing(v => !v); }}
              title="Edit deal"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 4px', borderRadius: 4,
                color: 'rgba(244,241,235,0.35)', flexShrink: 0, lineHeight: 1,
              }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          {/* Stage badge + time */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 9, flexWrap: 'wrap', gap: 4 }}>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: 999,
              fontSize: 10.5, fontWeight: 700,
              background: stage.bg, color: stage.color, border: `1px solid ${stage.border}`,
              fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
            }}>
              {stage.label}
            </span>
            <span style={{ fontSize: 10.5, color: 'rgba(244,241,235,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
              {relativeTime(deal.created_at)}
            </span>
          </div>

          {/* Notes preview */}
          {deal.notes && (
            <div style={{
              marginTop: 8, fontSize: 11.5,
              color: 'rgba(244,241,235,0.5)',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 4, padding: '4px 8px',
              fontFamily: "'DM Sans', sans-serif",
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
                background: '#0f1d35',
                borderRadius: 8,
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                border: `2px solid ${GOLD}`,
                padding: '14px 16px',
                zIndex: 100,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: CREAM, marginBottom: 10 }}>Edit Deal</div>
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
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setForm({ client_name: deal.client_name || '', quote_value: deal.quote_value || '', notes: deal.notes || '' }); }}
                    style={{ padding: '5px 12px', fontSize: 12, borderRadius: 5, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(244,241,235,0.6)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >Cancel</button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: '5px 14px', fontSize: 12, fontWeight: 700, borderRadius: 5, border: 'none', background: GOLD, color: NAVY, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif" }}
                  >{saving ? 'Saving…' : 'Save'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

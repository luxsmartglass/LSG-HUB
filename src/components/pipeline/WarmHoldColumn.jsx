import { Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../theme/useTheme';
import { useState } from 'react';

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function formatValue(val) {
  const n = parseFloat(val) || 0;
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' CAD';
}

function FollowUpBadge({ days, c }) {
  if (days > 60) {
    return (
      <span style={{
        fontSize: c.text.xs, fontWeight: c.weight.button, padding: '2px 7px', borderRadius: c.radius.pill,
        background: c.dangerSoft, color: c.danger, border: '1px solid ' + c.danger + '44',
      }}>
        Overdue
      </span>
    );
  }
  if (days >= 30) {
    return (
      <span style={{
        fontSize: c.text.xs, fontWeight: c.weight.button, padding: '2px 7px', borderRadius: c.radius.pill,
        background: c.warningSoft, color: c.warning, border: '1px solid ' + c.warning + '44',
      }}>
        Due soon
      </span>
    );
  }
  return (
    <span style={{
      fontSize: c.text.xs, fontWeight: c.weight.button, padding: '2px 7px', borderRadius: c.radius.pill,
      background: c.successSoft, color: c.success, border: '1px solid ' + c.success + '44',
    }}>
      Recent
    </span>
  );
}

function WarmCard({ deal, index, onRefresh, onDelete }) {
  const addToast = useToast();
  const { c } = useTheme();
  const days = daysSince(deal.created_at);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    client_name: deal.client_name || '',
    quote_value: deal.quote_value || '',
    notes: deal.notes || '',
  });
  const [saving, setSaving] = useState(false);

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
      addToast('Contact updated');
      setEditing(false);
      if (onRefresh) onRefresh();
    }
  }

  function handleDelete(e) {
    e.stopPropagation();
    setEditing(false);
    if (onDelete) onDelete(deal);
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
  };

  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            background: c.surface,
            borderRadius: c.radius.md,
            padding: '11px 13px',
            marginBottom: 8,
            boxShadow: snapshot.isDragging ? c.shadowLg : c.shadowSm,
            border: snapshot.isDragging
              ? '1.5px solid ' + c.accent
              : '1px solid ' + c.border,
            position: 'relative',
            userSelect: 'none',
            transition: 'box-shadow 0.15s, border-color 0.15s',
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: c.weight.strong, fontSize: c.text.base, color: c.textPrimary,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {deal.client_name || 'Unnamed Contact'}
              </div>
              {deal.quote_value > 0 && (
                <div style={{ fontSize: c.text.sm, color: c.accent, marginTop: 1, opacity: 0.85 }}>
                  {formatValue(deal.quote_value)}
                </div>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); setEditing(v => !v); }}
              title="Edit contact"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 4px', borderRadius: c.radius.sm,
                color: c.textMuted, flexShrink: 0,
              }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 4 }}>
            <FollowUpBadge days={days} c={c} />
            <span style={{ fontSize: c.text.xs, color: c.textMuted }}>
              {days === 0 ? 'Added today' : `${days}d ago`}
            </span>
          </div>

          {deal.notes && (
            <div style={{
              marginTop: 7, fontSize: c.text.xs,
              color: c.textMuted,
              background: c.accentSoft,
              borderRadius: c.radius.sm, padding: '3px 7px',
              overflow: 'hidden', maxHeight: 36,
            }}>
              {deal.notes}
            </div>
          )}

          {editing && (
            <div
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
              <div style={{ fontWeight: c.weight.strong, fontSize: 13, color: c.textPrimary, marginBottom: 10 }}>Edit Contact</div>
              <form onSubmit={handleSave}>
                <label style={labelStyle}>Name</label>
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} style={inputStyle} />
                <label style={labelStyle}>Est. Value (CAD)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.quote_value}
                  onChange={e => setForm(f => ({ ...f, quote_value: e.target.value }))}
                  style={inputStyle}
                />
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleDelete}
                    title="Delete contact"
                    style={{
                      padding: '5px 10px', fontSize: c.text.sm, borderRadius: c.radius.sm,
                      border: '1px solid ' + c.danger + '88', background: 'transparent',
                      color: c.danger, cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => { setEditing(false); setForm({ client_name: deal.client_name || '', quote_value: deal.quote_value || '', notes: deal.notes || '' }); }}
                      style={{
                        padding: '5px 12px', fontSize: c.text.sm, borderRadius: c.radius.sm,
                        border: '1px solid ' + c.border, background: 'transparent',
                        color: c.textSecondary, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: '5px 14px', fontSize: c.text.sm, fontWeight: c.weight.button,
                        borderRadius: c.radius.sm, border: 'none', background: c.accent,
                        color: c.accentText, cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
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

export default function WarmHoldColumn({ deals = [], stage, onRefresh, onDelete, onAddContact }) {
  const { c } = useTheme();
  const totalValue = deals.reduce((sum, d) => sum + (parseFloat(d.quote_value) || 0), 0);
  const overdueCount = deals.filter(d => daysSince(d.created_at) > 60).length;

  return (
    <div style={{
      width: 260,
      minWidth: 260,
      maxWidth: 260,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: c.radius.lg,
      overflow: 'hidden',
      border: '2px solid ' + c.accent,
      boxShadow: '0 2px 16px ' + c.accentSoft,
      flexShrink: 0,
    }}>
      {/* Golden header — warm hold is intentionally styled with the accent gradient */}
      <div style={{
        background: 'linear-gradient(135deg, ' + c.accentHover + ' 0%, ' + c.accent + ' 50%, ' + c.accent + 'cc 100%)',
        padding: '14px 14px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>⏸</span>
          <span style={{
            fontWeight: c.weight.hero, fontSize: 14, color: c.accentText, letterSpacing: '0.05em',
          }}>
            WARM HOLD
          </span>
          <span style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.25)',
            borderRadius: c.radius.pill,
            padding: '1px 8px',
            fontSize: 12,
            fontWeight: c.weight.button,
            color: c.accentText,
          }}>
            {deals.length}
          </span>
        </div>
        <div style={{ fontSize: c.text.xs, color: c.accentText, opacity: 0.85, marginBottom: 6 }}>
          Architects &amp; Designers
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.18)',
          borderRadius: c.radius.sm,
          padding: '5px 9px',
          fontSize: c.text.xs,
          color: c.accentText,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <span style={{ fontSize: 13 }}>ℹ️</span>
          Follow up every 60 days
          {overdueCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              background: c.danger,
              borderRadius: c.radius.pill,
              padding: '1px 7px',
              fontSize: c.text.xs,
              fontWeight: c.weight.button,
              color: '#fff',
            }}>
              {overdueCount} overdue
            </span>
          )}
        </div>

        {totalValue > 0 && (
          <div style={{ marginTop: 6, fontSize: 12, color: c.accentText, opacity: 0.9, fontWeight: c.weight.button }}>
            ${totalValue.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CAD
          </div>
        )}
      </div>

      {/* Card list droppable */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              minHeight: 80,
              padding: '10px 10px 4px',
              background: snapshot.isDraggingOver
                ? c.accentSoft
                : c.bg,
              transition: 'background 0.15s',
              overflowY: 'auto',
              maxHeight: 480,
            }}
          >
            {deals.length === 0 && !snapshot.isDraggingOver && (
              <div style={{
                textAlign: 'center', color: c.textMuted, fontSize: c.text.sm,
                padding: '18px 0',
              }}>
                No warm contacts yet
              </div>
            )}
            {deals.map((deal, i) => (
              <WarmCard key={deal.id} deal={deal} index={i} onRefresh={onRefresh} onDelete={onDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add warm contact button */}
      <div style={{
        padding: '8px 10px',
        background: c.bg,
        borderTop: '1px solid ' + c.border,
      }}>
        <button
          onClick={onAddContact}
          style={{
            width: '100%',
            padding: '7px 0',
            borderRadius: c.radius.sm,
            border: '1.5px dashed ' + c.accent,
            background: 'transparent',
            color: c.accent,
            fontSize: c.text.sm,
            fontWeight: c.weight.button,
            cursor: 'pointer',
            fontFamily: c.font.body,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = c.accentSoft}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          + Add Warm Contact
        </button>
      </div>
    </div>
  );
}

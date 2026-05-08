import { Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { PIPELINE_STAGES } from '../../lib/pricingDatabase';
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

function FollowUpBadge({ days }) {
  if (days > 60) {
    return (
      <span style={{
        fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Overdue
      </span>
    );
  }
  if (days >= 30) {
    return (
      <span style={{
        fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
        background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Due soon
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
      background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      Recent
    </span>
  );
}

function WarmCard({ deal, index, onRefresh }) {
  const addToast = useToast();
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

  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: '11px 13px',
            marginBottom: 8,
            boxShadow: snapshot.isDragging
              ? '0 6px 24px rgba(201,168,76,0.25)'
              : '0 1px 4px rgba(0,0,0,0.08)',
            border: snapshot.isDragging ? '2px solid #c9a84c' : '1px solid #fde68a',
            position: 'relative',
            userSelect: 'none',
            transition: 'box-shadow 0.15s',
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: 13.5, color: '#1c2b4a',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {deal.client_name || 'Unnamed Contact'}
              </div>
              {deal.quote_value > 0 && (
                <div style={{ fontSize: 12, color: '#a8883c', marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>
                  {formatValue(deal.quote_value)}
                </div>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); setEditing(v => !v); }}
              title="Edit contact"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 4px', borderRadius: 4, color: '#9ca3af', flexShrink: 0,
              }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 4 }}>
            <FollowUpBadge days={days} />
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Sans', sans-serif" }}>
              {days === 0 ? 'Added today' : `${days}d ago`}
            </span>
          </div>

          {deal.notes && (
            <div style={{
              marginTop: 7, fontSize: 11, color: '#6b7280',
              background: '#fef8ec', borderRadius: 4, padding: '3px 7px',
              fontFamily: "'DM Sans', sans-serif",
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
                background: '#fff', borderRadius: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                border: '2px solid #c9a84c',
                padding: '14px 16px',
                zIndex: 100,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1c2b4a', marginBottom: 10 }}>Edit Contact</div>
              <form onSubmit={handleSave}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 2 }}>Name</label>
                <input
                  value={form.client_name}
                  onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '6px 8px',
                    fontSize: 13, border: '1px solid #d1d5db', borderRadius: 5,
                    marginBottom: 8, outline: 'none', color: '#1c2b4a',
                  }}
                />
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 2 }}>Est. Value (CAD)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.quote_value}
                  onChange={e => setForm(f => ({ ...f, quote_value: e.target.value }))}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '6px 8px',
                    fontSize: 13, border: '1px solid #d1d5db', borderRadius: 5,
                    marginBottom: 8, outline: 'none', color: '#1c2b4a',
                  }}
                />
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 2 }}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '6px 8px',
                    fontSize: 13, border: '1px solid #d1d5db', borderRadius: 5,
                    marginBottom: 10, outline: 'none', resize: 'vertical',
                    color: '#1c2b4a', fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setForm({ client_name: deal.client_name || '', quote_value: deal.quote_value || '', notes: deal.notes || '' }); }}
                    style={{
                      padding: '5px 12px', fontSize: 12, borderRadius: 5,
                      border: '1px solid #d1d5db', background: '#f9fafb',
                      color: '#6b7280', cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '5px 14px', fontSize: 12, fontWeight: 600,
                      borderRadius: 5, border: 'none', background: '#c9a84c',
                      color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function WarmHoldColumn({ deals = [], stage, onRefresh, onAddContact }) {
  const totalValue = deals.reduce((sum, d) => sum + (parseFloat(d.quote_value) || 0), 0);
  const overdueCount = deals.filter(d => daysSince(d.created_at) > 60).length;

  return (
    <div style={{
      width: 260,
      minWidth: 260,
      maxWidth: 260,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 10,
      overflow: 'hidden',
      border: '2px solid #c9a84c',
      boxShadow: '0 2px 16px rgba(201,168,76,0.15)',
      flexShrink: 0,
    }}>
      {/* Golden header */}
      <div style={{
        background: 'linear-gradient(135deg, #a8883c 0%, #c9a84c 50%, #e0b85a 100%)',
        padding: '14px 14px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>⏸</span>
          <span style={{
            fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: '0.05em',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            WARM HOLD
          </span>
          <span style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.25)',
            borderRadius: 999,
            padding: '1px 8px',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {deals.length}
          </span>
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.85)',
          fontFamily: "'DM Sans', sans-serif", marginBottom: 6,
        }}>
          Architects &amp; Designers
        </div>

        {/* Tooltip info strip */}
        <div style={{
          background: 'rgba(255,255,255,0.18)',
          borderRadius: 5,
          padding: '5px 9px',
          fontSize: 11,
          color: '#fff',
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <span style={{ fontSize: 13 }}>ℹ️</span>
          Follow up every 60 days
          {overdueCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              background: '#dc2626',
              borderRadius: 999,
              padding: '1px 7px',
              fontSize: 10.5,
              fontWeight: 700,
              color: '#fff',
            }}>
              {overdueCount} overdue
            </span>
          )}
        </div>

        {/* Value summary */}
        {totalValue > 0 && (
          <div style={{
            marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.9)',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          }}>
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
              background: snapshot.isDraggingOver ? '#fef3c7' : '#fef8ec',
              transition: 'background 0.15s',
              overflowY: 'auto',
              maxHeight: 480,
            }}
          >
            {deals.length === 0 && !snapshot.isDraggingOver && (
              <div style={{
                textAlign: 'center', color: '#a8883c', fontSize: 12,
                padding: '18px 0', fontFamily: "'DM Sans', sans-serif",
                opacity: 0.7,
              }}>
                No warm contacts yet
              </div>
            )}
            {deals.map((deal, i) => (
              <WarmCard key={deal.id} deal={deal} index={i} onRefresh={onRefresh} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add warm contact button */}
      <div style={{
        padding: '8px 10px',
        background: '#fef8ec',
        borderTop: '1px solid #fde68a',
      }}>
        <button
          onClick={onAddContact}
          style={{
            width: '100%',
            padding: '7px 0',
            borderRadius: 6,
            border: '1.5px dashed #c9a84c',
            background: 'transparent',
            color: '#a8883c',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fde68a33'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          + Add Warm Contact
        </button>
      </div>
    </div>
  );
}

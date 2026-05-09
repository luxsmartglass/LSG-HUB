import { Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { PIPELINE_STAGES } from '../../lib/pricingDatabase';
import { useState } from 'react';

const GOLD = '#c9a84c';
const CREAM = '#f4f1eb';
const NAVY = '#1c2b4a';

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
        background: 'rgba(220,38,38,0.18)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)',
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
        background: 'rgba(217,119,6,0.18)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.3)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Due soon
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
      background: 'rgba(22,163,74,0.18)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.3)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      Recent
    </span>
  );
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
            background: '#162238',
            borderRadius: 8,
            padding: '11px 13px',
            marginBottom: 8,
            boxShadow: snapshot.isDragging
              ? '0 8px 32px rgba(0,0,0,0.5)'
              : '0 2px 8px rgba(0,0,0,0.3)',
            border: snapshot.isDragging
              ? `1.5px solid ${GOLD}`
              : '1px solid rgba(201,168,76,0.25)',
            position: 'relative',
            userSelect: 'none',
            transition: 'box-shadow 0.15s, border-color 0.15s',
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: 13.5, color: CREAM,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {deal.client_name || 'Unnamed Contact'}
              </div>
              {deal.quote_value > 0 && (
                <div style={{ fontSize: 12, color: GOLD, marginTop: 1, fontFamily: "'DM Sans', sans-serif", opacity: 0.85 }}>
                  {formatValue(deal.quote_value)}
                </div>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); setEditing(v => !v); }}
              title="Edit contact"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 4px', borderRadius: 4,
                color: 'rgba(244,241,235,0.35)', flexShrink: 0,
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
            <span style={{ fontSize: 11, color: 'rgba(244,241,235,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
              {days === 0 ? 'Added today' : `${days}d ago`}
            </span>
          </div>

          {deal.notes && (
            <div style={{
              marginTop: 7, fontSize: 11,
              color: 'rgba(244,241,235,0.5)',
              background: 'rgba(201,168,76,0.07)',
              borderRadius: 4, padding: '3px 7px',
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
                background: '#0f1d35',
                borderRadius: 8,
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                border: `2px solid ${GOLD}`,
                padding: '14px 16px',
                zIndex: 100,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: CREAM, marginBottom: 10 }}>Edit Contact</div>
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
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setForm({ client_name: deal.client_name || '', quote_value: deal.quote_value || '', notes: deal.notes || '' }); }}
                    style={{
                      padding: '5px 12px', fontSize: 12, borderRadius: 5,
                      border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                      color: 'rgba(244,241,235,0.6)', cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '5px 14px', fontSize: 12, fontWeight: 700,
                      borderRadius: 5, border: 'none', background: GOLD,
                      color: NAVY, cursor: saving ? 'not-allowed' : 'pointer',
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
      border: `2px solid ${GOLD}`,
      boxShadow: '0 2px 16px rgba(201,168,76,0.2)',
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
              background: snapshot.isDraggingOver
                ? 'rgba(201,168,76,0.1)'
                : 'rgba(255,255,255,0.03)',
              transition: 'background 0.15s',
              overflowY: 'auto',
              maxHeight: 480,
            }}
          >
            {deals.length === 0 && !snapshot.isDraggingOver && (
              <div style={{
                textAlign: 'center', color: 'rgba(201,168,76,0.4)', fontSize: 12,
                padding: '18px 0', fontFamily: "'DM Sans', sans-serif",
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
        background: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(201,168,76,0.2)',
      }}>
        <button
          onClick={onAddContact}
          style={{
            width: '100%',
            padding: '7px 0',
            borderRadius: 6,
            border: `1.5px dashed ${GOLD}`,
            background: 'transparent',
            color: GOLD,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          + Add Warm Contact
        </button>
      </div>
    </div>
  );
}

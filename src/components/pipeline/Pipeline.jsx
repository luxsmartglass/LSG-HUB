import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { PIPELINE_STAGES } from '../../lib/pricingDatabase';
import { useToast } from '../ui/Toast';
import LoadingScreen from '../ui/LoadingScreen';
import ErrorBanner from '../ui/ErrorBanner';
import KanbanBoard from './KanbanBoard';

function formatCAD(value) {
  return '$' + (parseFloat(value) || 0).toLocaleString('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' CAD';
}

const DEFAULT_STAGE = PIPELINE_STAGES[0].id;

function AddDealModal({ onClose, onSaved, defaultStage }) {
  const addToast = useToast();
  const [form, setForm] = useState({
    client_name: '',
    quote_value: '',
    stage: defaultStage || DEFAULT_STAGE,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.client_name.trim()) {
      addToast('Client name is required', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('pipeline').insert({
      client_name: form.client_name.trim(),
      quote_value: parseFloat(form.quote_value) || 0,
      stage: form.stage,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      addToast('Failed to add deal: ' + error.message, 'error');
    } else {
      addToast('Deal added');
      onSaved();
      onClose();
    }
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    fontSize: 13.5,
    border: '1.5px solid #d1d5db',
    borderRadius: 7,
    outline: 'none',
    color: '#1c2b4a',
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 12,
    background: '#fafafa',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        padding: '28px 28px 24px',
        width: 420,
        maxWidth: '100%',
        boxShadow: '0 20px 64px rgba(0,0,0,0.28)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1c2b4a' }}>New Deal</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Add to pipeline</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 22, color: '#9ca3af', padding: '2px 8px',
              borderRadius: 6, lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Client Name *</label>
          <input
            autoFocus
            value={form.client_name}
            onChange={set('client_name')}
            placeholder="e.g. Acme Corp"
            style={inputStyle}
          />

          <label style={labelStyle}>Deal Value (CAD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.quote_value}
            onChange={set('quote_value')}
            placeholder="0"
            style={inputStyle}
          />

          <label style={labelStyle}>Stage</label>
          <select
            value={form.stage}
            onChange={set('stage')}
            style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
          >
            {PIPELINE_STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <label style={labelStyle}>Notes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            placeholder="Optional notes..."
            style={{ ...inputStyle, resize: 'vertical', marginBottom: 20 }}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px', fontSize: 13.5, borderRadius: 8,
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
                padding: '9px 22px', fontSize: 13.5, fontWeight: 700, borderRadius: 8,
                border: 'none',
                background: saving ? '#e5c97c' : '#c9a84c',
                color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.15s',
              }}
            >
              {saving ? 'Adding…' : 'Add Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Pipeline() {
  const addToast = useToast();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultStage, setAddModalDefaultStage] = useState(DEFAULT_STAGE);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('pipeline')
      .select('*')
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError);
      addToast('Failed to load pipeline: ' + fetchError.message, 'error');
    } else {
      setDeals(data || []);
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Derived summary stats
  const totalValue = deals.reduce((sum, d) => sum + (parseFloat(d.quote_value) || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'won');
  const wonValue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.quote_value) || 0), 0);

  function openAddWarmContact() {
    setAddModalDefaultStage('warm_hold');
    setShowAddModal(true);
  }

  function openAddDeal() {
    setAddModalDefaultStage(DEFAULT_STAGE);
    setShowAddModal(true);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1d35',
      fontFamily: "'DM Sans', sans-serif",
      padding: '24px 20px 40px',
    }}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 800, color: '#f4f1eb',
            fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em',
          }}>
            Pipeline
          </h1>
          <p style={{
            margin: '4px 0 0', fontSize: 13.5, color: 'rgba(244,241,235,0.45)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Manage deals across all stages
          </p>
        </div>
        <button
          onClick={openAddDeal}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 20px',
            fontSize: 13.5, fontWeight: 700,
            borderRadius: 8,
            border: 'none',
            background: '#c9a84c',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 2px 8px rgba(201,168,76,0.3)',
            transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#b8943e'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Deal
        </button>
      </div>

      {/* Summary bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          {
            label: 'Total Deals',
            value: deals.length,
            icon: '📋',
            color: '#60a5fa',
          },
          {
            label: 'Pipeline Value',
            value: formatCAD(totalValue),
            icon: '💰',
            color: '#c9a84c',
          },
          {
            label: 'Won',
            value: `${wonDeals.length} deals · ${formatCAD(wonValue)}`,
            icon: '🏆',
            color: '#34d399',
          },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 160,
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{stat.icon}</span>
            <div>
              <div style={{
                fontSize: 11, color: 'rgba(244,241,235,0.45)',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: stat.color,
                fontFamily: "'DM Sans', sans-serif", marginTop: 1,
              }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      <ErrorBanner error={error} onRetry={fetchDeals} />

      {/* Loading state */}
      {loading && (
        <div style={{ height: 200 }}>
          <LoadingScreen message="Loading pipeline..." />
        </div>
      )}

      {/* Board */}
      {!loading && !error && (
        <KanbanBoard
          deals={deals}
          onRefresh={fetchDeals}
          onAddDeal={openAddDeal}
          onAddWarmContact={openAddWarmContact}
        />
      )}

      {/* Add deal modal */}
      {showAddModal && (
        <AddDealModal
          defaultStage={addModalDefaultStage}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchDeals}
        />
      )}
    </div>
  );
}

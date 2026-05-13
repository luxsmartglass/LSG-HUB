import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PIPELINE_STAGES } from '../../lib/pricingDatabase';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../theme/useTheme';
import { Modal } from '../ui/Modal';
import LoadingScreen from '../ui/LoadingScreen';
import ErrorBanner from '../ui/ErrorBanner';
import KanbanBoard from './KanbanBoard';
import { useIsMobile } from '../../hooks/useMediaQuery';

function formatCAD(value) {
  return '$' + (parseFloat(value) || 0).toLocaleString('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' CAD';
}

const DEFAULT_STAGE = PIPELINE_STAGES[0].id;

function AddDealModal({ open, onClose, onSaved, defaultStage }) {
  const addToast = useToast();
  const { c } = useTheme();
  const [form, setForm] = useState({
    client_name: '',
    quote_value: '',
    stage: defaultStage || DEFAULT_STAGE,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Sync defaultStage when modal opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync form stage when modal prop changes
      setForm(f => ({ ...f, stage: defaultStage || DEFAULT_STAGE }));
    }
  }, [open, defaultStage]);

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
      setForm({ client_name: '', quote_value: '', stage: defaultStage || DEFAULT_STAGE, notes: '' });
      onSaved();
      onClose();
    }
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    fontSize: c.text.base,
    border: '1px solid ' + c.border,
    borderRadius: c.radius.md,
    outline: 'none',
    color: c.textPrimary,
    fontFamily: c.font.body,
    marginBottom: 12,
    background: c.surfaceHover,
  };

  const labelStyle = {
    display: 'block',
    fontSize: c.text.xs,
    fontWeight: c.weight.label,
    color: c.accent,
    marginBottom: 5,
    fontFamily: c.font.body,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Deal"
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px', fontSize: c.text.base, borderRadius: c.radius.md,
              border: '1px solid ' + c.border, background: 'transparent',
              color: c.textSecondary, cursor: 'pointer', fontFamily: c.font.body,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-deal-form"
            disabled={saving}
            style={{
              padding: '9px 22px', fontSize: c.text.base, fontWeight: c.weight.button,
              borderRadius: c.radius.md, border: 'none',
              background: saving ? c.accentHover : c.accent,
              color: c.accentText, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: c.font.body, transition: 'background 0.15s',
            }}
          >
            {saving ? 'Adding…' : 'Add Deal'}
          </button>
        </>
      }
    >
      <form id="add-deal-form" onSubmit={handleSubmit}>
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
          style={{ ...inputStyle, resize: 'vertical', marginBottom: 0 }}
        />
      </form>
    </Modal>
  );
}

export default function Pipeline() {
  const addToast = useToast();
  const { c } = useTheme();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultStage, setAddModalDefaultStage] = useState(DEFAULT_STAGE);

  // Honor ?new=1 from command palette
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: URL param triggers modal, then param is cleared
      setAddModalDefaultStage(DEFAULT_STAGE);
      setShowAddModal(true);
      // Strip the param
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: load on mount; fetchDeals is an async callback
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
    <div className="fade-up" style={{
      fontFamily: c.font.body,
      animation: 'fadeUp 0.35s ease both',
    }}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: isMobile ? 12 : 16,
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: c.text['2xl'], fontWeight: c.weight.hero,
            color: c.textPrimary, fontFamily: c.font.heading, letterSpacing: '-0.02em',
          }}>
            Pipeline
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: c.text.base, color: c.textMuted }}>
            Manage deals across all stages
          </p>
        </div>
        <button
          onClick={openAddDeal}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 20px',
            fontSize: c.text.base, fontWeight: c.weight.button,
            borderRadius: c.radius.md, border: 'none',
            background: c.accent, color: c.accentText,
            cursor: 'pointer', fontFamily: c.font.body,
            boxShadow: '0 2px 8px ' + c.accentSoft,
            transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = c.accentHover; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = c.accent; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Deal
        </button>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Deals', value: deals.length, icon: '📋', color: c.highlight },
          { label: 'Pipeline Value', value: formatCAD(totalValue), icon: '💰', color: c.accent },
          { label: 'Won', value: `${wonDeals.length} deals · ${formatCAD(wonValue)}`, icon: '🏆', color: c.success },
        ].map(stat => (
          <div key={stat.label} style={{
            background: c.surface,
            border: '1px solid ' + c.border,
            borderRadius: c.radius.lg,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 160,
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{stat.icon}</span>
            <div>
              <div style={{
                fontSize: c.text.xs, color: c.textMuted,
                fontWeight: c.weight.label, letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {stat.label}
              </div>
              <div style={{ fontSize: c.text.md, fontWeight: c.weight.strong, color: stat.color, marginTop: 1 }}>
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
      <AddDealModal
        open={showAddModal}
        defaultStage={addModalDefaultStage}
        onClose={() => setShowAddModal(false)}
        onSaved={fetchDeals}
      />
    </div>
  );
}

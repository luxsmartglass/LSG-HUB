import { useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';
import { PIPELINE_STAGES } from '../../lib/pricingDatabase';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../theme/useTheme';
import { Modal } from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import DealCard from './DealCard';
import WarmHoldColumn from './WarmHoldColumn';

function formatColValue(deals) {
  const total = deals.reduce((s, d) => s + (parseFloat(d.quote_value) || 0), 0);
  if (total === 0) return null;
  return '$' + total.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function RegularColumn({ stage, deals, onRefresh, c }) {
  return (
    <div style={{
      width: 240,
      minWidth: 240,
      maxWidth: 240,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: c.radius.lg,
      overflow: 'hidden',
      border: '1px solid ' + c.border,
      flexShrink: 0,
    }}>
      {/* Column header — stage.color stays (semantic per-stage color) */}
      <div style={{
        background: c.surfaceElevated,
        borderTop: `4px solid ${stage.color}`,
        padding: '10px 12px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontWeight: c.weight.strong,
            fontSize: c.text.sm,
            color: c.textPrimary,
            fontFamily: c.font.body,
            flex: 1,
            lineHeight: 1.3,
          }}>
            {stage.label}
          </span>
          <span style={{
            background: stage.color + '33',
            color: stage.color,
            borderRadius: c.radius.pill,
            padding: '1px 8px',
            fontSize: c.text.sm,
            fontWeight: c.weight.button,
            flexShrink: 0,
          }}>
            {deals.length}
          </span>
        </div>
        {formatColValue(deals) && (
          <div style={{ fontSize: c.text.xs, color: c.textMuted }}>
            {formatColValue(deals)} CAD
          </div>
        )}
      </div>

      {/* Droppable card area */}
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
                ? stage.bg
                : c.bg,
              transition: 'background 0.15s',
              overflowY: 'auto',
              maxHeight: 520,
            }}
          >
            {deals.length === 0 && !snapshot.isDraggingOver && (
              <div style={{
                textAlign: 'center',
                color: c.textMuted,
                fontSize: c.text.sm,
                padding: '18px 0',
              }}>
                No deals
              </div>
            )}
            {deals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} index={i} onRefresh={onRefresh} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// Loss reason modal — reuses Modal primitive
function LossReasonModal({ open, onConfirm, onCancel }) {
  const { c } = useTheme();
  const [reason, setReason] = useState('');

  function handleConfirm() {
    onConfirm(reason);
    setReason('');
  }

  function handleCancel() {
    setReason('');
    onCancel();
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="Mark as Lost"
      size="sm"
      footer={
        <>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 18px', fontSize: c.text.base, borderRadius: c.radius.md,
              border: '1px solid ' + c.border, background: 'transparent',
              color: c.textSecondary, cursor: 'pointer', fontFamily: c.font.body,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 18px', fontSize: c.text.base, fontWeight: c.weight.button,
              borderRadius: c.radius.md, border: 'none',
              background: c.danger, color: '#fff',
              cursor: 'pointer', fontFamily: c.font.body,
            }}
          >
            Mark Lost
          </button>
        </>
      }
    >
      <div style={{ fontSize: c.text.base, color: c.textMuted, marginBottom: 14 }}>
        What was the reason for losing this deal?
      </div>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        autoFocus
        placeholder="e.g. Budget constraints, chose competitor..."
        rows={3}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', fontSize: c.text.base,
          border: '1px solid ' + c.border, borderRadius: c.radius.md,
          outline: 'none', resize: 'vertical',
          color: c.textPrimary, background: c.surfaceHover,
          fontFamily: c.font.body,
        }}
      />
    </Modal>
  );
}

export default function KanbanBoard({ deals = [], onRefresh, onAddDeal, onAddWarmContact }) {
  const addToast = useToast();
  const { c } = useTheme();
  const [lossModal, setLossModal] = useState(null); // { dealId, destStageId }

  // Group deals by stage
  function dealsByStage(stageId) {
    return deals.filter(d => d.stage === stageId);
  }

  async function moveDeal(dealId, newStage, extraData = {}) {
    const stage = PIPELINE_STAGES.find(s => s.id === newStage);
    const { error } = await supabase
      .from('pipeline')
      .update({ stage: newStage, ...extraData })
      .eq('id', dealId);

    if (error) {
      addToast('Failed to move deal: ' + error.message, 'error');
      return false;
    }

    addToast(`Deal moved to ${stage?.label || newStage}`);
    if (onRefresh) onRefresh();
    return true;
  }

  function tryConfetti() {
    try {
      import('canvas-confetti').then(mod => {
        const confetti = mod.default || mod;
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: [c.accent, c.highlight, c.textPrimary, c.success],
        });
      }).catch(() => {
        // canvas-confetti not available, silently skip
      });
    } catch {
      // ignore
    }
  }

  function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId;

    if (newStage === 'won') {
      moveDeal(Number(draggableId), 'won').then(ok => {
        if (ok) {
          tryConfetti();
          addToast('🎉 Deal Won!');
        }
      });
      return;
    }

    if (newStage === 'lost') {
      setLossModal({ dealId: Number(draggableId), destStageId: 'lost' });
      return;
    }

    moveDeal(Number(draggableId), newStage);
  }

  function handleLossConfirm(reason) {
    if (!lossModal) return;
    moveDeal(lossModal.dealId, 'lost', { notes: reason || null }).then(() => {
      setLossModal(null);
    });
  }

  function handleLossCancel() {
    setLossModal(null);
    if (onRefresh) onRefresh(); // refresh to revert optimistic UI
  }

  const totalDeals = deals.length;

  return (
    <>
      {totalDeals === 0 ? (
        <div style={{ background: c.surface, borderRadius: c.radius.lg, border: '1px solid ' + c.border, marginTop: 8 }}>
          <EmptyState
            illustration="EmptyPipeline"
            title="No deals yet"
            message="Add your first deal."
            action="Add Deal"
            onAction={onAddDeal}
          />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            overflowX: 'auto',
            padding: '8px 4px 16px',
            alignItems: 'flex-start',
            minHeight: 300,
          }}>
            {PIPELINE_STAGES.map(stage => {
              const stageDeals = dealsByStage(stage.id);
              if (stage.id === 'warm_hold') {
                return (
                  <WarmHoldColumn
                    key={stage.id}
                    stage={stage}
                    deals={stageDeals}
                    onRefresh={onRefresh}
                    onAddContact={() => onAddWarmContact && onAddWarmContact()}
                  />
                );
              }
              return (
                <RegularColumn
                  key={stage.id}
                  stage={stage}
                  deals={stageDeals}
                  onRefresh={onRefresh}
                  c={c}
                />
              );
            })}
          </div>
        </DragDropContext>
      )}

      <LossReasonModal
        open={!!lossModal}
        onConfirm={handleLossConfirm}
        onCancel={handleLossCancel}
      />
    </>
  );
}

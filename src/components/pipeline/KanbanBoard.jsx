import { useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';
import { PIPELINE_STAGES } from '../../lib/pricingDatabase';
import { useToast } from '../ui/Toast';
import DealCard from './DealCard';
import WarmHoldColumn from './WarmHoldColumn';

function formatColValue(deals) {
  const total = deals.reduce((s, d) => s + (parseFloat(d.quote_value) || 0), 0);
  if (total === 0) return null;
  return '$' + total.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function RegularColumn({ stage, deals, onRefresh }) {
  return (
    <div style={{
      width: 240,
      minWidth: 240,
      maxWidth: 240,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 10,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      flexShrink: 0,
    }}>
      {/* Column header */}
      <div style={{
        background: '#1c2b4a',
        borderTop: `4px solid ${stage.color}`,
        padding: '10px 12px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontWeight: 700,
            fontSize: 12.5,
            color: '#f4f1eb',
            fontFamily: "'DM Sans', sans-serif",
            flex: 1,
            lineHeight: 1.3,
          }}>
            {stage.label}
          </span>
          <span style={{
            background: stage.color + '33',
            color: stage.color,
            borderRadius: 999,
            padding: '1px 8px',
            fontSize: 11.5,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            flexShrink: 0,
          }}>
            {deals.length}
          </span>
        </div>
        {formatColValue(deals) && (
          <div style={{
            fontSize: 11,
            color: 'rgba(244,241,235,0.55)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
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
                : 'rgba(255,255,255,0.03)',
              transition: 'background 0.15s',
              overflowY: 'auto',
              maxHeight: 520,
            }}
          >
            {deals.length === 0 && !snapshot.isDraggingOver && (
              <div style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.2)',
                fontSize: 12,
                padding: '18px 0',
                fontFamily: "'DM Sans', sans-serif",
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

// Loss reason modal
function LossReasonModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '28px 28px 24px',
        width: 380, maxWidth: '90vw',
        boxShadow: '0 16px 64px rgba(0,0,0,0.3)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#1c2b4a', marginBottom: 6 }}>
          Mark as Lost
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
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
            padding: '10px 12px', fontSize: 13,
            border: '1.5px solid #d1d5db', borderRadius: 7,
            outline: 'none', resize: 'vertical',
            color: '#1c2b4a', fontFamily: "'DM Sans', sans-serif",
            marginBottom: 16,
          }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px', fontSize: 13, borderRadius: 7,
              border: '1px solid #d1d5db', background: '#f9fafb',
              color: '#6b7280', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 7,
              border: 'none', background: '#dc2626', color: '#fff',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Mark Lost
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({ deals = [], onRefresh, onAddDeal, onAddWarmContact }) {
  const addToast = useToast();
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
          colors: ['#c9a84c', '#1c2b4a', '#f4f1eb', '#16a34a'],
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

  return (
    <>
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
              />
            );
          })}
        </div>
      </DragDropContext>

      {lossModal && (
        <LossReasonModal
          onConfirm={handleLossConfirm}
          onCancel={handleLossCancel}
        />
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  DndContext, closestCorners, DragOverlay, PointerSensor, TouchSensor,
  KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/ui/Navbar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  getBoardById, getColumnsByBoard, getCardsByColumn, createColumn, updateColumn,
  deleteColumn, createCard, updateCard, deleteCard, updateCardsPositions,
  updateColumnsPositions, addActivityLog, getActivityLogsByCard,
} from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { generatePosition, formatDate, formatDueDate, COLUMN_COLORS, LABEL_COLORS } from '@/lib/utils';
import styles from '../board.module.css';

/* ==================== SortableCard ==================== */
function SortableCard({ card, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, data: { type: 'card', card } });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const dueInfo = formatDueDate(card.dueDate);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}
      onClick={() => onClick(card)} role="button" tabIndex={0}>
      {card.labelColor && <div className={styles.cardLabel} style={{ background: card.labelColor }} />}
      <div className={styles.cardTitle}>{card.title}</div>
      <div className={styles.cardMeta}>
        {dueInfo && (
          <span className={`${styles.cardDueDate} ${dueInfo.isOverdue ? styles.dueOverdue : dueInfo.isUrgent ? styles.dueUrgent : styles.dueFuture}`}>
            📅 {dueInfo.text}
          </span>
        )}
        {card.description && <span className={styles.cardDesc}>📝 Açıklama</span>}
      </div>
    </div>
  );
}

/* ==================== SortableColumn ==================== */
function SortableColumn({ column, cards, onAddCard, onDeleteColumn, onUpdateColumnTitle, onCardClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id, data: { type: 'column', column } });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== column.title) {
      onUpdateColumnTitle(column.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddCard(column.id, newCardTitle.trim());
    setNewCardTitle('');
    setShowAddCard(false);
  };

  const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

  return (
    <div ref={setNodeRef} style={style} className={`${styles.column} ${isDragging ? styles.columnDragging : ''}`}>
      <div className={styles.columnHeader} {...attributes} {...listeners}>
        <div className={styles.columnColorDot} style={{ background: column.color || '#6366f1' }} />
        {isEditing ? (
          <input className={styles.columnTitleInput} value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave} onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setIsEditing(false); }}
            autoFocus onClick={(e) => e.stopPropagation()} />
        ) : (
          <span className={styles.columnTitle} onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditTitle(column.title); }}>
            {column.title}
          </span>
        )}
        <span className={styles.columnCount}>{cards.length}</span>
        <div className={styles.columnActions}>
          <button className={styles.colActionBtn} onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditTitle(column.title); }} title="Düzenle">✏️</button>
          <button className={`${styles.colActionBtn} ${styles.deleteCol}`} onClick={(e) => { e.stopPropagation(); onDeleteColumn(column.id); }} title="Sil">🗑️</button>
        </div>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className={styles.columnBody}>
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} onClick={onCardClick} />
          ))}
        </div>
      </SortableContext>

      <div className={styles.addCardForm}>
        {showAddCard ? (
          <form onSubmit={handleAddCard}>
            <div className={styles.addCardInputRow}>
              <Input placeholder="Kart başlığı..." value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button type="submit" size="sm" disabled={!newCardTitle.trim()}>Ekle</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAddCard(false); setNewCardTitle(''); }}>İptal</Button>
            </div>
          </form>
        ) : (
          <button className={styles.addCardBtn} onClick={() => setShowAddCard(true)}>+ Kart Ekle</button>
        )}
      </div>
    </div>
  );
}

/* ==================== MAIN BOARD PAGE ==================== */
export default function BoardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const dndId = useId();
  const boardId = params.id;

  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cardsByColumn, setCardsByColumn] = useState({});
  const [activeItem, setActiveItem] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);

  // Add Column state
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColColor, setNewColColor] = useState('#6366f1');

  // Card detail edit state
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardDesc, setEditCardDesc] = useState('');
  const [editCardLabel, setEditCardLabel] = useState('');
  const [editCardDueDate, setEditCardDueDate] = useState('');
  const [cardActivities, setCardActivities] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadBoardData = useCallback(() => {
    const b = getBoardById(boardId);
    if (!b) return;
    setBoard(b);
    const cols = getColumnsByBoard(boardId);
    setColumns(cols);
    const cbc = {};
    cols.forEach((col) => { cbc[col.id] = getCardsByColumn(col.id); });
    setCardsByColumn(cbc);
  }, [boardId]);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadBoardData();
  }, [user, authLoading, router, loadBoardData]);

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  // Find which column a card belongs to
  const findColumnOfCard = useCallback((cardId) => {
    for (const colId of Object.keys(cardsByColumn)) {
      if (cardsByColumn[colId]?.some((c) => c.id === cardId)) return colId;
    }
    return null;
  }, [cardsByColumn]);

  /* ---- DnD Handlers ---- */
  const handleDragStart = (event) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === 'card') setActiveItem({ type: 'card', data: active.data.current.card });
    else if (type === 'column') setActiveItem({ type: 'column', data: active.data.current.column });
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeType = active.data.current?.type;
    if (activeType !== 'card') return;

    const activeColId = findColumnOfCard(active.id);
    let overColId = null;
    const overType = over.data.current?.type;
    if (overType === 'card') overColId = findColumnOfCard(over.id);
    else if (overType === 'column') overColId = over.id;
    if (!activeColId || !overColId || activeColId === overColId) return;

    setCardsByColumn((prev) => {
      const activeCards = [...(prev[activeColId] || [])];
      const overCards = [...(prev[overColId] || [])];
      const activeIdx = activeCards.findIndex((c) => c.id === active.id);
      if (activeIdx === -1) return prev;
      const [movedCard] = activeCards.splice(activeIdx, 1);
      movedCard.columnId = overColId;

      let overIdx = overCards.length;
      if (overType === 'card') {
        overIdx = overCards.findIndex((c) => c.id === over.id);
        if (overIdx === -1) overIdx = overCards.length;
      }
      overCards.splice(overIdx, 0, movedCard);

      return { ...prev, [activeColId]: activeCards, [overColId]: overCards };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === 'column') {
      if (active.id !== over.id) {
        const oldIdx = columns.findIndex((c) => c.id === active.id);
        const overType = over.data.current?.type;
        let newIdx;
        if (overType === 'column') {
          newIdx = columns.findIndex((c) => c.id === over.id);
        } else {
          const overColId = findColumnOfCard(over.id);
          newIdx = columns.findIndex((c) => c.id === overColId);
        }
        if (oldIdx === -1 || newIdx === -1 || newIdx === undefined) return;
        const newCols = arrayMove(columns, oldIdx, newIdx);
        const updated = newCols.map((c, i) => ({ ...c, position: (i + 1) * 1000 }));
        setColumns(updated);
        updateColumnsPositions(updated.map((c) => ({ id: c.id, position: c.position })));
      }
      return;
    }

    // Card sorting within same column
    if (activeType === 'card') {
      const activeColId = findColumnOfCard(active.id);
      if (!activeColId) return;
      const colCards = cardsByColumn[activeColId] || [];

      if (active.id !== over.id && over.data.current?.type === 'card' && findColumnOfCard(over.id) === activeColId) {
        const oldIdx = colCards.findIndex((c) => c.id === active.id);
        const newIdx = colCards.findIndex((c) => c.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
          const newCards = arrayMove(colCards, oldIdx, newIdx);
          const updated = newCards.map((c, i) => ({ ...c, position: (i + 1) * 1000 }));
          setCardsByColumn((prev) => ({ ...prev, [activeColId]: updated }));
          updateCardsPositions(updated.map((c) => ({ id: c.id, position: c.position, columnId: activeColId })));
        }
      } else {
        // Persist cross-column move positions
        const updatedAll = [];
        Object.entries(cardsByColumn).forEach(([colId, cards]) => {
          cards.forEach((c, i) => {
            updatedAll.push({ id: c.id, position: (i + 1) * 1000, columnId: colId });
          });
        });
        updateCardsPositions(updatedAll);
      }

      // Log activity for cross-column moves
      const originalCol = active.data.current?.card?.columnId;
      const newCol = findColumnOfCard(active.id);
      if (originalCol && newCol && originalCol !== newCol) {
        const fromCol = columns.find((c) => c.id === originalCol);
        const toCol = columns.find((c) => c.id === newCol);
        addActivityLog({
          id: uuidv4(), cardId: active.id, boardId,
          action: 'moved',
          details: { from: fromCol?.title || '?', to: toCol?.title || '?' },
          createdAt: new Date().toISOString(),
        });
      }
    }
  };

  /* ---- Column CRUD ---- */
  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    const maxPos = columns.length > 0 ? Math.max(...columns.map((c) => c.position)) : 0;
    const col = {
      id: uuidv4(), boardId, title: newColTitle.trim(),
      position: maxPos + 1000, color: newColColor,
      createdAt: new Date().toISOString(),
    };
    createColumn(col);
    setShowAddColumn(false);
    setNewColTitle('');
    setNewColColor('#6366f1');
    loadBoardData();
  };

  const handleDeleteColumn = (colId) => {
    if (!window.confirm('Sütun ve içindeki tüm kartlar silinecek. Emin misiniz?')) return;
    deleteColumn(colId);
    loadBoardData();
  };

  const handleUpdateColumnTitle = (colId, title) => {
    updateColumn(colId, { title });
    loadBoardData();
  };

  /* ---- Card CRUD ---- */
  const handleAddCard = (columnId, title) => {
    const colCards = cardsByColumn[columnId] || [];
    const maxPos = colCards.length > 0 ? Math.max(...colCards.map((c) => c.position)) : 0;
    const card = {
      id: uuidv4(), columnId, title, description: '',
      position: maxPos + 1000, labelColor: '', dueDate: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    createCard(card);
    addActivityLog({
      id: uuidv4(), cardId: card.id, boardId, action: 'created',
      details: { title }, createdAt: new Date().toISOString(),
    });
    loadBoardData();
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setEditCardTitle(card.title);
    setEditCardDesc(card.description || '');
    setEditCardLabel(card.labelColor || '');
    setEditCardDueDate(card.dueDate || '');
    setCardActivities(getActivityLogsByCard(card.id));
    setShowCardModal(true);
  };

  const handleSaveCardDetail = () => {
    if (!selectedCard) return;
    updateCard(selectedCard.id, {
      title: editCardTitle.trim() || selectedCard.title,
      description: editCardDesc,
      labelColor: editCardLabel,
      dueDate: editCardDueDate || null,
    });
    setShowCardModal(false);
    loadBoardData();
  };

  const handleDeleteCard = () => {
    if (!selectedCard) return;
    if (!window.confirm('Bu kartı silmek istediğinize emin misiniz?')) return;
    deleteCard(selectedCard.id);
    setShowCardModal(false);
    loadBoardData();
  };

  if (authLoading || !user) return null;
  if (!board) return <div className={styles.loadingContainer}>Board yükleniyor...</div>;

  return (
    <div className={styles.boardPage}>
      <Navbar />
      <div className={styles.boardHeader}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
          ← Geri
        </button>
        <div className={styles.boardInfo}>
          <h1 className={styles.boardTitle}>{board.title}</h1>
          {board.description && <p className={styles.boardDesc}>{board.description}</p>}
        </div>
      </div>

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCorners}
        onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className={styles.kanbanContainer}>
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <SortableColumn key={column.id} column={column} cards={cardsByColumn[column.id] || []}
                onAddCard={handleAddCard} onDeleteColumn={handleDeleteColumn}
                onUpdateColumnTitle={handleUpdateColumnTitle} onCardClick={handleCardClick} />
            ))}
          </SortableContext>

          {/* Add Column */}
          {showAddColumn ? (
            <form className={styles.addColumnForm} onSubmit={handleAddColumn}>
              <Input placeholder="Sütun adı..." value={newColTitle} onChange={(e) => setNewColTitle(e.target.value)} autoFocus />
              <div className={styles.colorPicker}>
                {COLUMN_COLORS.map((c) => (
                  <button key={c.value} type="button"
                    className={`${styles.colorSwatch} ${newColColor === c.value ? styles.colorSwatchActive : ''}`}
                    style={{ background: c.value }}
                    onClick={() => setNewColColor(c.value)} title={c.label} />
                ))}
              </div>
              <div className={styles.addColumnActions}>
                <Button type="submit" size="sm" disabled={!newColTitle.trim()}>Ekle</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAddColumn(false); setNewColTitle(''); }}>İptal</Button>
              </div>
            </form>
          ) : (
            <button className={styles.addColumnBtn} onClick={() => setShowAddColumn(true)}>+ Sütun Ekle</button>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem?.type === 'card' && (
            <div className={styles.cardOverlay}>
              {activeItem.data.labelColor && <div className={styles.cardLabel} style={{ background: activeItem.data.labelColor }} />}
              <div className={styles.cardTitle}>{activeItem.data.title}</div>
            </div>
          )}
          {activeItem?.type === 'column' && (
            <div className={styles.column} style={{ opacity: 0.9, boxShadow: 'var(--shadow-xl)' }}>
              <div className={styles.columnHeader}>
                <div className={styles.columnColorDot} style={{ background: activeItem.data.color || '#6366f1' }} />
                <span className={styles.columnTitle}>{activeItem.data.title}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Card Detail Modal */}
      <Modal isOpen={showCardModal} onClose={() => setShowCardModal(false)} title="Kart Detayı" large
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCardModal(false)}>İptal</Button>
            <Button onClick={handleSaveCardDetail}>Kaydet</Button>
          </>
        }>
        <div className={styles.cardDetailModal}>
          <Input label="Başlık" value={editCardTitle} onChange={(e) => setEditCardTitle(e.target.value)} />
          <Input label="Açıklama" textarea placeholder="Kart açıklaması ekleyin..." value={editCardDesc} onChange={(e) => setEditCardDesc(e.target.value)} />

          <div className={styles.cardDetailSection}>
            <span className={styles.sectionLabel}>Etiket Rengi</span>
            <div className={styles.labelPicker}>
              {LABEL_COLORS.map((c) => (
                <button key={c.value} type="button"
                  className={`${styles.labelSwatch} ${editCardLabel === c.value ? styles.labelSwatchActive : ''}`}
                  style={{ background: c.value }} onClick={() => setEditCardLabel(c.value)} title={c.label} />
              ))}
              <button type="button" className={styles.clearLabelBtn} onClick={() => setEditCardLabel('')} title="Etiketi kaldır">✕</button>
            </div>
          </div>

          <div className={styles.cardDetailSection}>
            <span className={styles.sectionLabel}>Son Teslim Tarihi</span>
            <input type="date" value={editCardDueDate} onChange={(e) => setEditCardDueDate(e.target.value)}
              style={{ padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }} />
          </div>

          <div className={styles.cardDetailSection}>
            <span className={styles.sectionLabel}>Aktivite Geçmişi</span>
            {cardActivities.length > 0 ? (
              <div className={styles.activityList}>
                {cardActivities.map((a) => (
                  <div key={a.id} className={styles.activityItem}>
                    <span className={styles.activityIcon}>{a.action === 'moved' ? '→' : a.action === 'created' ? '+' : '•'}</span>
                    <span className={styles.activityContent}>
                      {a.action === 'moved' ? `"${a.details.from}" → "${a.details.to}"` :
                        a.action === 'created' ? `Kart oluşturuldu` : a.action}
                    </span>
                    <span className={styles.activityTime}>{formatDate(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyActivity}>Henüz aktivite yok</div>
            )}
          </div>

          <div className={styles.deleteCardSection}>
            <Button variant="danger" size="sm" onClick={handleDeleteCard} fullWidth>🗑️ Kartı Sil</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

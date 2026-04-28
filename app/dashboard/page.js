'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/ui/Navbar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { getBoardsByUser, createBoard, deleteBoard, getColumnsByBoard, getCardsByColumn } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { formatDate } from '@/lib/utils';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState([]);
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');

  const loadBoards = useCallback(() => {
    if (user) {
      const userBoards = getBoardsByUser(user.id);
      setBoards(userBoards);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    loadBoards();
  }, [user, loading, router, loadBoards]);

  const handleCreateBoard = (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    const board = {
      id: uuidv4(),
      userId: user.id,
      title: newBoardTitle.trim(),
      description: newBoardDesc.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createBoard(board);
    loadBoards();
    setShowNewBoardModal(false);
    setNewBoardTitle('');
    setNewBoardDesc('');
  };

  const handleDeleteBoard = (e, boardId) => {
    e.stopPropagation();
    if (window.confirm('Bu board\'u silmek istediğinize emin misiniz? Tüm sütunlar ve kartlar da silinecektir.')) {
      deleteBoard(boardId);
      loadBoards();
    }
  };

  const getBoardStats = (boardId) => {
    const columns = getColumnsByBoard(boardId);
    let totalCards = 0;
    columns.forEach((col) => {
      totalCards += getCardsByColumn(col.id).length;
    });
    return { columns: columns.length, cards: totalCards };
  };

  if (loading || !user) return null;

  return (
    <div className={styles.dashboard}>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1>Board'larım</h1>
            <p>Projelerini yönet ve organize et</p>
          </div>
          <Button onClick={() => setShowNewBoardModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Yeni Board
          </Button>
        </div>

        <div className={styles.boardGrid}>
          <div
            className={styles.newBoardCard}
            onClick={() => setShowNewBoardModal(true)}
          >
            <div className={styles.newBoardIcon}>+</div>
            <span className={styles.newBoardLabel}>Yeni Board Oluştur</span>
          </div>

          {boards.map((board) => {
            const stats = getBoardStats(board.id);
            return (
              <div
                key={board.id}
                className={styles.boardCard}
                onClick={() => router.push(`/dashboard/board/${board.id}`)}
              >
                <div className={styles.boardCardHeader}>
                  <h3 className={styles.boardCardTitle}>{board.title}</h3>
                  <div className={styles.boardCardActions}>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={(e) => handleDeleteBoard(e, board.id)}
                      title="Board'u sil"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className={styles.boardCardDesc}>
                  {board.description || 'Açıklama eklenmemiş'}
                </p>

                <div className={styles.boardCardMeta}>
                  <span className={styles.metaItem}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                    {stats.columns} sütun
                  </span>
                  <span className={styles.metaItem}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="8" y1="9" x2="16" y2="9" />
                      <line x1="8" y1="13" x2="14" y2="13" />
                    </svg>
                    {stats.cards} kart
                  </span>
                  <span className={styles.metaItem}>
                    {formatDate(board.updatedAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {boards.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3 className={styles.emptyTitle}>Henüz board yok</h3>
            <p className={styles.emptyDesc}>
              İlk board'unu oluşturarak projelerini organize etmeye başla.
            </p>
          </div>
        )}
      </div>

      {/* New Board Modal */}
      <Modal
        isOpen={showNewBoardModal}
        onClose={() => setShowNewBoardModal(false)}
        title="Yeni Board Oluştur"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewBoardModal(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateBoard} disabled={!newBoardTitle.trim()}>
              Oluştur
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateBoard} className={styles.modalForm}>
          <Input
            label="Board Adı"
            placeholder="Örn: Sprint 1, Pazarlama Projesi"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Açıklama (opsiyonel)"
            textarea
            placeholder="Bu board ne hakkında?"
            value={newBoardDesc}
            onChange={(e) => setNewBoardDesc(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}

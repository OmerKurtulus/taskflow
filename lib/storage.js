/**
 * localStorage wrapper for TaskFlow
 * Provides type-safe CRUD operations for boards, columns, cards, and users
 */

const KEYS = {
  USERS: 'taskflow_users',
  CURRENT_USER: 'taskflow_current_user',
  BOARDS: 'taskflow_boards',
  COLUMNS: 'taskflow_columns',
  CARDS: 'taskflow_cards',
  ACTIVITY_LOGS: 'taskflow_activity_logs',
};

// ============================================
// Generic helpers
// ============================================

function getItem(key) {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setItem(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write failed:', e);
  }
}

// ============================================
// Users
// ============================================

export function getUsers() {
  return getItem(KEYS.USERS) || [];
}

export function saveUsers(users) {
  setItem(KEYS.USERS, users);
}

export function getCurrentUser() {
  return getItem(KEYS.CURRENT_USER);
}

export function setCurrentUser(user) {
  setItem(KEYS.CURRENT_USER, user);
}

export function clearCurrentUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.CURRENT_USER);
}

// ============================================
// Boards
// ============================================

export function getBoards() {
  return getItem(KEYS.BOARDS) || [];
}

export function saveBoards(boards) {
  setItem(KEYS.BOARDS, boards);
}

export function getBoardsByUser(userId) {
  return getBoards().filter((b) => b.userId === userId);
}

export function getBoardById(boardId) {
  return getBoards().find((b) => b.id === boardId) || null;
}

export function createBoard(board) {
  const boards = getBoards();
  boards.push(board);
  saveBoards(boards);
  return board;
}

export function updateBoard(boardId, updates) {
  const boards = getBoards();
  const idx = boards.findIndex((b) => b.id === boardId);
  if (idx === -1) return null;
  boards[idx] = { ...boards[idx], ...updates, updatedAt: new Date().toISOString() };
  saveBoards(boards);
  return boards[idx];
}

export function deleteBoard(boardId) {
  const boards = getBoards().filter((b) => b.id !== boardId);
  saveBoards(boards);
  // Also delete related columns and cards
  const columns = getColumns().filter((c) => c.boardId !== boardId);
  saveColumns(columns);
  const columnIds = getColumns()
    .filter((c) => c.boardId === boardId)
    .map((c) => c.id);
  const cards = getCards().filter((c) => !columnIds.includes(c.columnId));
  saveCards(cards);
  // Delete related activity logs
  const logs = getActivityLogs().filter((l) => l.boardId !== boardId);
  saveActivityLogs(logs);
}

// ============================================
// Columns
// ============================================

export function getColumns() {
  return getItem(KEYS.COLUMNS) || [];
}

export function saveColumns(columns) {
  setItem(KEYS.COLUMNS, columns);
}

export function getColumnsByBoard(boardId) {
  return getColumns()
    .filter((c) => c.boardId === boardId)
    .sort((a, b) => a.position - b.position);
}

export function createColumn(column) {
  const columns = getColumns();
  columns.push(column);
  saveColumns(columns);
  return column;
}

export function updateColumn(columnId, updates) {
  const columns = getColumns();
  const idx = columns.findIndex((c) => c.id === columnId);
  if (idx === -1) return null;
  columns[idx] = { ...columns[idx], ...updates };
  saveColumns(columns);
  return columns[idx];
}

export function deleteColumn(columnId) {
  const columns = getColumns().filter((c) => c.id !== columnId);
  saveColumns(columns);
  // Also delete cards in this column
  const cards = getCards().filter((c) => c.columnId !== columnId);
  saveCards(cards);
}

export function updateColumnsPositions(updatedColumns) {
  const columns = getColumns();
  updatedColumns.forEach((upd) => {
    const idx = columns.findIndex((c) => c.id === upd.id);
    if (idx !== -1) {
      columns[idx].position = upd.position;
      if (upd.boardId !== undefined) columns[idx].boardId = upd.boardId;
    }
  });
  saveColumns(columns);
}

// ============================================
// Cards
// ============================================

export function getCards() {
  return getItem(KEYS.CARDS) || [];
}

export function saveCards(cards) {
  setItem(KEYS.CARDS, cards);
}

export function getCardsByColumn(columnId) {
  return getCards()
    .filter((c) => c.columnId === columnId)
    .sort((a, b) => a.position - b.position);
}

export function getCardById(cardId) {
  return getCards().find((c) => c.id === cardId) || null;
}

export function createCard(card) {
  const cards = getCards();
  cards.push(card);
  saveCards(cards);
  return card;
}

export function updateCard(cardId, updates) {
  const cards = getCards();
  const idx = cards.findIndex((c) => c.id === cardId);
  if (idx === -1) return null;
  cards[idx] = { ...cards[idx], ...updates, updatedAt: new Date().toISOString() };
  saveCards(cards);
  return cards[idx];
}

export function deleteCard(cardId) {
  const cards = getCards().filter((c) => c.id !== cardId);
  saveCards(cards);
}

export function updateCardsPositions(updatedCards) {
  const cards = getCards();
  updatedCards.forEach((upd) => {
    const idx = cards.findIndex((c) => c.id === upd.id);
    if (idx !== -1) {
      cards[idx].position = upd.position;
      if (upd.columnId !== undefined) cards[idx].columnId = upd.columnId;
    }
  });
  saveCards(cards);
}

// ============================================
// Activity Logs
// ============================================

export function getActivityLogs() {
  return getItem(KEYS.ACTIVITY_LOGS) || [];
}

export function saveActivityLogs(logs) {
  setItem(KEYS.ACTIVITY_LOGS, logs);
}

export function getActivityLogsByCard(cardId) {
  return getActivityLogs()
    .filter((l) => l.cardId === cardId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getActivityLogsByBoard(boardId) {
  return getActivityLogs()
    .filter((l) => l.boardId === boardId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function addActivityLog(log) {
  const logs = getActivityLogs();
  logs.push(log);
  // Keep only last 500 logs per board to avoid localStorage bloat
  const boardLogs = logs.filter((l) => l.boardId === log.boardId);
  if (boardLogs.length > 500) {
    const oldestToKeep = boardLogs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 500);
    const otherLogs = logs.filter((l) => l.boardId !== log.boardId);
    saveActivityLogs([...otherLogs, ...oldestToKeep]);
  } else {
    saveActivityLogs(logs);
  }
}

// ============================================
// Seed Data (for first-time users)
// ============================================

export function seedDemoData(userId) {
  const { v4: uuidv4 } = require('uuid');
  
  const boardId = uuidv4();
  const col1Id = uuidv4();
  const col2Id = uuidv4();
  const col3Id = uuidv4();

  const board = {
    id: boardId,
    userId,
    title: 'Demo Proje',
    description: 'TaskFlow\'u keşfetmek için örnek bir board',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const columns = [
    { id: col1Id, boardId, title: 'Yapılacak', position: 1, color: '#3b82f6', createdAt: new Date().toISOString() },
    { id: col2Id, boardId, title: 'Devam Eden', position: 2, color: '#f59e0b', createdAt: new Date().toISOString() },
    { id: col3Id, boardId, title: 'Tamamlandı', position: 3, color: '#10b981', createdAt: new Date().toISOString() },
  ];

  const cards = [
    {
      id: uuidv4(), columnId: col1Id, title: 'Proje gereksinimlerini belirle',
      description: 'Ekiple toplantı yaparak proje kapsamını netleştir.',
      position: 1, labelColor: '#3b82f6', dueDate: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(), columnId: col1Id, title: 'Veritabanı şeması tasarla',
      description: 'Entity-relationship diyagramı oluştur.',
      position: 2, labelColor: '#a855f7', dueDate: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(), columnId: col2Id, title: 'UI mockup hazırla',
      description: 'Figma üzerinde ana sayfaların tasarımını yap.',
      position: 1, labelColor: '#ec4899', dueDate: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(), columnId: col3Id, title: 'Proje reposu oluştur',
      description: 'GitHub\'da repo oluştur ve README ekle.',
      position: 1, labelColor: '#22c55e', dueDate: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ];

  createBoard(board);
  columns.forEach((c) => createColumn(c));
  cards.forEach((c) => createCard(c));

  return board;
}

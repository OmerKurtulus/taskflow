/**
 * Utility functions for TaskFlow
 */

/**
 * Generate a position value between two existing positions (fractional indexing)
 * @param {number|null} before - Position of the item before the insertion point
 * @param {number|null} after - Position of the item after the insertion point
 * @returns {number} New position value
 */
export function generatePosition(before, after) {
  if (before === null && after === null) return 1;
  if (before === null) return after / 2;
  if (after === null) return before + 1;
  return (before + after) / 2;
}

/**
 * Normalize positions to avoid floating point precision issues
 * Called periodically when positions get too close together
 * @param {Array} items - Items with position property
 * @returns {Array} Items with normalized integer positions
 */
export function normalizePositions(items) {
  const sorted = [...items].sort((a, b) => a.position - b.position);
  return sorted.map((item, index) => ({
    ...item,
    position: (index + 1) * 1000,
  }));
}

/**
 * Check if positions need normalization
 * @param {Array} items - Items with position property  
 * @returns {boolean}
 */
export function needsNormalization(items) {
  if (items.length < 2) return false;
  const sorted = [...items].sort((a, b) => a.position - b.position);
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].position - sorted[i - 1].position;
    if (diff < 0.001) return true;
  }
  return false;
}

/**
 * Format a date string to a human-readable Turkish format
 * @param {string} dateStr - ISO date string
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} saat önce`;
  if (days < 7) return `${days} gün önce`;

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format a due date with urgency indicator
 * @param {string} dateStr - ISO date string
 * @returns {{ text: string, isOverdue: boolean, isUrgent: boolean }}
 */
export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((date - now) / 86400000);
  const text = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

  return {
    text,
    isOverdue: diffDays < 0,
    isUrgent: diffDays >= 0 && diffDays <= 2,
    isFuture: diffDays > 2,
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Get contrasting text color for a given background color
 */
export function getContrastColor(hexColor) {
  if (!hexColor) return '#ffffff';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a2e' : '#ffffff';
}

/**
 * Available column colors
 */
export const COLUMN_COLORS = [
  { value: '#3b82f6', label: 'Mavi' },
  { value: '#8b5cf6', label: 'Mor' },
  { value: '#10b981', label: 'Yeşil' },
  { value: '#f59e0b', label: 'Turuncu' },
  { value: '#ef4444', label: 'Kırmızı' },
  { value: '#ec4899', label: 'Pembe' },
  { value: '#06b6d4', label: 'Camgöbeği' },
  { value: '#6366f1', label: 'İndigo' },
];

/**
 * Available label colors
 */
export const LABEL_COLORS = [
  { value: '#ef4444', label: 'Kırmızı' },
  { value: '#f59e0b', label: 'Turuncu' },
  { value: '#eab308', label: 'Sarı' },
  { value: '#22c55e', label: 'Yeşil' },
  { value: '#3b82f6', label: 'Mavi' },
  { value: '#a855f7', label: 'Mor' },
  { value: '#ec4899', label: 'Pembe' },
  { value: '#06b6d4', label: 'Camgöbeği' },
];

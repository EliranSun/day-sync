import type { TimeString } from '../types';

export function timeToMinutes(time: TimeString): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): TimeString {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeDisplay(time: TimeString): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`;
}

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}

export function snapToIncrement(minutes: number, increment: number): number {
  return Math.round(minutes / increment) * increment;
}

/**
 * Compute column layout for overlapping time blocks.
 * Returns a map of block id → { column, totalColumns }.
 */
export function computeOverlapLayout(blocks: { id: string; startTime: string; endTime: string }[]): Map<string, { column: number; totalColumns: number }> {
  if (blocks.length === 0) return new Map();

  // Sort by start time, then by longer duration first
  const sorted = [...blocks].sort((a, b) => {
    const aStart = timeToMinutes(a.startTime);
    const bStart = timeToMinutes(b.startTime);
    if (aStart !== bStart) return aStart - bStart;
    return timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
  });

  // Build overlap groups: clusters of mutually overlapping blocks
  const groups: typeof sorted[] = [];
  let currentGroup: typeof sorted = [sorted[0]];
  let groupEnd = timeToMinutes(sorted[0].endTime);

  for (let i = 1; i < sorted.length; i++) {
    const blockStart = timeToMinutes(sorted[i].startTime);
    if (blockStart < groupEnd) {
      // Overlaps with current group
      currentGroup.push(sorted[i]);
      groupEnd = Math.max(groupEnd, timeToMinutes(sorted[i].endTime));
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
      groupEnd = timeToMinutes(sorted[i].endTime);
    }
  }
  groups.push(currentGroup);

  // Assign columns within each group
  const result = new Map<string, { column: number; totalColumns: number }>();

  for (const group of groups) {
    if (group.length === 1) {
      result.set(group[0].id, { column: 0, totalColumns: 1 });
      continue;
    }

    // Greedy column assignment
    const columns: number[] = []; // end time of last block in each column
    const assignments: number[] = [];

    for (const block of group) {
      const start = timeToMinutes(block.startTime);
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= start) {
          columns[c] = timeToMinutes(block.endTime);
          assignments.push(c);
          placed = true;
          break;
        }
      }
      if (!placed) {
        assignments.push(columns.length);
        columns.push(timeToMinutes(block.endTime));
      }
    }

    const totalColumns = columns.length;
    for (let i = 0; i < group.length; i++) {
      result.set(group[i].id, { column: assignments[i], totalColumns });
    }
  }

  return result;
}

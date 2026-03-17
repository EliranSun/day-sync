import type { DayData } from '../types';
import { STORAGE_PREFIX } from '../constants';

export function loadDayData(date: string): DayData {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + date);
    if (raw) {
      return JSON.parse(raw) as DayData;
    }
  } catch {
    // corrupted data, return default
  }
  return { date, expected: [], reality: [] };
}

export function saveDayData(data: DayData): void {
  localStorage.setItem(STORAGE_PREFIX + data.date, JSON.stringify(data));
}

export function copyPlanToDate(
  sourceDate: string,
  targetDate: string,
  mode: 'merge' | 'replace'
): void {
  const source = loadDayData(sourceDate);
  const target = loadDayData(targetDate);

  const clonedBlocks = source.expected.map(block => ({
    ...block,
    id: crypto.randomUUID(),
  }));

  const updatedTarget: DayData = {
    ...target,
    date: targetDate,
    expected: mode === 'replace'
      ? clonedBlocks
      : [...target.expected, ...clonedBlocks],
  };

  saveDayData(updatedTarget);
}

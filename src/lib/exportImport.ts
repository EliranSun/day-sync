import type { DayData } from '../types';
import { STORAGE_PREFIX } from '../constants';
import { saveDayData } from './storage';

interface ExportFormat {
  version: 1;
  exportedAt: string;
  days: DayData[];
}

export function getAllDayData(): DayData[] {
  const days: DayData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          days.push(JSON.parse(raw) as DayData);
        }
      } catch {
        // skip corrupted entry
      }
    }
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

export function exportAllData(): number {
  const days = getAllDayData();
  const payload: ExportFormat = {
    version: 1,
    exportedAt: new Date().toISOString(),
    days,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `day-sync-backup-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return days.length;
}

export interface ImportPreview {
  days: DayData[];
  dateFrom: string;
  dateTo: string;
}

export function parseImportFile(file: File): Promise<ImportPreview> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);

        // Support both the versioned format and a raw array
        let days: DayData[];
        if (Array.isArray(parsed)) {
          days = parsed as DayData[];
        } else if (parsed?.version === 1 && Array.isArray(parsed.days)) {
          days = (parsed as ExportFormat).days;
        } else {
          reject(new Error('Unrecognized file format'));
          return;
        }

        if (days.length === 0) {
          reject(new Error('No days found in file'));
          return;
        }

        const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
        resolve({
          days: sorted,
          dateFrom: sorted[0].date,
          dateTo: sorted[sorted.length - 1].date,
        });
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function importData(days: DayData[], mode: 'merge' | 'replace'): void {
  if (mode === 'replace') {
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((k) => localStorage.removeItem(k));
  }

  days.forEach((day) => saveDayData(day));
}

export type TimeString = string; // "HH:MM" 24h format

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface TimeBlock {
  id: string;
  startTime: TimeString;
  endTime: TimeString;
  label: string;
  color: string;
  categoryId?: string;
}

export interface DayData {
  date: string; // "YYYY-MM-DD"
  expected: TimeBlock[];
  reality: TimeBlock[];
}

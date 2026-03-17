export type TimeString = string; // "HH:MM" 24h format

export interface TimeBlock {
  id: string;
  startTime: TimeString;
  endTime: TimeString;
  label: string;
  color: string;
}

export interface DayData {
  date: string; // "YYYY-MM-DD"
  expected: TimeBlock[];
  reality: TimeBlock[];
}

import type { TimeBlock } from '../types';
import { timeToMinutes } from './time';

export function calculateMatchPercentage(
  expected: TimeBlock[],
  reality: TimeBlock[],
): number | null {
  if (expected.length === 0) return null;

  const expectedMinutes = new Map<number, string>();
  const realityMinutes = new Map<number, string>();

  for (const block of expected) {
    const start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    for (let m = start; m < end; m++) {
      expectedMinutes.set(m, block.label.trim().toLowerCase());
    }
  }

  for (const block of reality) {
    const start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    for (let m = start; m < end; m++) {
      realityMinutes.set(m, block.label.trim().toLowerCase());
    }
  }

  if (expectedMinutes.size === 0) return null;

  let matched = 0;
  for (const [minute, label] of expectedMinutes) {
    if (realityMinutes.get(minute) === label) matched++;
  }

  return Math.round((matched / expectedMinutes.size) * 100);
}

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 24; // midnight
export const SLOT_DURATION_MINUTES = 30;
export const TOTAL_SLOTS = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_DURATION_MINUTES; // 36
export const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60; // 1080
export const DAY_START_MINUTES = DAY_START_HOUR * 60; // 360

export const COLOR_PALETTE = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#EAB308' },
] as const;

export const DEFAULT_COLOR: string = COLOR_PALETTE[0].value;

export const DRAG_SNAP_MINUTES = 15;

export const STORAGE_PREFIX = 'day-sync:';

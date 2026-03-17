import { useState, useEffect } from 'react';
import { DAY_START_MINUTES, TOTAL_MINUTES } from '../constants';

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function CurrentTimeLine() {
  const [nowMinutes, setNowMinutes] = useState(getCurrentMinutes);

  useEffect(() => {
    const id = setInterval(() => setNowMinutes(getCurrentMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Hide if outside the visible range (6 AM – midnight)
  if (nowMinutes < DAY_START_MINUTES || nowMinutes >= DAY_START_MINUTES + TOTAL_MINUTES) {
    return null;
  }

  const topPct = ((nowMinutes - DAY_START_MINUTES) / TOTAL_MINUTES) * 100;

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
      style={{ top: `${topPct}%` }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
      <div className="flex-1 h-[2px] bg-red-500" />
    </div>
  );
}

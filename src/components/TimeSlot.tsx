import { formatTimeDisplay, minutesToTime } from '../lib/time';
import { TOTAL_SLOTS } from '../constants';

interface TimeSlotProps {
  minuteOffset: number;
  isHour: boolean;
  showLabel: boolean;
  onTap: (startTime: string, endTime: string) => void;
  slotDuration: number;
}

export function TimeSlot({ minuteOffset, isHour, showLabel, onTap, slotDuration }: TimeSlotProps) {
  const time = minutesToTime(minuteOffset);
  const endTime = minutesToTime(minuteOffset + slotDuration);

  const lineLeft = showLabel ? 'left-9' : 'left-0';

  return (
    <div
      className="relative flex items-start cursor-pointer active:bg-blue-50/40"
      style={{ height: `${100 / TOTAL_SLOTS}%` }}
      onClick={() => onTap(time, endTime)}
    >
      {showLabel && isHour && (
        <span className="absolute top-0 left-0 text-[9px] leading-none w-8 text-right pr-1 text-gray-400 font-medium">
          {formatTimeDisplay(time)}
        </span>
      )}
      <div
        className={`absolute ${lineLeft} right-0 top-0 ${
          isHour ? 'border-t border-gray-200' : 'border-t border-dashed border-gray-100'
        }`}
      />
    </div>
  );
}

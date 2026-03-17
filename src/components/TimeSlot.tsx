import { formatTimeDisplay, minutesToTime } from '../lib/time';
import { SLOT_HEIGHT_REM } from '../constants';

interface TimeSlotProps {
  minuteOffset: number;
  isHour: boolean;
  showLabel: boolean;
  isActive: boolean;
  onTap: (startTime: string, endTime: string) => void;
  slotDuration: number;
}

export function TimeSlot({ minuteOffset, isHour, showLabel, isActive, onTap, slotDuration }: TimeSlotProps) {
  const time = minutesToTime(minuteOffset);
  const endTime = minutesToTime(minuteOffset + slotDuration);

  const lineLeft = showLabel ? 'left-9' : 'left-0';

  return (
    <div
      data-minute-offset={minuteOffset}
      className="relative flex items-start cursor-pointer"
      style={{ height: `${SLOT_HEIGHT_REM}rem` }}
      onClick={() => onTap(time, endTime)}
    >
      {showLabel && isHour && (
        <span className="absolute top-0 left-0 text-[9px] leading-none w-8 text-right pr-1 text-gray-400 dark:text-gray-500 font-medium">
          {formatTimeDisplay(time)}
        </span>
      )}
      <div
        className={`absolute ${lineLeft} right-0 top-0 ${
          isHour ? 'border-t border-gray-200 dark:border-gray-700' : 'border-t border-dashed border-gray-100 dark:border-gray-800'
        }`}
      />
      {/* Tap feedback highlight — stays active while modal is open */}
      {isActive && (
        <div
          className={`absolute ${lineLeft} right-0 inset-y-0 rounded-sm bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700`}
        />
      )}
    </div>
  );
}

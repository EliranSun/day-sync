import { formatDate, isToday, addDays, getTodayString } from '../lib/time';

interface DatePickerProps {
  date: string;
  onChange: (date: string) => void;
}

export function DatePicker({ date, onChange }: DatePickerProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <button
        onClick={() => onChange(addDays(date, -1))}
        className="p-2 rounded-lg active:bg-gray-100 text-gray-600"
        aria-label="Previous day"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4l-6 6 6 6" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-gray-900">{formatDate(date)}</span>
        {!isToday(date) && (
          <button
            onClick={() => onChange(getTodayString())}
            className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={() => onChange(addDays(date, 1))}
        className="p-2 rounded-lg active:bg-gray-100 text-gray-600"
        aria-label="Next day"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 4l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}

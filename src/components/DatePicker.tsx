import { formatDate, isToday, addDays, getTodayString } from '../lib/time';

interface DatePickerProps {
  date: string;
  onChange: (date: string) => void;
  onCopyPlan?: () => void;
  hasBlocks?: boolean;
  notificationPermission?: NotificationPermission;
  onNotificationToggle?: () => void;
  onDataManagement?: () => void;
}

export function DatePicker({ date, onChange, onCopyPlan, hasBlocks, notificationPermission, onNotificationToggle, onDataManagement }: DatePickerProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
      <button
        onClick={() => onChange(addDays(date, -1))}
        className="p-2 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 text-gray-600 dark:text-gray-400"
        aria-label="Previous day"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4l-6 6 6 6" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{formatDate(date)}</span>
        {!isToday(date) && (
          <button
            onClick={() => onChange(getTodayString())}
            className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
          >
            Today
          </button>
        )}
        {hasBlocks && onCopyPlan && (
          <button
            onClick={onCopyPlan}
            className="p-1.5 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 text-gray-400 dark:text-gray-500"
            aria-label="Copy plan to another day"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="12" height="12" rx="2" />
              <path d="M2 14V4a2 2 0 012-2h10" />
            </svg>
          </button>
        )}
        {onNotificationToggle && notificationPermission !== 'denied' && (
          <button
            onClick={onNotificationToggle}
            className={`p-1.5 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 ${
              notificationPermission === 'granted'
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
            aria-label={notificationPermission === 'granted' ? 'Notifications on' : 'Enable notifications'}
          >
            {notificationPermission === 'granted' ? (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" stroke="none">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                <path d="M10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
              </svg>
            )}
          </button>
        )}
        {onDataManagement && (
          <button
            onClick={onDataManagement}
            className="p-1.5 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 text-gray-400 dark:text-gray-500"
            aria-label="Export or import data"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="10" cy="5" rx="7" ry="2.5" />
              <path d="M3 5v4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V5" />
              <path d="M3 9v4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V9" />
            </svg>
          </button>
        )}
      </div>

      <button
        onClick={() => onChange(addDays(date, 1))}
        className="p-2 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 text-gray-600 dark:text-gray-400"
        aria-label="Next day"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 4l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}

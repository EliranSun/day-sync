import { useState, useEffect, useRef } from 'react';
import { addDays, formatDate } from '../lib/time';
import { loadDayData, copyPlanToDate } from '../lib/storage';

interface CopyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDate: string;
  blockCount: number;
  onCopyComplete: (targetDate: string) => void;
}

export function CopyPlanModal({
  isOpen,
  onClose,
  sourceDate,
  blockCount,
  onCopyComplete,
}: CopyPlanModalProps) {
  const tomorrow = addDays(sourceDate, 1);
  const [targetDate, setTargetDate] = useState(tomorrow);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [targetHasBlocks, setTargetHasBlocks] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const t = addDays(sourceDate, 1);
      setTargetDate(t);
      setMode('merge');
      setTargetHasBlocks(loadDayData(t).expected.length > 0);
    }
  }, [isOpen, sourceDate]);

  useEffect(() => {
    if (isOpen) {
      setTargetHasBlocks(loadDayData(targetDate).expected.length > 0);
    }
  }, [targetDate, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (date: string) => {
    copyPlanToDate(sourceDate, date, mode);
    onCopyComplete(date);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/40"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-gray-800 rounded-t-2xl p-5 pb-8 shadow-xl">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Copy Plan</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
            {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
          </span>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          From {formatDate(sourceDate)}
        </p>

        {/* Copy to Tomorrow */}
        <button
          onClick={() => handleCopy(tomorrow)}
          className="w-full py-3 rounded-xl text-white bg-blue-500 font-medium text-base active:bg-blue-600"
        >
          Copy to Tomorrow
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 dark:text-gray-500">or choose a date</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Date picker + Copy button */}
        <div className="flex gap-3">
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="flex-1 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
          />
          <button
            onClick={() => handleCopy(targetDate)}
            disabled={targetDate === sourceDate}
            className="px-6 py-2.5 rounded-xl text-white bg-blue-500 font-medium text-sm active:bg-blue-600 disabled:opacity-40"
          >
            Copy
          </button>
        </div>

        {/* Merge / Replace toggle */}
        {targetHasBlocks && (
          <div className="mt-4">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
              Target day already has blocks
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('merge')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === 'merge'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Merge
              </button>
              <button
                onClick={() => setMode('replace')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === 'replace'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Replace
              </button>
            </div>
          </div>
        )}

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 font-medium text-sm active:bg-gray-200 dark:active:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

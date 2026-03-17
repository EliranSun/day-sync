import { useState, useEffect, useRef } from 'react';
import type { TimeBlock, TimeString } from '../types';
import { CATEGORIES, DEFAULT_COLOR } from '../constants';

interface BlockFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: Omit<TimeBlock, 'id'>) => void;
  onUpdate?: (block: TimeBlock) => void;
  onDelete?: (blockId: string) => void;
  editBlock?: TimeBlock | null;
  defaultStartTime?: TimeString;
  defaultEndTime?: TimeString;
}

export function BlockFormModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  editBlock,
  defaultStartTime = '09:00',
  defaultEndTime = '09:30',
}: BlockFormModalProps) {
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editBlock) {
        setLabel(editBlock.label);
        setStartTime(editBlock.startTime);
        setEndTime(editBlock.endTime);
        setColor(editBlock.color);
        setSelectedCategoryId(editBlock.categoryId ?? null);
      } else {
        setLabel('');
        setStartTime(defaultStartTime);
        setEndTime(defaultEndTime);
        setColor(DEFAULT_COLOR);
        setSelectedCategoryId(null);
      }
    }
  }, [isOpen, editBlock, defaultStartTime, defaultEndTime]);

  // Handle visual viewport resize (keyboard open/close)
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      if (sheetRef.current) {
        const offset = window.innerHeight - vv.height - vv.offsetTop;
        sheetRef.current.style.transform = offset > 0 ? `translateY(-${offset}px)` : '';
      }
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isValid = label.trim().length > 0 && startTime < endTime;

  const handleCategorySelect = (catId: string) => {
    if (selectedCategoryId === catId) {
      setSelectedCategoryId(null);
      setLabel('');
      setColor(DEFAULT_COLOR);
    } else {
      const cat = CATEGORIES.find(c => c.id === catId)!;
      setSelectedCategoryId(catId);
      setLabel(`${cat.emoji} ${cat.label}`);
      setColor(cat.color);
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    if (editBlock && onUpdate) {
      onUpdate({ ...editBlock, label: label.trim(), startTime, endTime, color, categoryId: selectedCategoryId ?? undefined });
    } else {
      onSave({ label: label.trim(), startTime, endTime, color, categoryId: selectedCategoryId ?? undefined });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editBlock && onDelete) {
      onDelete(editBlock.id);
      onClose();
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/40"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        ref={sheetRef}
        className="absolute bottom-0 inset-x-0 bg-white dark:bg-gray-800 rounded-t-2xl p-5 pb-8 shadow-xl transition-transform duration-200"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        {/* Label */}
        <input
          type="text"
          placeholder="Custom activity (or pick a category)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full text-lg font-medium bg-gray-50 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          autoFocus={false}
        />

        {/* Time pickers */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
            />
          </div>
        </div>

        {/* Category selector */}
        <div className="mt-4">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: selectedCategoryId === cat.id ? cat.color : `${cat.color}20`,
                  color: selectedCategoryId === cat.id ? 'white' : cat.color,
                  boxShadow: selectedCategoryId === cat.id ? `0 0 0 2px ${isDark ? '#1f2937' : 'white'}, 0 0 0 3px ${cat.color}` : 'none',
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {editBlock && onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl text-red-500 bg-red-50 dark:bg-red-900/30 font-medium text-sm active:bg-red-100 dark:active:bg-red-900/50"
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 font-medium text-sm active:bg-gray-200 dark:active:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-6 py-2.5 rounded-xl text-white bg-blue-500 font-medium text-sm active:bg-blue-600 disabled:opacity-40 disabled:active:bg-blue-500"
          >
            {editBlock ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

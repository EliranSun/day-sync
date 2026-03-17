import { useState, useCallback, useRef, useEffect } from 'react';
import type { TimeBlock as TimeBlockType } from './types';
import { getTodayString, isToday, timeToMinutes } from './lib/time';
import { DAY_START_MINUTES, TOTAL_MINUTES, SLOT_HEIGHT_REM, TOTAL_SLOTS } from './constants';
import { useDayData } from './hooks/useDayData';
import { DatePicker } from './components/DatePicker';
import { Timeline } from './components/Timeline';
import { CurrentTimeLine } from './components/CurrentTimeLine';
import { BlockFormModal } from './components/BlockFormModal';
import { MatchBadge } from './components/MatchBadge';
import { CopyPlanModal } from './components/CopyPlanModal';

type TimelineType = 'expected' | 'reality';

function App() {
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const { dayData, addBlock, updateBlock, deleteBlock, moveBlock } = useDayData(selectedDate);

  // Track the X coordinate of the boundary between the two timelines
  const timelinesRef = useRef<HTMLDivElement>(null);
  const [timelineCenterX, setTimelineCenterX] = useState(0);

  useEffect(() => {
    const el = timelinesRef.current;
    if (!el) return;
    const updateCenter = () => {
      const rect = el.getBoundingClientRect();
      setTimelineCenterX(rect.left + rect.width / 2);
    };
    updateCenter();
    const ro = new ResizeObserver(updateCenter);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-scroll to current time on mount (for today)
  useEffect(() => {
    const el = timelinesRef.current;
    if (!el || !isToday(selectedDate)) return;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const totalHeightPx = TOTAL_SLOTS * SLOT_HEIGHT_REM * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const scrollTarget = ((nowMinutes - DAY_START_MINUTES) / TOTAL_MINUTES) * totalHeightPx;
    // Center the current time in the viewport
    el.scrollTop = Math.max(0, scrollTarget - el.clientHeight / 3);
  }, [selectedDate]);

  // Copy modal state
  const [copyModalOpen, setCopyModalOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlockType | null>(null);
  const [defaultStart, setDefaultStart] = useState('09:00');
  const [defaultEnd, setDefaultEnd] = useState('09:30');
  const [modalType, setModalType] = useState<TimelineType>('expected');

  // Track which slot is highlighted (persists while modal is open)
  const [activeSlot, setActiveSlot] = useState<{ type: TimelineType; minuteOffset: number } | null>(null);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setActiveSlot(null);
  }, []);

  const openCreateModal = useCallback((type: TimelineType, startTime: string, endTime: string) => {
    setModalType(type);
    setEditingBlock(null);
    setDefaultStart(startTime);
    setDefaultEnd(endTime);
    const minuteOffset = timeToMinutes(startTime as `${string}:${string}`);
    setActiveSlot({ type, minuteOffset });
    setModalOpen(true);

    // Scroll the tapped slot into view above the modal
    requestAnimationFrame(() => {
      const slot = timelinesRef.current?.querySelector(`[data-minute-offset="${minuteOffset}"]`);
      slot?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }, []);

  const openEditModal = useCallback((type: TimelineType, block: TimeBlockType) => {
    setModalType(type);
    setEditingBlock(block);
    setActiveSlot(null);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback((block: Omit<TimeBlockType, 'id'>) => {
    addBlock(modalType, block);
  }, [addBlock, modalType]);

  const handleUpdate = useCallback((block: TimeBlockType) => {
    updateBlock(modalType, block);
  }, [updateBlock, modalType]);

  const handleDelete = useCallback((blockId: string) => {
    deleteBlock(modalType, blockId);
  }, [deleteBlock, modalType]);

  const handleDragEnd = useCallback((type: TimelineType, block: TimeBlockType) => {
    updateBlock(type, block);
  }, [updateBlock]);

  const handleCrossTimelineDrop = useCallback((fromType: TimelineType, block: TimeBlockType) => {
    const toType: TimelineType = fromType === 'expected' ? 'reality' : 'expected';
    moveBlock(fromType, toType, block);
  }, [moveBlock]);

  return (
    <div className="h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <DatePicker
        date={selectedDate}
        onChange={setSelectedDate}
        onCopyPlan={() => setCopyModalOpen(true)}
        hasBlocks={dayData.expected.length > 0}
      />

      {/* Column headers */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex-1 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Plan
        </div>
        <div className="flex-1 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Reality
        </div>
      </div>

      {/* Timelines — always side by side, scrollable */}
      <div ref={timelinesRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="relative flex" style={{ paddingBottom: '60vh' }}>
          {isToday(selectedDate) && <CurrentTimeLine />}
          <div className="flex-1 border-r border-gray-200 dark:border-gray-700">
            <Timeline
              type="expected"
              blocks={dayData.expected}
              showLabels={true}
              activeSlot={activeSlot?.type === 'expected' ? activeSlot.minuteOffset : null}
              onSlotTap={(s, e) => openCreateModal('expected', s, e)}
              onBlockTap={(b) => openEditModal('expected', b)}
              onBlockDragEnd={(b) => handleDragEnd('expected', b)}
              onBlockCrossTimelineDrop={(b) => handleCrossTimelineDrop('expected', b)}
              timelineCenterX={timelineCenterX}
            />
          </div>
          <div className="flex-1">
            <Timeline
              type="reality"
              blocks={dayData.reality}
              showLabels={false}
              activeSlot={activeSlot?.type === 'reality' ? activeSlot.minuteOffset : null}
              onSlotTap={(s, e) => openCreateModal('reality', s, e)}
              onBlockTap={(b) => openEditModal('reality', b)}
              onBlockDragEnd={(b) => handleDragEnd('reality', b)}
              onBlockCrossTimelineDrop={(b) => handleCrossTimelineDrop('reality', b)}
              timelineCenterX={timelineCenterX}
            />
          </div>
        </div>
      </div>

      <BlockFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        editBlock={editingBlock}
        defaultStartTime={defaultStart}
        defaultEndTime={defaultEnd}
      />

      <CopyPlanModal
        isOpen={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        sourceDate={selectedDate}
        blockCount={dayData.expected.length}
        onCopyComplete={(targetDate) => {
          setCopyModalOpen(false);
          setSelectedDate(targetDate);
        }}
      />

      <MatchBadge expected={dayData.expected} reality={dayData.reality} />
    </div>
  );
}

export default App;

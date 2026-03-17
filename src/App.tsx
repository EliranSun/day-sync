import { useState, useCallback, useRef, useEffect } from 'react';
import type { TimeBlock as TimeBlockType } from './types';
import { getTodayString } from './lib/time';
import { useDayData } from './hooks/useDayData';
import { DatePicker } from './components/DatePicker';
import { Timeline } from './components/Timeline';
import { BlockFormModal } from './components/BlockFormModal';
import { MatchBadge } from './components/MatchBadge';

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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlockType | null>(null);
  const [defaultStart, setDefaultStart] = useState('09:00');
  const [defaultEnd, setDefaultEnd] = useState('09:30');
  const [modalType, setModalType] = useState<TimelineType>('expected');

  const openCreateModal = useCallback((type: TimelineType, startTime: string, endTime: string) => {
    setModalType(type);
    setEditingBlock(null);
    setDefaultStart(startTime);
    setDefaultEnd(endTime);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((type: TimelineType, block: TimeBlockType) => {
    setModalType(type);
    setEditingBlock(block);
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
    <div className="h-[100dvh] flex flex-col bg-gray-50 overflow-hidden">
      <DatePicker date={selectedDate} onChange={setSelectedDate} />

      {/* Column headers */}
      <div className="flex border-b border-gray-200 bg-white">
        <div className="flex-1 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-blue-600">
          Plan
        </div>
        <div className="flex-1 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-purple-600">
          Reality
        </div>
      </div>

      {/* Timelines — always side by side */}
      <div ref={timelinesRef} className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200">
          <Timeline
            type="expected"
            blocks={dayData.expected}
            showLabels={true}
            onSlotTap={(s, e) => openCreateModal('expected', s, e)}
            onBlockTap={(b) => openEditModal('expected', b)}
            onBlockDragEnd={(b) => handleDragEnd('expected', b)}
            onBlockCrossTimelineDrop={(b) => handleCrossTimelineDrop('expected', b)}
            timelineCenterX={timelineCenterX}
          />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <Timeline
            type="reality"
            blocks={dayData.reality}
            showLabels={false}
            onSlotTap={(s, e) => openCreateModal('reality', s, e)}
            onBlockTap={(b) => openEditModal('reality', b)}
            onBlockDragEnd={(b) => handleDragEnd('reality', b)}
            onBlockCrossTimelineDrop={(b) => handleCrossTimelineDrop('reality', b)}
            timelineCenterX={timelineCenterX}
          />
        </div>
      </div>

      <BlockFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        editBlock={editingBlock}
        defaultStartTime={defaultStart}
        defaultEndTime={defaultEnd}
      />

      <MatchBadge expected={dayData.expected} reality={dayData.reality} />
    </div>
  );
}

export default App;

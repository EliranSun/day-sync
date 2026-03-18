import { useRef, useState, useEffect, useMemo } from 'react';
import type { TimeBlock as TimeBlockType } from '../types';
import { DAY_START_HOUR, SLOT_DURATION_MINUTES, TOTAL_SLOTS } from '../constants';
import { computeOverlapLayout } from '../lib/time';
import { TimeSlot } from './TimeSlot';
import { TimeBlock } from './TimeBlock';
import { EmptyState } from './EmptyState';

interface TimelineProps {
  type: 'expected' | 'reality';
  blocks: TimeBlockType[];
  showLabels: boolean;
  activeSlot: number | null;
  onSlotTap: (startTime: string, endTime: string) => void;
  onBlockTap: (block: TimeBlockType) => void;
  onBlockDragEnd: (block: TimeBlockType) => void;
  onBlockCrossTimelineDrop: (block: TimeBlockType) => void;
  timelineCenterX: number;
}

export function Timeline({ type, blocks, showLabels, activeSlot, onSlotTap, onBlockTap, onBlockDragEnd, onBlockCrossTimelineDrop, timelineCenterX }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slots = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const minuteOffset = DAY_START_HOUR * 60 + i * SLOT_DURATION_MINUTES;
    const isHour = minuteOffset % 60 === 0;
    slots.push(
      <TimeSlot
        key={minuteOffset}
        minuteOffset={minuteOffset}
        isHour={isHour}
        showLabel={showLabels}
        isActive={activeSlot === minuteOffset}
        onTap={onSlotTap}
        slotDuration={SLOT_DURATION_MINUTES}
      />,
    );
  }

  const overlapLayout = useMemo(() => computeOverlapLayout(blocks), [blocks]);

  // On mobile (no labels), blocks fill the full width; with labels, offset from them
  const blocksLeftClass = showLabels ? 'left-9' : 'left-0';

  return (
    <div ref={containerRef} className="relative">
      {slots}
      <div className={`absolute inset-y-0 ${blocksLeftClass} right-0 pointer-events-none`}>
        {blocks.map(block => {
          const layout = overlapLayout.get(block.id) || { column: 0, totalColumns: 1 };
          return (
            <TimeBlock
              key={block.id}
              block={block}
              onTap={onBlockTap}
              onDragEnd={onBlockDragEnd}
              onCrossTimelineDrop={onBlockCrossTimelineDrop}
              containerHeight={containerHeight}
              timelineCenterX={timelineCenterX}
              timelineType={type}
              column={layout.column}
              totalColumns={layout.totalColumns}
            />
          );
        })}
      </div>
      {blocks.length === 0 && <EmptyState type={type} />}
    </div>
  );
}

import { useRef, useCallback, useState } from 'react';
import type { TimeBlock as TimeBlockType } from '../types';
import { DAY_START_MINUTES, TOTAL_MINUTES, DRAG_SNAP_MINUTES } from '../constants';
import { timeToMinutes, minutesToTime, formatTimeDisplay, snapToIncrement } from '../lib/time';

interface TimeBlockProps {
  block: TimeBlockType;
  onTap: (block: TimeBlockType) => void;
  onDragEnd: (block: TimeBlockType) => void;
  onCrossTimelineDrop: (block: TimeBlockType) => void;
  containerHeight: number;
  timelineCenterX: number;
  timelineType: 'expected' | 'reality';
  column: number;
  totalColumns: number;
}

export function TimeBlock({ block, onTap, onDragEnd, onCrossTimelineDrop, containerHeight, timelineCenterX, timelineType, column, totalColumns }: TimeBlockProps) {
  const dragState = useRef<{
    startY: number;
    startX: number;
    startMinutes: number;
    duration: number;
    isDragging: boolean;
    crossedTimeline: boolean;
  } | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [isCrossing, setIsCrossing] = useState(false);

  const startMin = timeToMinutes(block.startTime);
  const endMin = timeToMinutes(block.endTime);
  const duration = endMin - startMin;

  const topPct = ((startMin - DAY_START_MINUTES) / TOTAL_MINUTES) * 100;
  const heightPct = (duration / TOTAL_MINUTES) * 100;

  const pixelsPerMinute = containerHeight / TOTAL_MINUTES;

  const isCrossingTimeline = useCallback((clientX: number) => {
    if (timelineType === 'expected') {
      return clientX > timelineCenterX;
    }
    return clientX < timelineCenterX;
  }, [timelineCenterX, timelineType]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = blockRef.current;
    if (!el) return;

    el.setPointerCapture(e.pointerId);
    dragState.current = {
      startY: e.clientY,
      startX: e.clientX,
      startMinutes: startMin,
      duration,
      isDragging: false,
      crossedTimeline: false,
    };
  }, [startMin, duration]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    const el = blockRef.current;
    if (!ds || !el) return;

    const deltaY = e.clientY - ds.startY;
    const deltaX = e.clientX - ds.startX;
    if (!ds.isDragging && Math.abs(deltaY) < 5 && Math.abs(deltaX) < 5) return;
    ds.isDragging = true;

    const deltaMinutes = deltaY / pixelsPerMinute;
    const newStart = snapToIncrement(
      Math.max(DAY_START_MINUTES, Math.min(ds.startMinutes + deltaMinutes, DAY_START_MINUTES + TOTAL_MINUTES - ds.duration)),
      DRAG_SNAP_MINUTES,
    );
    const newTopPct = ((newStart - DAY_START_MINUTES) / TOTAL_MINUTES) * 100;

    const crossed = isCrossingTimeline(e.clientX);
    ds.crossedTimeline = crossed;
    setIsCrossing(crossed);

    el.style.top = `${newTopPct}%`;
    el.style.transform = crossed ? 'scale(1.05)' : 'scale(1.02)';
    el.style.boxShadow = crossed ? '0 6px 24px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.15)';
    el.style.zIndex = '20';
    el.style.opacity = crossed ? '0.75' : '1';
  }, [pixelsPerMinute, isCrossingTimeline]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    const el = blockRef.current;
    if (!ds || !el) return;

    el.releasePointerCapture(e.pointerId);
    setIsCrossing(false);

    if (ds.isDragging) {
      const deltaY = e.clientY - ds.startY;
      const deltaMinutes = deltaY / pixelsPerMinute;
      const newStart = snapToIncrement(
        Math.max(DAY_START_MINUTES, Math.min(ds.startMinutes + deltaMinutes, DAY_START_MINUTES + TOTAL_MINUTES - ds.duration)),
        DRAG_SNAP_MINUTES,
      );
      const newEnd = newStart + ds.duration;

      el.style.transform = '';
      el.style.boxShadow = '';
      el.style.zIndex = '';
      el.style.opacity = '';

      const updatedBlock = {
        ...block,
        startTime: minutesToTime(newStart),
        endTime: minutesToTime(newEnd),
      };

      if (ds.crossedTimeline) {
        onCrossTimelineDrop(updatedBlock);
      } else {
        onDragEnd(updatedBlock);
      }
    } else {
      onTap(block);
    }

    dragState.current = null;
  }, [block, onTap, onDragEnd, onCrossTimelineDrop, pixelsPerMinute]);

  const isShort = heightPct < 4;

  return (
    <div
      ref={blockRef}
      className="absolute rounded-lg px-2 overflow-hidden cursor-grab active:cursor-grabbing select-none pointer-events-auto"
      style={{
        top: `${topPct}%`,
        height: `${heightPct}%`,
        left: `calc(${(column / totalColumns) * 100}% + 4px)`,
        width: `calc(${100 / totalColumns}% - 8px)`,
        backgroundColor: block.color,
        touchAction: 'none',
        minHeight: '18px',
        outline: isCrossing ? '2px dashed rgba(255,255,255,0.8)' : 'none',
        transition: 'outline 0.15s ease',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={e => e.stopPropagation()}
    >
      <div className={`flex ${isShort ? 'flex-row items-center gap-1' : 'flex-col justify-center'} h-full`}>
        <span className="text-white font-medium text-xs leading-tight truncate">
          {block.label}
        </span>
        {!isShort && (
          <span className="text-white/75 text-[10px] leading-tight">
            {formatTimeDisplay(block.startTime)} – {formatTimeDisplay(block.endTime)}
          </span>
        )}
      </div>
    </div>
  );
}

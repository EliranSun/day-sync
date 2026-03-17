import { useRef, useCallback } from 'react';
import type { TimeBlock as TimeBlockType } from '../types';
import { DAY_START_MINUTES, TOTAL_MINUTES, DRAG_SNAP_MINUTES } from '../constants';
import { timeToMinutes, minutesToTime, formatTimeDisplay, snapToIncrement } from '../lib/time';

interface TimeBlockProps {
  block: TimeBlockType;
  onTap: (block: TimeBlockType) => void;
  onDragEnd: (block: TimeBlockType) => void;
  containerHeight: number;
}

export function TimeBlock({ block, onTap, onDragEnd, containerHeight }: TimeBlockProps) {
  const dragState = useRef<{
    startY: number;
    startMinutes: number;
    duration: number;
    isDragging: boolean;
  } | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  const startMin = timeToMinutes(block.startTime);
  const endMin = timeToMinutes(block.endTime);
  const duration = endMin - startMin;

  const topPct = ((startMin - DAY_START_MINUTES) / TOTAL_MINUTES) * 100;
  const heightPct = (duration / TOTAL_MINUTES) * 100;

  const pixelsPerMinute = containerHeight / TOTAL_MINUTES;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = blockRef.current;
    if (!el) return;

    el.setPointerCapture(e.pointerId);
    dragState.current = {
      startY: e.clientY,
      startMinutes: startMin,
      duration,
      isDragging: false,
    };
  }, [startMin, duration]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    const el = blockRef.current;
    if (!ds || !el) return;

    const deltaY = e.clientY - ds.startY;
    if (!ds.isDragging && Math.abs(deltaY) < 5) return;
    ds.isDragging = true;

    const deltaMinutes = deltaY / pixelsPerMinute;
    const newStart = snapToIncrement(
      Math.max(DAY_START_MINUTES, Math.min(ds.startMinutes + deltaMinutes, DAY_START_MINUTES + TOTAL_MINUTES - ds.duration)),
      DRAG_SNAP_MINUTES,
    );
    const newTopPct = ((newStart - DAY_START_MINUTES) / TOTAL_MINUTES) * 100;

    el.style.top = `${newTopPct}%`;
    el.style.transform = 'scale(1.02)';
    el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    el.style.zIndex = '20';
  }, [pixelsPerMinute]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    const el = blockRef.current;
    if (!ds || !el) return;

    el.releasePointerCapture(e.pointerId);

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

      onDragEnd({
        ...block,
        startTime: minutesToTime(newStart),
        endTime: minutesToTime(newEnd),
      });
    } else {
      onTap(block);
    }

    dragState.current = null;
  }, [block, onTap, onDragEnd, pixelsPerMinute]);

  const isShort = heightPct < 4;

  return (
    <div
      ref={blockRef}
      className="absolute left-0 right-0 mx-1 rounded-lg px-2 overflow-hidden cursor-grab active:cursor-grabbing select-none pointer-events-auto"
      style={{
        top: `${topPct}%`,
        height: `${heightPct}%`,
        backgroundColor: block.color,
        touchAction: 'none',
        minHeight: '18px',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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

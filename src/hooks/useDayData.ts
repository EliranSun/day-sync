import { useState, useCallback, useEffect } from 'react';
import type { TimeBlock, DayData } from '../types';
import { loadDayData, saveDayData } from '../lib/storage';

export function useDayData(date: string) {
  const [dayData, setDayData] = useState<DayData>(() => loadDayData(date));

  useEffect(() => {
    setDayData(loadDayData(date));
  }, [date]);

  const persist = useCallback((data: DayData) => {
    setDayData(data);
    saveDayData(data);
  }, []);

  const addBlock = useCallback((type: 'expected' | 'reality', block: Omit<TimeBlock, 'id'>) => {
    setDayData(prev => {
      const newBlock: TimeBlock = { ...block, id: crypto.randomUUID() };
      const updated = { ...prev, [type]: [...prev[type], newBlock] };
      saveDayData(updated);
      return updated;
    });
  }, []);

  const updateBlock = useCallback((type: 'expected' | 'reality', block: TimeBlock) => {
    setDayData(prev => {
      const updated = {
        ...prev,
        [type]: prev[type].map(b => (b.id === block.id ? block : b)),
      };
      saveDayData(updated);
      return updated;
    });
  }, []);

  const deleteBlock = useCallback((type: 'expected' | 'reality', blockId: string) => {
    setDayData(prev => {
      const updated = {
        ...prev,
        [type]: prev[type].filter(b => b.id !== blockId),
      };
      saveDayData(updated);
      return updated;
    });
  }, []);

  const moveBlock = useCallback((fromType: 'expected' | 'reality', toType: 'expected' | 'reality', block: TimeBlock) => {
    setDayData(prev => {
      const updated = {
        ...prev,
        [fromType]: prev[fromType].filter(b => b.id !== block.id),
        [toType]: [...prev[toType], { ...block, id: crypto.randomUUID() }],
      };
      saveDayData(updated);
      return updated;
    });
  }, []);

  return { dayData, addBlock, updateBlock, deleteBlock, moveBlock, persist };
}

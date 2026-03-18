import { useEffect, useCallback, useRef, useState } from 'react';
import type { TimeBlock } from '../types';
import { getTodayString } from '../lib/time';

function isSupported() {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator;
}

export function useNotifications(expectedBlocks: TimeBlock[], selectedDate: string) {
  const [permission, setPermission] = useState<NotificationPermission>(
    () => (isSupported() ? Notification.permission : 'denied')
  );
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);

  const scheduleForToday = useCallback(async (blocks: TimeBlock[]) => {
    clearTimers();
    if (!isSupported() || Notification.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    const now = Date.now();

    for (const block of blocks) {
      const [hours, minutes] = block.startTime.split(':').map(Number);
      const blockTime = new Date();
      blockTime.setHours(hours, minutes, 0, 0);
      const msUntil = blockTime.getTime() - now;

      if (msUntil <= 0) continue;

      const timer = setTimeout(() => {
        registration.showNotification(`⏰ ${block.label}`, {
          body: `${block.startTime} – ${block.endTime}`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: block.id,
        });
      }, msUntil);

      timersRef.current.set(block.id, timer);
    }
  }, [clearTimers]);

  const requestPermission = useCallback(async () => {
    if (!isSupported()) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  // Re-schedule whenever blocks or date changes (only schedules for today)
  useEffect(() => {
    if (permission === 'granted' && selectedDate === getTodayString()) {
      scheduleForToday(expectedBlocks);
    } else {
      clearTimers();
    }
    return clearTimers;
  }, [expectedBlocks, selectedDate, permission, scheduleForToday, clearTimers]);

  return {
    permission,
    requestPermission,
    supported: isSupported(),
  };
}

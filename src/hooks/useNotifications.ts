import { useEffect, useCallback, useRef, useState } from 'react';
import type { TimeBlock } from '../types';
import { getTodayString } from '../lib/time';

function isSupported() {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator;
}

/** How often we check if a block is about to start (ms) */
const POLL_INTERVAL = 30_000;
/** How many minutes before a block starts to fire the notification */
const LEAD_MINUTES = 2;

export function useNotifications(expectedBlocks: TimeBlock[], selectedDate: string) {
  const [permission, setPermission] = useState<NotificationPermission>(
    () => (isSupported() ? Notification.permission : 'denied')
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const showNotification = useCallback(async (title: string, body: string, tag: string) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag,
      });
    } catch {
      // Fallback to Notification constructor (works on most desktop browsers)
      try {
        new Notification(title, { body, icon: '/favicon.svg', tag });
      } catch {
        // Notification not available in this context
      }
    }
  }, []);

  const startPolling = useCallback((blocks: TimeBlock[]) => {
    stopPolling();
    if (!isSupported() || Notification.permission !== 'granted') return;

    const check = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      for (const block of blocks) {
        if (notifiedRef.current.has(block.id)) continue;

        const [h, m] = block.startTime.split(':').map(Number);
        const blockMinutes = h * 60 + m;
        const diff = blockMinutes - nowMinutes;

        // Fire notification when we're within LEAD_MINUTES before the block start
        if (diff >= 0 && diff <= LEAD_MINUTES) {
          notifiedRef.current.add(block.id);
          showNotification(
            `⏰ ${block.label}`,
            `${block.startTime} – ${block.endTime}`,
            block.id,
          );
        }
      }
    };

    // Check immediately, then poll
    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL);
  }, [stopPolling, showNotification]);

  const requestPermission = useCallback(async () => {
    if (!isSupported()) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      // Send a confirmation notification so the user knows it works
      showNotification(
        'Notifications enabled ✓',
        'You\'ll be notified when planned blocks are about to start.',
        'permission-granted',
      );
    }
    return result === 'granted';
  }, [showNotification]);

  // Reset notified set when date or blocks change, then start polling for today
  useEffect(() => {
    notifiedRef.current.clear();
    if (permission === 'granted' && selectedDate === getTodayString()) {
      startPolling(expectedBlocks);
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [expectedBlocks, selectedDate, permission, startPolling, stopPolling]);

  return {
    permission,
    requestPermission,
    supported: isSupported(),
  };
}

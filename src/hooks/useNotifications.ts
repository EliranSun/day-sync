import { useEffect, useCallback, useRef, useState } from 'react';
import type { TimeBlock } from '../types';
import { getTodayString } from '../lib/time';
import { urlBase64ToUint8Array } from '../lib/pushUtils';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function isSupported() {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator;
}

function isPushSupported() {
  return isSupported() && 'PushManager' in window && !!VAPID_PUBLIC_KEY;
}

/** How often we check if a block is about to start (ms) — foreground fallback */
const POLL_INTERVAL = 30_000;
/** How many minutes before a block starts to fire the local notification */
const LEAD_MINUTES = 2;

/**
 * Send today's blocks to the server so QStash can schedule background push
 * notifications for each upcoming block.
 */
async function syncScheduleToServer(
  subscription: PushSubscription,
  blocks: TimeBlock[],
  date: string,
) {
  const simplifiedBlocks = blocks.map(b => ({
    id: b.id,
    startTime: b.startTime,
    endTime: b.endTime,
    label: b.label,
  }));

  try {
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        blocks: simplifiedBlocks,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        date,
      }),
    });
  } catch (err) {
    console.warn('Failed to sync push schedule:', err);
  }
}

export function useNotifications(expectedBlocks: TimeBlock[], selectedDate: string) {
  const [permission, setPermission] = useState<NotificationPermission>(
    () => (isSupported() ? Notification.permission : 'denied')
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());
  const pushSubRef = useRef<PushSubscription | null>(null);

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
      try {
        new Notification(title, { body, icon: '/favicon.svg', tag });
      } catch {
        // Notification not available in this context
      }
    }
  }, []);

  /** Subscribe to the Push API and return the PushSubscription */
  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isPushSupported()) return null;
    try {
      const registration = await navigator.serviceWorker.ready;
      // Check for existing subscription first
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
        });
      }
      pushSubRef.current = sub;
      return sub;
    } catch (err) {
      console.warn('Push subscription failed:', err);
      return null;
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

    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL);
  }, [stopPolling, showNotification]);

  const requestPermission = useCallback(async () => {
    if (!isSupported()) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      showNotification(
        'Notifications enabled ✓',
        'You\'ll be notified when planned blocks are about to start.',
        'permission-granted',
      );
      // Subscribe to Push API for background notifications
      await subscribeToPush();
    }
    return result === 'granted';
  }, [showNotification, subscribeToPush]);

  // Sync schedule to server and start local polling when blocks/date/permission change
  useEffect(() => {
    notifiedRef.current.clear();

    if (permission !== 'granted' || selectedDate !== getTodayString()) {
      stopPolling();
      return stopPolling;
    }

    // Foreground fallback: poll locally
    startPolling(expectedBlocks);

    // Background push: sync schedule to server via Push API
    if (isPushSupported()) {
      (async () => {
        let sub = pushSubRef.current;
        if (!sub) {
          sub = await subscribeToPush();
        }
        if (sub && expectedBlocks.length > 0) {
          await syncScheduleToServer(sub, expectedBlocks, selectedDate);
        }
      })();
    }

    return stopPolling;
  }, [expectedBlocks, selectedDate, permission, startPolling, stopPolling, subscribeToPush]);

  return {
    permission,
    requestPermission,
    supported: isSupported(),
  };
}

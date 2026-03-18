import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@upstash/qstash';
import { createHash } from 'crypto';

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

interface ScheduledBlock {
  id: string;
  startTime: string; // "HH:MM"
  endTime: string;
  label: string;
}

interface SubscribeBody {
  subscription: PushSubscriptionJSON;
  blocks: ScheduledBlock[];
  timezone: string;
  date: string; // "YYYY-MM-DD"
}

/** How many minutes before a block to send the notification */
const LEAD_MINUTES = 2;

function endpointHash(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex').slice(0, 16);
}

function computeNotifyTime(date: string, startTime: string, timezone: string): number | null {
  // Build an ISO-ish string and use Intl to resolve the timezone offset
  const [hours, minutes] = startTime.split(':').map(Number);
  // Create a date string in the target timezone
  const dt = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);

  // Use Intl to find the offset between UTC and the user's timezone
  const utcStr = dt.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = dt.toLocaleString('en-US', { timeZone: timezone });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  const offsetMs = utcDate.getTime() - tzDate.getTime();

  const notifyTimeUtc = dt.getTime() + offsetMs - LEAD_MINUTES * 60_000;
  return notifyTimeUtc;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscription, blocks, timezone, date } = req.body as SubscribeBody;

  if (!subscription?.endpoint || !blocks || !timezone || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hash = endpointHash(subscription.endpoint);
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `https://${req.headers.host}`;
  const now = Date.now();
  let scheduled = 0;

  for (const block of blocks) {
    const notifyTime = computeNotifyTime(date, block.startTime, timezone);
    if (notifyTime === null || notifyTime <= now) continue;

    const deduplicationId = `${hash}-${date}-${block.id}`;

    try {
      await qstash.publishJSON({
        url: `${baseUrl}/api/send-push`,
        body: {
          subscription,
          title: `⏰ ${block.label}`,
          body: `${block.startTime} – ${block.endTime}`,
          tag: block.id,
        },
        notBefore: Math.floor(notifyTime / 1000),
        deduplicationId,
      });
      scheduled++;
    } catch (err) {
      console.error(`Failed to schedule block ${block.id}:`, err);
    }
  }

  return res.status(200).json({ scheduled });
}

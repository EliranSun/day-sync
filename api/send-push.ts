import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { Receiver } from '@upstash/qstash';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:noreply@example.com',
  process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the request comes from QStash
  const signature = req.headers['upstash-signature'] as string | undefined;
  if (signature) {
    try {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      await receiver.verify({ signature, body });
    } catch {
      return res.status(401).json({ error: 'Invalid QStash signature' });
    }
  }

  const { subscription, title, body, tag } = req.body;

  if (!subscription || !title) {
    return res.status(400).json({ error: 'Missing subscription or title' });
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body: body || '', tag: tag || '' }),
    );
    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    // 410 Gone = subscription expired, 404 = not found
    if (statusCode === 410 || statusCode === 404) {
      return res.status(200).json({ success: false, expired: true });
    }
    console.error('Web push failed:', err);
    return res.status(500).json({ error: 'Push failed' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // QStash deduplication IDs auto-expire, so there's nothing to cancel server-side.
  // This endpoint exists so the client has a clean API contract.
  // In the future, if we store subscriptions in KV, we'd delete them here.

  return res.status(200).json({ success: true });
}

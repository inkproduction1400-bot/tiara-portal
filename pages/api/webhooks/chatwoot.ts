// pages/api/webhooks/chatwoot.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { writeAudit } from '@/lib/audit';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await writeAudit({
    actor: 'system/chatwoot',
    action: 'webhook_received',
    entity: 'chatwoot',
    payload: { headers: req.headers, body: req.body },
  });
  res.status(200).json({ ok: true });
}

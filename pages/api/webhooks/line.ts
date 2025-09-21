// pages/api/webhooks/line.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { writeAudit } from '@/lib/audit';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await writeAudit({
    actor: 'system/line',
    action: 'webhook_received',
    entity: 'line',
    payload: { headers: req.headers, body: req.body },
  });
  res.status(200).json({ ok: true });
}

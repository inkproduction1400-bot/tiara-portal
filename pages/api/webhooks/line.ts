// pages/api/webhooks/line.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { writeAudit } from '@/lib/audit';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const id = await writeAudit({
      actor: 'system/line',
      action: 'webhook_received',
      entity: 'line',
      payload: { headers: req.headers, body: req.body },
      ip: (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    res.status(200).json({ ok: true, audit_id: id });
  } catch (e: any) {
    console.error('[webhook/line] audit error:', e);
    res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
}

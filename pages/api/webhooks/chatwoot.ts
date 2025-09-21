// pages/api/webhooks/chatwoot.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { writeAudit } from '@/lib/audit';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }, // 必要なら調整
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const id = await writeAudit({
      actor: 'system/chatwoot',
      action: 'webhook_received',
      entity: 'chatwoot',
      payload: { headers: req.headers, body: req.body },
      ip: (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    // デバッグしやすいよう audit_id を返す（運用で不要なら削除OK）
    res.status(200).json({ ok: true, audit_id: id });
  } catch (e: any) {
    console.error('[webhooks/chatwoot] audit error:', e);
    res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
}

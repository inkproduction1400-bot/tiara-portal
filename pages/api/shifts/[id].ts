// /pages/api/shifts/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/db';

const STATUSES = new Set(['scheduled','confirmed','finished','canceled']);
const ROLES = new Set(['cast','manager','other']);

function parseDate(v?: string) {
  if (!v) return undefined;
  const t = Date.parse(v);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}

async function logAudit(action: string, payload: any, entity_id?: string) {
  try {
    await supabase!.from('audit_logs').insert({
      actor: 'api',
      action,
      entity: 'shift',
      entity_id: entity_id ?? null,
      payload,
    });
  } catch {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabase) return res.status(500).json({ ok: false, error: 'Service role is not configured' });
  const { id } = req.query as { id: string };

  if (req.method !== 'PATCH') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const {
    status,         // optional
    starts_at,      // optional
    ends_at,        // optional
    store_id,       // optional
    memo,           // optional
    pay_rate,       // optional
    role,           // optional
  } = (req.body ?? {}) as Record<string, any>;

  // 存在確認
  const { data: ex, error: exErr } = await supabase.from('shifts').select('id').eq('id', id).maybeSingle();
  if (exErr) return res.status(500).json({ ok: false, error: exErr.message });
  if (!ex) return res.status(404).json({ ok: false, error: 'shift not found' });

  // 最小バリデーション
  const patch: any = {};
  if (status !== undefined) {
    if (!STATUSES.has(status)) return res.status(400).json({ ok: false, error: 'invalid status' });
    patch.status = status;
    patch.canceled_at = status === 'canceled' ? new Date().toISOString() : null;
  }
  if (role !== undefined) {
    if (!ROLES.has(role)) return res.status(400).json({ ok: false, error: 'invalid role' });
    patch.role = role;
  }
  if (starts_at !== undefined) {
    const s = parseDate(starts_at);
    if (!s) return res.status(400).json({ ok: false, error: 'starts_at must be ISO date' });
    patch.starts_at = s;
  }
  if (ends_at !== undefined) {
    const e = parseDate(ends_at);
    if (ends_at && !e) return res.status(400).json({ ok: false, error: 'ends_at must be ISO date' });
    patch.ends_at = e ?? null;
  }
  if (store_id !== undefined) patch.store_id = store_id ?? null;
  if (memo !== undefined) patch.memo = memo ?? null;
  if (pay_rate !== undefined) patch.pay_rate = pay_rate ?? null;

  try {
    const { data, error } = await supabase.from('shifts').update(patch).eq('id', id).select('*').single();
    if (error) return res.status(500).json({ ok: false, error: error.message });

    await logAudit('patch_shift', { id, body: req.body }, id);
    return res.status(200).json({ ok: true, item: data });
  } catch (e: any) {
    await logAudit('error_shift_patch', { id, error: String(e), body: req.body }, id);
    return res.status(500).json({ ok: false, error: e?.message ?? 'unknown error' });
  }
}

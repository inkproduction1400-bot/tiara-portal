// pages/api/shifts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { from, to, cast_id, store_id, status, page = '1', limit = '30' } =
    req.query as Record<string, string>;

  let q = supabase.from('shifts').select('*', { count: 'exact' });

  if (from) q = q.gte('starts_at', from);
  if (to) q = q.lte('starts_at', to);
  if (cast_id) q = q.eq('cast_id', cast_id);
  if (store_id) q = q.eq('store_id', store_id);
  if (status) q = q.eq('status', status);

  const p = Math.max(1, Number(page));
  const l = Math.max(1, Math.min(100, Number(limit)));
  q = q.order('starts_at', { ascending: false }).range((p - 1) * l, p * l - 1);

  const { data, count, error } = await q;
  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ data, page: p, limit: l, total: count ?? 0 });
}

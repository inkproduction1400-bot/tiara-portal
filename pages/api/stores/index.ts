import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/db';

const SORTS = new Set(['name', 'created_at', 'updated_at', 'code']);

function toBool(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  const s = String(v).trim().toLowerCase();
  if (['true','1','t','yes','y'].includes(s)) return true;
  if (['false','0','f','no','n'].includes(s)) return false;
  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  if (!supabase) return res.status(500).json({ ok: false, error: 'Service role is not configured' });

  const {
    keyword = '',
    active,
    page = '1',
    limit = '30',
    sort = 'name',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 30));
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  // 1) count (head) for safe pagination
  let cq = supabase.from('stores').select('*', { count: 'exact', head: true });

  const kw = keyword.trim();
  if (kw) {
    const esc = kw.replace(/[*]/g, '\\*').replace(/_/g, '\\_');
    cq = cq.or(`name.ilike.*${esc}*,code.ilike.*${esc}*,address.ilike.*${esc}*`);
  }
  const act = toBool(active);
  if (typeof act === 'boolean') cq = cq.eq('active', act);

  const { count: total, error: cntErr } = await cq;
  if (cntErr) return res.status(500).json({ ok: false, error: cntErr.message });
  if ((total ?? 0) === 0 || from >= (total ?? 0)) {
    return res.status(200).json({ ok: true, items: [], page: pageNum, limit: limitNum, total: total ?? 0, hasNext: false });
  }

  // 2) data
  let q = supabase.from('stores').select('*');
  if (kw) {
    const esc = kw.replace(/[*]/g, '\\*').replace(/_/g, '\\_');
    q = q.or(`name.ilike.*${esc}*,code.ilike.*${esc}*,address.ilike.*${esc}*`);
  }
  if (typeof act === 'boolean') q = q.eq('active', act);

  if (sort) {
    const parts = sort.split(',').map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      const asc = !p.startsWith('-');
      const key = p.replace(/^[+-]/,'');
      if (SORTS.has(key)) q = q.order(key as any, { ascending: asc, nullsFirst: !asc });
    }
  } else {
    q = q.order('name', { ascending: true });
  }

  q = q.range(from, to);
  const { data, error } = await q;
  if (error) return res.status(500).json({ ok: false, error: error.message });

  res.status(200).json({ ok: true, items: data ?? [], page: pageNum, limit: limitNum, total: total ?? 0, hasNext: to + 1 < (total ?? 0) });
}

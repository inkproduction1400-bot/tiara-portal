// pages/api/casts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/db';

const SORT_WHITELIST = new Set(['name', 'wage', 'rating', 'created_at', 'updated_at']);

function toBool(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['true', '1', 't', 'yes', 'y'].includes(s)) return true;
  if (['false', '0', 'f', 'no', 'n'].includes(s)) return false;
  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  if (!supabase) return res.status(500).json({ ok: false, error: 'Service role is not configured' });

  const {
    keyword = '',
    owner,
    wage_min,
    genre,
    drinkable,
    status,
    page = '1',
    limit = '30',
    sort = 'rating,-wage,name',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 30));
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  // --- 先に総数だけ head クエリで取得（範囲外ガード用）
  let countQuery = supabase.from('casts').select('*', { count: 'exact', head: true });

  const kw = keyword?.trim();
  if (kw) {
    const esc = kw.replace(/[*]/g, '\\*').replace(/_/g, '\\_'); // 軽いエスケープ
    countQuery = countQuery.or(`name.ilike.*${esc}*,nickname.ilike.*${esc}*`);
  }
  if (owner && owner.trim()) countQuery = countQuery.eq('owner', owner.trim());
  if (typeof wage_min !== 'undefined' && wage_min !== '') {
    const min = Number(wage_min);
    if (!Number.isNaN(min)) countQuery = countQuery.gte('wage', min);
  }
  if (status && status.trim()) countQuery = countQuery.eq('status', status.trim());
  const drink = toBool(drinkable);
  if (typeof drink === 'boolean') countQuery = countQuery.eq('drinkable', drink);
  if (genre && genre.trim()) {
    const arr = genre.split(',').map((v) => v.trim()).filter(Boolean);
    if (arr.length) countQuery = countQuery.overlaps('genre', arr);
  }

  const { count: total, error: countErr } = await countQuery;
  if (countErr) return res.status(500).json({ ok: false, error: countErr.message });

  if ((total ?? 0) === 0 || from >= (total ?? 0)) {
    return res.status(200).json({ ok: true, items: [], page: pageNum, limit: limitNum, total: total ?? 0, hasNext: false });
  }

  // --- 実データの取得
  let q = supabase.from('casts').select('*');

  if (kw) {
    const esc = kw.replace(/[*]/g, '\\*').replace(/_/g, '\\_');
    q = q.or(`name.ilike.*${esc}*,nickname.ilike.*${esc}*`);
  }
  if (owner && owner.trim()) q = q.eq('owner', owner.trim());
  if (typeof wage_min !== 'undefined' && wage_min !== '') {
    const min = Number(wage_min);
    if (!Number.isNaN(min)) q = q.gte('wage', min);
  }
  if (status && status.trim()) q = q.eq('status', status.trim());
  if (typeof drink === 'boolean') q = q.eq('drinkable', drink);
  if (genre && genre.trim()) {
    const arr = genre.split(',').map((v) => v.trim()).filter(Boolean);
    if (arr.length) q = q.overlaps('genre', arr);
  }

  if (sort && sort.trim()) {
    const fields = sort.split(',').map((s) => s.trim()).filter(Boolean);
    for (const f of fields) {
      const ascending = !f.startsWith('-');
      const key = f.replace(/^[+-]/, '');
      if (SORT_WHITELIST.has(key)) q = q.order(key as any, { ascending, nullsFirst: !ascending });
    }
  } else {
    q = q.order('rating', { ascending: false }).order('name', { ascending: true });
  }

  q = q.range(from, to);

  const { data, error } = await q;
  if (error) return res.status(500).json({ ok: false, error: error.message });

  res.status(200).json({
    ok: true,
    items: data ?? [],
    page: pageNum,
    limit: limitNum,
    total: total ?? 0,
    hasNext: to + 1 < (total ?? 0),
  });
}

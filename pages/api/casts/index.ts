// pages/api/casts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const {
    keyword = '',
    owner,
    wage_min,
    genre,
    drinkable,
    active,
    page = '1',
    limit = '30',
    sort = 'rating,-wage,name',
  } = req.query as Record<string, string>;

  let q = supabase.from('casts').select('*', { count: 'exact' });

  if (keyword) q = q.ilike('name', `%${keyword}%`);
  if (owner) q = q.eq('owner', owner);
  if (typeof active !== 'undefined') q = q.eq('active', active === 'true');
  if (wage_min) q = q.gte('wage', Number(wage_min));
  if (genre) q = q.contains('genre', [genre]);
  if (typeof drinkable !== 'undefined') q = q.eq('drinkable', drinkable === 'true');

  sort
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((srt) => {
      const desc = srt.startsWith('-');
      const col = desc ? srt.slice(1) : srt;
      // @ts-ignore supabase-js の型制約回避
      q = q.order(col, { ascending: !desc, nullsFirst: false });
    });

  const p = Math.max(1, Number(page));
  const l = Math.max(1, Math.min(100, Number(limit)));
  const from = (p - 1) * l;
  const to = from + l - 1;
  q = q.range(from, to);

  const { data, count, error } = await q;
  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ data, page: p, limit: l, total: count ?? 0 });
}

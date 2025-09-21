import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/db';
import { z } from 'zod';

type ApiError = { ok: false; code: 'VALIDATION_ERROR' | 'DB_ERROR' | 'INTERNAL_ERROR'; message: string };
const bad = (code: ApiError['code'], message: string, status = 400) =>
  ({ status, body: { ok: false, code, message } as ApiError });

const SORTS = new Set(['name','created_at','updated_at','code']);

const querySchema = z.object({
  keyword: z.string().optional(),
  active:  z.coerce.boolean().optional(),
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  sort:  z.string().optional(),    // 例: "name,-updated_at"
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    const e = bad('VALIDATION_ERROR', 'Method Not Allowed', 405);
    return res.status(e.status).json(e.body);
  }
  if (!supabase) {
    const e = bad('INTERNAL_ERROR', 'Service role is not configured', 500);
    return res.status(e.status).json(e.body);
  }

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    const e = bad('VALIDATION_ERROR', parsed.error.message, 400);
    return res.status(e.status).json(e.body);
  }
  const { keyword, active, page, limit, sort } = parsed.data;

  const rFrom = (page - 1) * limit;
  const rTo   = rFrom + limit - 1;

  // COUNT
  let cq = supabase.from('stores').select('*', { count: 'exact', head: true });
  if (keyword) cq = cq.ilike('name', `%${keyword}%`);
  if (active !== undefined) cq = cq.eq('active', active);

  const { count: total, error: cntErr } = await cq;
  if (cntErr) {
    const e = bad('DB_ERROR', cntErr.message, 500);
    return res.status(e.status).json(e.body);
  }
  if ((total ?? 0) === 0 || rFrom >= (total ?? 0)) {
    return res.status(200).json({ ok: true, items: [], page, limit, total: total ?? 0, hasNext: false });
  }

  // DATA
  let q = supabase.from('stores').select('*');
  if (keyword) q = q.ilike('name', `%${keyword}%`);
  if (active !== undefined) q = q.eq('active', active);

  if (sort) {
    const parts = sort.split(',').map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      const asc = !p.startsWith('-');
      const key = p.replace(/^[+-]/,'');
      if (SORTS.has(key)) q = q.order(key as any, { ascending: asc, nullsFirst: !asc });
    }
  } else {
    q = q.order('updated_at', { ascending: false }).order('name', { ascending: true });
  }

  q = q.range(rFrom, rTo);

  const { data, error } = await q;
  if (error) {
    const e = bad('DB_ERROR', error.message, 500);
    return res.status(e.status).json(e.body);
  }

  res.status(200).json({
    ok: true,
    items: data ?? [],
    page, limit,
    total: total ?? 0,
    hasNext: rTo + 1 < (total ?? 0),
  });
}

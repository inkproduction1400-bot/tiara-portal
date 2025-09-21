// pages/api/shifts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/db';
import { z } from 'zod';

type ApiError = { ok: false; code: 'VALIDATION_ERROR' | 'DB_ERROR' | 'INTERNAL_ERROR'; message: string };
const bad = (code: ApiError['code'], message: string, status = 400) =>
  ({ status, body: { ok: false, code, message } as ApiError });

const SORTS = new Set(['starts_at', 'ends_at', 'created_at', 'updated_at', 'pay_rate']);

/** クエリの型定義（zod） */
const querySchema = z.object({
  store_id: z.string().uuid().optional(),
  cast_id: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'confirmed', 'canceled', 'finished']).optional(),
  role: z.enum(['cast']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  sort: z.string().optional(),        // 例: "starts_at,-created_at"
  expand: z.string().optional(),      // 例: "names"
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

  // ---- Validate ----
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    const e = bad('VALIDATION_ERROR', parsed.error.message, 400);
    return res.status(e.status).json(e.body);
  }
  const { store_id, cast_id, status, role, from, to, page, limit, sort, expand = '' } = parsed.data;

  // ページング計算
  const rFrom = (page - 1) * limit;
  const rTo = rFrom + limit - 1;

  // expand=names の有無
  const withNames = String(expand)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes('names');

  // ---------- count ----------
  let cq = supabase.from('shifts').select('*', { count: 'exact', head: true });
  if (store_id) cq = cq.eq('store_id', store_id);
  if (cast_id) cq = cq.eq('cast_id', cast_id);
  if (status) cq = cq.eq('status', status);
  if (role) cq = cq.eq('role', role);
  if (from) cq = cq.gte('starts_at', from);
  if (to) cq = cq.lt('starts_at', to);

  const { count: total, error: cntErr } = await cq;
  if (cntErr) {
    const e = bad('DB_ERROR', cntErr.message, 500);
    return res.status(e.status).json(e.body);
  }
  if ((total ?? 0) === 0 || rFrom >= (total ?? 0)) {
    return res
      .status(200)
      .json({ ok: true, items: [], page, limit, total: total ?? 0, hasNext: false });
  }

  // ---------- data ----------
  const selectExpr = withNames ? '*, casts(name), stores(name)' : '*';

  let q = supabase.from('shifts').select(selectExpr);
  if (store_id) q = q.eq('store_id', store_id);
  if (cast_id) q = q.eq('cast_id', cast_id);
  if (status) q = q.eq('status', status);
  if (role) q = q.eq('role', role);
  if (from) q = q.gte('starts_at', from);
  if (to) q = q.lt('starts_at', to);

  if (sort) {
    const parts = sort.split(',').map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      const asc = !p.startsWith('-');
      const key = p.replace(/^[+-]/, '');
      if (SORTS.has(key)) q = q.order(key as any, { ascending: asc, nullsFirst: !asc });
    }
  } else {
    q = q.order('starts_at', { ascending: true });
  }

  q = q.range(rFrom, rTo);

  const { data, error } = await q;
  if (error) {
    const e = bad('DB_ERROR', error.message, 500);
    return res.status(e.status).json(e.body);
  }

  const items = withNames
    ? (data ?? []).map((row: any) => {
        const { casts, stores, ...rest } = row || {};
        return {
          ...rest,
          cast_name: casts?.name ?? null,
          store_name: stores?.name ?? null,
        };
      })
    : (data ?? []);

  return res.status(200).json({
    ok: true,
    items,
    page,
    limit,
    total: total ?? 0,
    hasNext: rTo + 1 < (total ?? 0),
  });
}

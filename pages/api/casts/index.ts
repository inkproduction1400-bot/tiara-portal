import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/db';
import { z } from 'zod';

type ApiError = {
  ok: false;
  code: 'VALIDATION_ERROR' | 'DB_ERROR' | 'INTERNAL_ERROR';
  message: string;
};
const bad = (code: ApiError['code'], message: string, status = 400) => ({
  status,
  body: { ok: false, code, message } as ApiError,
});

// ---- GET 用の定義 -----------------------------------------------------------
const SORTS = new Set(['name', 'rating', 'wage', 'created_at', 'updated_at']);

const querySchema = z.object({
  keyword: z.string().optional(),
  owner: z.string().optional(),
  genre: z.string().optional(), // 単一値（必要なら複数対応へ拡張）
  drinkable: z.coerce.boolean().optional(),
  wage_min: z.coerce.number().optional(),
  active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  sort: z.string().optional(), // 例: "rating,-wage,name"
});

// ---- POST 用の定義 ----------------------------------------------------------
const CastCreate = z.object({
  store_id: z.string().uuid(),
  name: z.string().min(1),
  nickname: z.string().optional(),
  wage: z.number().int().min(0).nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  genre: z.array(z.string()).nullable().optional(),
  drinkable: z.boolean().nullable().optional(),
  owner: z.string().nullable().optional(),
  // 将来追加カラムが来ても落とさないように
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabase) {
    const e = bad('INTERNAL_ERROR', 'Service role is not configured', 500);
    return res.status(e.status).json(e.body);
  }

  // ------------------------ POST /api/casts ------------------------
  if (req.method === 'POST') {
    const parsed = CastCreate.safeParse(req.body);
    if (!parsed.success) {
      const e = bad('VALIDATION_ERROR', JSON.stringify(parsed.error.issues, null, 2), 400);
      return res.status(e.status).json(e.body);
    }
    const input = parsed.data;

    // stores FK 事前チェック（存在しなければ 404）
    const { data: st, error: stErr } = await supabase
      .from('stores')
      .select('id')
      .eq('id', input.store_id)
      .maybeSingle();
    if (stErr) {
      const e = bad('DB_ERROR', stErr.message, 500);
      return res.status(e.status).json(e.body);
    }
    if (!st) {
      const e = bad('VALIDATION_ERROR', 'store not found', 404);
      return res.status(e.status).json(e.body);
    }

    // INSERT（UNIQUE (store_id,name) 衝突は 409）
    const { data, error } = await supabase.from('casts').insert(input).select('*').single();
    if (error) {
      if ((error as any).code === '23505') {
        // duplicate key
        return res
          .status(409)
          .json({ ok: false, code: 'DB_ERROR', message: 'duplicate cast (store_id,name)' });
      }
      const e = bad('DB_ERROR', error.message, 500);
      return res.status(e.status).json(e.body);
    }

    return res.status(200).json({ ok: true, item: data });
  }

  // ------------------------ GET /api/casts -------------------------
  if (req.method === 'GET') {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      const e = bad('VALIDATION_ERROR', parsed.error.message, 400);
      return res.status(e.status).json(e.body);
    }
    const { keyword, owner, genre, drinkable, wage_min, active, page, limit, sort } = parsed.data;

    const rFrom = (page - 1) * limit;
    const rTo = rFrom + limit - 1;

    // COUNT
    let cq = supabase.from('casts').select('*', { count: 'exact', head: true });
    if (keyword) cq = cq.ilike('name', `%${keyword}%`);
    if (owner) cq = cq.eq('owner', owner);
    if (genre) cq = cq.contains('genre', [genre]); // genre: text[]
    if (drinkable !== undefined) cq = cq.eq('drinkable', drinkable);
    if (wage_min !== undefined) cq = cq.gte('wage', wage_min);
    if (active !== undefined) cq = cq.eq('active', active);

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

    // DATA
    let q = supabase.from('casts').select('*');
    if (keyword) q = q.ilike('name', `%${keyword}%`);
    if (owner) q = q.eq('owner', owner);
    if (genre) q = q.contains('genre', [genre]);
    if (drinkable !== undefined) q = q.eq('drinkable', drinkable);
    if (wage_min !== undefined) q = q.gte('wage', wage_min);
    if (active !== undefined) q = q.eq('active', active);

    if (sort) {
      const parts = sort
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const p of parts) {
        const asc = !p.startsWith('-');
        const key = p.replace(/^[+-]/, '');
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

    return res.status(200).json({
      ok: true,
      items: data ?? [],
      page,
      limit,
      total: total ?? 0,
      hasNext: rTo + 1 < (total ?? 0),
    });
  }

  // ------------------------ それ以外 -------------------------
  const e = bad('VALIDATION_ERROR', 'Method Not Allowed', 405);
  return res.status(e.status).json(e.body);
}

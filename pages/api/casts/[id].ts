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

// 部分更新用スキーマ（全部オプショナル）
const CastPatch = z
  .object({
    store_id: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
    nickname: z.string().optional(),
    wage: z.number().int().min(0).nullable().optional(),
    rating: z.number().min(0).max(5).nullable().optional(),
    genre: z.array(z.string()).nullable().optional(),
    drinkable: z.boolean().nullable().optional(),
    owner: z.string().nullable().optional(),
    active: z.boolean().optional(),
    // ほか将来カラムが来ても落ちないように strict
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'empty body',
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabase) {
    const e = bad('INTERNAL_ERROR', 'Service role is not configured', 500);
    return res.status(e.status).json(e.body);
  }
  if (req.method !== 'PATCH') {
    const e = bad('VALIDATION_ERROR', 'Method Not Allowed', 405);
    return res.status(e.status).json(e.body);
  }

  const { id } = req.query as { id?: string };
  if (!id) {
    const e = bad('VALIDATION_ERROR', 'id is required', 400);
    return res.status(e.status).json(e.body);
  }

  // 入力バリデ
  const parsed = CastPatch.safeParse(req.body);
  if (!parsed.success) {
    const e = bad('VALIDATION_ERROR', JSON.stringify(parsed.error.issues, null, 2), 400);
    return res.status(e.status).json(e.body);
  }
  const patch = parsed.data;

  // 対象存在チェック（404）
  const { data: existing, error: exErr } = await supabase
    .from('casts')
    .select('id, store_id, name')
    .eq('id', id)
    .maybeSingle();
  if (exErr) {
    const e = bad('DB_ERROR', exErr.message, 500);
    return res.status(e.status).json(e.body);
  }
  if (!existing) {
    const e = bad('VALIDATION_ERROR', 'cast not found', 404);
    return res.status(e.status).json(e.body);
  }

  // store_id を変更する場合は stores の存在もチェック（404）
  if (patch.store_id) {
    const { data: st, error: stErr } = await supabase
      .from('stores')
      .select('id')
      .eq('id', patch.store_id)
      .maybeSingle();
    if (stErr) {
      const e = bad('DB_ERROR', stErr.message, 500);
      return res.status(e.status).json(e.body);
    }
    if (!st) {
      const e = bad('VALIDATION_ERROR', 'store not found', 404);
      return res.status(e.status).json(e.body);
    }
  }

  // 更新（UNIQUE (store_id, name) 衝突は 409）
  const { data, error } = await supabase
    .from('casts')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    if ((error as any).code === '23505') {
      return res
        .status(409)
        .json({ ok: false, code: 'DB_ERROR', message: 'duplicate cast (store_id,name)' });
    }
    const e = bad('DB_ERROR', error.message, 500);
    return res.status(e.status).json(e.body);
  }

  return res.status(200).json({ ok: true, item: data });
}

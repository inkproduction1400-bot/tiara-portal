// /pages/api/shifts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/db';

const SORTS = new Set(['starts_at', 'ends_at', 'created_at', 'updated_at', 'pay_rate']);
const STATUSES = new Set(['scheduled','confirmed','finished','canceled']);
const ROLES = new Set(['cast','manager','other']);

function parseDate(v?: string) {
  if (!v) return undefined;
  const t = Date.parse(v);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}

async function logAudit(action: string, payload: any, entity = 'shift', entity_id?: string) {
  try {
    await supabase!.from('audit_logs').insert({
      actor: 'api',
      action,
      entity,
      entity_id: entity_id ?? null,
      payload,
    });
  } catch {
    /* 監査ログ失敗はAPI結果に影響させない */
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabase) return res.status(500).json({ ok: false, error: 'Service role is not configured' });

  if (req.method === 'GET') {
    // -------- GET (既存) --------
    const {
      store_id,
      cast_id,
      status, // scheduled/confirmed/canceled/finished
      role,   // 'cast' など
      from,
      to,
      page = '1',
      limit = '30',
      sort = 'starts_at',
      expand = '',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 30));
    const start = parseDate(from);
    const end = parseDate(to);
    const rFrom = (pageNum - 1) * limitNum;
    const rTo = rFrom + limitNum - 1;

    const expandSet = new Set(
      String(expand).split(',').map((s) => s.trim()).filter(Boolean)
    );
    const withNames = expandSet.has('names');

    // count
    let cq = supabase.from('shifts').select('*', { count: 'exact', head: true });
    if (store_id) cq = cq.eq('store_id', store_id);
    if (cast_id) cq = cq.eq('cast_id', cast_id);
    if (status) cq = cq.eq('status', status);
    if (role) cq = cq.eq('role', role);
    if (start) cq = cq.gte('starts_at', start);
    if (end) cq = cq.lt('starts_at', end);

    const { count: total, error: cntErr } = await cq;
    if (cntErr) return res.status(500).json({ ok: false, error: cntErr.message });
    if ((total ?? 0) === 0 || rFrom >= (total ?? 0)) {
      return res.status(200).json({ ok: true, items: [], page: pageNum, limit: limitNum, total: total ?? 0, hasNext: false });
    }

    // data
    const selectExpr = withNames ? '*, casts(name), stores(name)' : '*';
    let q = supabase.from('shifts').select(selectExpr);
    if (store_id) q = q.eq('store_id', store_id);
    if (cast_id) q = q.eq('cast_id', cast_id);
    if (status) q = q.eq('status', status);
    if (role) q = q.eq('role', role);
    if (start) q = q.gte('starts_at', start);
    if (end) q = q.lt('starts_at', end);

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
    if (error) return res.status(500).json({ ok: false, error: error.message });

    const items = withNames
      ? (data ?? []).map((row: any) => {
          const { casts, stores, ...rest } = row || {};
          return { ...rest, cast_name: casts?.name ?? null, store_name: stores?.name ?? null };
        })
      : data ?? [];

    return res.status(200).json({
      ok: true,
      items,
      page: pageNum,
      limit: limitNum,
      total: total ?? 0,
      hasNext: rTo + 1 < (total ?? 0),
    });
  }

  if (req.method === 'POST') {
    // -------- POST：create/upsert --------
    const {
      id,                 // 任意：指定があればそのIDを更新（存在しないならエラー）
      cast_id,
      starts_at,
      ends_at,
      store_id = null,
      status = 'scheduled',
      role = 'cast',
      pay_rate = null,
      memo = null,
    } = (req.body ?? {}) as Record<string, any>;

    // バリデーション（最小）
    if (!cast_id || !starts_at) {
      return res.status(400).json({ ok: false, error: 'cast_id and starts_at are required' });
    }
    const startsIso = parseDate(starts_at);
    const endsIso = ends_at ? parseDate(ends_at) : null;
    if (!startsIso) return res.status(400).json({ ok: false, error: 'starts_at must be ISO date' });
    if (ends_at && !endsIso) return res.status(400).json({ ok: false, error: 'ends_at must be ISO date' });
    if (status && !STATUSES.has(status)) return res.status(400).json({ ok: false, error: 'invalid status' });
    if (role && !ROLES.has(role)) return res.status(400).json({ ok: false, error: 'invalid role' });

    try {
      let out;

      if (id) {
        // 明示ID更新（存在しなければ404）
        const { data: ex, error: exErr } = await supabase.from('shifts').select('id').eq('id', id).maybeSingle();
        if (exErr) return res.status(500).json({ ok: false, error: exErr.message });
        if (!ex) return res.status(404).json({ ok: false, error: 'shift not found' });

        const { data, error } = await supabase
          .from('shifts')
          .update({
            cast_id,
            store_id,
            starts_at: startsIso,
            ends_at: endsIso,
            status,
            role,
            pay_rate,
            memo,
            canceled_at: status === 'canceled' ? new Date().toISOString() : null,
          })
          .eq('id', id)
          .select('*')
          .single();

        if (error) return res.status(500).json({ ok: false, error: error.message });
        out = data;
        await logAudit('update_shift', { id, body: req.body }, 'shift', id);
      } else {
        // id なし：UNIQUE(cast_id, starts_at) で upsert（完全に同一開始時刻が対象）
        const payload = [{
          cast_id,
          store_id,
          starts_at: startsIso,
          ends_at: endsIso,
          status,
          role,
          pay_rate,
          memo,
          canceled_at: status === 'canceled' ? new Date().toISOString() : null,
        }];

        const { data, error } = await supabase
          .from('shifts')
          .upsert(payload, { onConflict: 'cast_id,starts_at', ignoreDuplicates: false })
          .select('*')
          .single();

        if (error) return res.status(500).json({ ok: false, error: error.message });
        out = data;
        await logAudit('upsert_shift', { body: req.body }, 'shift', data?.id);
      }

      return res.status(200).json({ ok: true, item: out });
    } catch (e: any) {
      await logAudit('error_shift_post', { error: String(e), body: req.body });
      return res.status(500).json({ ok: false, error: e?.message ?? 'unknown error' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}

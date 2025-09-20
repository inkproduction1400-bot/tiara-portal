// pages/api/questionnaire/[kind]/save.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  const { kind } = req.query; // 'schema' | 'answers'
  if (kind !== 'schema' && kind !== 'answers') return res.status(400).json({ ok: false, error: 'invalid kind' });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res.status(400).json({ ok: false, error: 'Supabase未設定' });

  const body = req.body || {};
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('questionnaire_store')                      // B案を選ぶなら questionnaire_answers に変更
    .insert({
      page_key: 'questionnaire',
      kind: kind as string,
      version: body.version ?? 'v1',
      author: body.author ?? null,
      data: body.data,                                // 回答 or スキーマの JSON
    })
    .select()
    .single();

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true, data });
}

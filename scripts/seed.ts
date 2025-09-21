import { config } from 'dotenv';
import path from 'node:path';
import type {
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
} from '@supabase/supabase-js';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '@/lib/db';

function jstOffsetDate(hoursFromNow = 0) {
  const now = new Date();
  const t = new Date(now.getTime() + hoursFromNow * 3600 * 1000);
  return t.toISOString();
}

type StoreRow = { id: string };
type CastInsert = {
  name: string;
  nickname?: string;
  store_id?: string | null;
  wage?: number | null;
  rating?: number | null;
  genre?: string[] | null;
  drinkable?: boolean | null;
  owner?: string | null;
};
type CastRow = { id: string; wage?: number | null };

/** stores.name をユニークキーとして確実に upsert（23505 時はフォールバック） */
async function upsertStoreByName(input: {
  name: string;
  address?: string | null;
  phone?: string | null;
}): Promise<StoreRow> {
  const name = input.name.trim();

  // まずは正攻法の upsert（型は明示キャストで固定）
  const up = (await supabaseAdmin!
    .from('stores')
    .upsert([{ name, address: input.address ?? null, phone: input.phone ?? null }], {
      onConflict: 'name',
      ignoreDuplicates: false,
    })
    .select('id')
    .single()) as PostgrestSingleResponse<StoreRow>;

  // ① 成功パス
  if (up.data) return up.data;

  // ② 23505（重複キー）だけフォールバック
  if (up.error && (up.error as any).code === '23505') {
    const ex = (await supabaseAdmin!
      .from('stores')
      .select('id')
      .eq('name', name)
      .maybeSingle()) as PostgrestMaybeSingleResponse<StoreRow>;
    if (ex.error) throw ex.error;

    if (ex.data) {
      const upd = (await supabaseAdmin!
        .from('stores')
        .update({ address: input.address ?? null, phone: input.phone ?? null })
        .eq('id', ex.data.id)
        .select('id')
        .single()) as PostgrestSingleResponse<StoreRow>;
      if (upd.error) throw upd.error;
      return upd.data!;
    } else {
      const ins = (await supabaseAdmin!
        .from('stores')
        .insert({ name, address: input.address ?? null, phone: input.phone ?? null })
        .select('id')
        .single()) as PostgrestSingleResponse<StoreRow>;
      if (ins.error) throw ins.error;
      return ins.data!;
    }
  }

  // ③ その他のエラーはそのまま投げる／データなしは異常
  if (up.error) throw up.error;
  throw new Error('Store upsert returned no data');
}

async function main() {
  if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to seed.');

  // stores は name 一意でアップサート
  const store = await upsertStoreByName({
    name: '中洲本店',
    address: '福岡市博多区中洲',
    phone: '092-000-0000',
  });

  const casts: CastInsert[] = [
    {
      name: 'さくら',
      nickname: 'Sakura',
      store_id: store.id,
      wage: 2500,
      rating: 4.5,
      genre: ['レギュラー'],
      drinkable: true,
      owner: 'Tiara',
    },
    {
      name: 'りん',
      nickname: 'Rin',
      store_id: store.id,
      wage: 2200,
      rating: 4.1,
      genre: ['新人'],
      drinkable: false,
      owner: 'Tiara',
    },
  ];

  // casts は (store_id, name) で衝突更新
  // pay_rate スナップショットに使うため wage も一緒に取得
  const { data: castRows, error: cErr } = (await supabaseAdmin
    .from('casts')
    .upsert(casts, { onConflict: 'store_id,name', ignoreDuplicates: false })
    .select('id,wage')) as unknown as { data: CastRow[]; error: any };
  if (cErr) throw cErr;

  // ★ shifts を upsert 化（cast_id, starts_at を一意キーとする）
  // 先に 0002c で UNIQUE (cast_id, starts_at) を入れておくとより安全です。
  const starts1 = jstOffsetDate(1);
  const ends1 = jstOffsetDate(5);
  const shiftRows = (castRows ?? []).map((c: CastRow) => ({
    cast_id: c.id,
    store_id: store.id,
    starts_at: starts1,
    ends_at: ends1,
    status: 'scheduled',
    role: 'cast',                         // 0003 の追加列に合わせる
    pay_rate: c.wage ?? null,             // ← その時点の時給をスナップショット
    memo: 'seed',                         // ← 追跡用
  }));
  if (shiftRows.length) {
    const { error: sErr } = await supabaseAdmin
      .from('shifts')
      .upsert(shiftRows, { onConflict: 'cast_id,starts_at', ignoreDuplicates: false });
    if (sErr) throw sErr;
  }

  console.log('Seed completed:', {
    store: store.id,
    casts: castRows?.length ?? 0,
    shifts: shiftRows.length,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

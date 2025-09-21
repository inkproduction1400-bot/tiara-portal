-- 目的: casts の (store_id, name) を一意にして、同一店舗での重複登録を防ぐ
-- 注意: 既存重複があると一意インデックスの作成に失敗します。
--       事前に重複チェック＆解消してから適用してください（下に参考SQLあり）。

-- ========= 参考: 重複確認 (手動実行用) =========
-- select store_id, name, count(*) as cnt
-- from public.casts
-- group by store_id, name
-- having count(*) > 1
-- order by cnt desc;

-- ========= ユニーク制約の追加手順 =========
-- 1) まず一意インデックスを作成（存在すればスキップ）
create unique index if not exists uq_casts_store_name_idx
  on public.casts (store_id, name);

-- 2) そのインデックスを流用して「表レベルの制約」を付与（重複名での再実行を避けるためガード）
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'uq_casts_store_name'
      and conrelid = 'public.casts'::regclass
  ) then
    alter table public.casts
      add constraint uq_casts_store_name
      unique using index uq_casts_store_name_idx;
  end if;
end$$;

-- ========= 補足 =========
-- ・store_id が NULL の行はユニーク判定の対象外（NULL≠NULL）です。
--   NULLも含めて厳密に一意にしたい場合は、store_id を NOT NULL にする運用に揃えてください。
-- ・大文字小文字/表記ゆれを吸収したい場合は、保存前に lower(name) で正規化する等のアプリ側統一を推奨します。

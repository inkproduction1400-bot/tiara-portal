# Local Smoke Runbook

Tiara API をローカルで素早くスモーク確認するための手順です。  
対象：NestJS + Prisma + PostgreSQL（Neon）／Docker Compose 実行

---

## 0. 前提 & 依存

- Docker / Docker Compose
- Node.js 20 系（ホストで `npm run build` を実行）
- `jq` / `psql`（確認用）
- `dotenv-cli`（`.env` の読み込みに使用）
  ```bash
  npm i -D dotenv-cli
.env には少なくとも下記が必要です（実値は環境に合わせて設定）。

ini
コードをコピーする
# DB 接続（アプリ用 / 所有者権限 / シャドウ）
DATABASE_URL=postgresql://<app_user>:<app_pass>@<host>/<db>?sslmode=require
OWNER_DATABASE_URL=postgresql://<owner_user>:<owner_pass>@<host>/<db>?sslmode=require
SHADOW_DATABASE_URL=postgresql://<owner_user>:<owner_pass>@<host>/<shadow_db>?sslmode=require

# API
PORT=4001

# Swagger 自体は CORS不要だが、フロント連携時に合わせる
FRONTEND_ORIGIN=http://localhost:3000
便利エイリアス：

bash
コードをコピーする
alias DENV='npx dotenv -e .env --'
1. ビルド & 起動
bash
コードをコピーする
# TypeScript ビルド（ホスト）
npm run build

# コンテナビルド & 起動
docker compose up -d --build

# 直近ログ（ルーティングが見えるまで確認）
docker compose logs -n 200 api
起動確認（ヘルスチェック）

bash
コードをコピーする
curl -s http://localhost:4001/api/v1/health | jq .
# => { "ok": true, "env": "...", "version": "...", ... }
ログに Mapped {/api/v1/shops/:shopId/assignments, POST} route 等が並べば OK。

2. DB マイグレーション状態の確認（任意）
本リポではコンテナ起動時に prisma migrate deploy を実行します。
追加で確認する場合：

bash
コードをコピーする
DENV bash -lc 'psql "$OWNER_DATABASE_URL" -At -c "
  SELECT id, name, finished_at IS NOT NULL AS applied
  FROM _prisma_migrations ORDER BY finished_at NULLS FIRST, id;"' || echo "no _prisma_migrations"
3. 最小データの投入（ロール / 管理者 / 店舗 / キャスト）
3-1) ロール作成 + admin 付与
bash
コードをコピーする
cat <<'SQL' | DENV bash -lc 'psql "$OWNER_DATABASE_URL" -v ON_ERROR_STOP=1 -f -'
INSERT INTO roles (id, code, name) VALUES (gen_random_uuid(), 'admin', 'Administrator')
ON CONFLICT (code) DO NOTHING;
INSERT INTO roles (id, code, name) VALUES (gen_random_uuid(), 'staff', 'Staff')
ON CONFLICT (code) DO NOTHING;
SQL
管理者ユーザー（email: admin@example.com）を作成（なければ挿入）し、admin ロールを付与：

bash
コードをコピーする
# ユーザ作成
cat <<'SQL' | DENV bash -lc 'psql "$OWNER_DATABASE_URL" -v ON_ERROR_STOP=1 -f -'
INSERT INTO users (id, "authProvider", user_type, status, email, must_change_password, created_at)
VALUES (gen_random_uuid(), 'password', 'admin', 'active', 'admin@example.com', false, now())
ON CONFLICT (email) DO NOTHING;
SQL

# admin 付与
cat <<'SQL' | DENV bash -lc 'psql "$OWNER_DATABASE_URL" -v ON_ERROR_STOP=1 -f -'
INSERT INTO user_roles (id, user_id, role_id)
SELECT gen_random_uuid(), u.id, r.id
FROM users u JOIN roles r ON r.code='admin'
WHERE u.email='admin@example.com'
ON CONFLICT (user_id, role_id) DO NOTHING;
SQL

# USER_ID を取得
USER_ID=$(DENV bash -lc 'psql "$OWNER_DATABASE_URL" -At -c "SELECT id FROM users WHERE email='\''admin@example.com'\'' LIMIT 1;"')
echo "USER_ID=$USER_ID"
3-2) 店舗の作成（API）
bash
コードをコピーする
SHOP_JSON='{"name":"デモ店","prefecture":"福岡県","city":"福岡市"}'
curl -sS -X POST "http://localhost:4001/api/v1/shops" \
  -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
  -d "$SHOP_JSON" | jq .

# SHOP_ID を DB から取得
SHOP_ID=$(DENV bash -lc \
  'psql "$OWNER_DATABASE_URL" -At -c "SELECT id FROM shops WHERE name='\''デモ店'\'' ORDER BY created_at DESC LIMIT 1;"')
echo "SHOP_ID=$SHOP_ID"
3-3) キャストの作成（DB）
bash
コードをコピーする
# users + casts レコード作成
cat <<'SQL' | DENV bash -lc 'psql "$OWNER_DATABASE_URL" -v ON_ERROR_STOP=1 -f -'
INSERT INTO users (id, "authProvider", user_type, status, email, created_at)
VALUES (gen_random_uuid(), 'password', 'cast', 'active', 'cast1@example.com', now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO casts (user_id, display_name, created_at)
SELECT id, 'デモキャスト', now()
FROM users WHERE email='cast1@example.com'
ON CONFLICT (user_id) DO NOTHING;
SQL

# CAST_ID を取得（casts.user_id = users.id）
CAST_ID=$(DENV bash -lc \
  'psql "$OWNER_DATABASE_URL" -At -c "SELECT user_id FROM casts WHERE user_id=(SELECT id FROM users WHERE email='\''cast1@example.com'\'') LIMIT 1;"')
echo "CAST_ID=$CAST_ID"
4. Assignments のスモーク
共通変数：

bash
コードをコピーする
API=http://localhost:4001
DATE=$(date -u +%F)
4-1) 作成（POST）
bash
コードをコピーする
curl -sS -X POST "$API/api/v1/shops/$SHOP_ID/assignments" \
  -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
  -d "{\"castId\":\"$CAST_ID\",\"assignedFrom\":\"${DATE}T18:00:00Z\",\"priority\":1}" | jq .
期待: 201/200 相当の JSON が返ってレコード作成

同一条件で再POST: 409 Conflict（Unique: shop_id, cast_id, assigned_from）

4-2) 別スロットを追加（POST）
bash
コードをコピーする
curl -sS -X POST "$API/api/v1/shops/$SHOP_ID/assignments" \
  -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
  -d "{\"castId\":\"$CAST_ID\",\"assignedFrom\":\"${DATE}T19:00:00Z\",\"priority\":2}" | jq .
4-3) 一覧（GET）
bash
コードをコピーする
curl -sS "$API/api/v1/shops/$SHOP_ID/assignments?date=$DATE" \
  -H "x-user-id: $USER_ID" | jq .
期待: 18:00 と 19:00 の2件が昇順で返る

4-4) 更新（PATCH）
bash
コードをコピーする
# 直近で作った 19:00 の id を変数へ（例）
ASSIGN_ID=$(curl -sS -X POST "$API/api/v1/shops/$SHOP_ID/assignments" \
  -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
  -d "{\"castId\":\"$CAST_ID\",\"assignedFrom\":\"${DATE}T20:00:00Z\",\"priority\":1}" | jq -r '.id')

# ステータス + 優先度 更新
curl -sS -X PATCH "$API/api/v1/shops/$SHOP_ID/assignments/$ASSIGN_ID" \
  -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
  -d '{"priority":3,"status":"assigned"}' | jq .

# 終了時刻 追加
curl -sS -X PATCH "$API/api/v1/shops/$SHOP_ID/assignments/$ASSIGN_ID" \
  -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
  -d "{\"assignedTo\":\"${DATE}T21:00:00Z\"}" | jq .
5. Swagger での動作確認
環境	URL
開発	http://localhost:4001/docs
本番パス検証	http://localhost:4001/api/v1/docs

shops/{shopId}/assignments セクションで POST / GET / PATCH を順に実行。
x-user-id をヘッダに入れる点に注意。

6. 合否判定（Exit Criteria）
 /api/v1/health が ok:true を返す

 POST /shops が 201/200 を返し、新規作成できる（admin 権限で）

 POST /shops/{id}/assignments 初回が成功、同一内容の再POSTが 409 Conflict

 GET /shops/{id}/assignments?date=YYYY-MM-DD で作成分が取得できる

 PATCH /shops/{id}/assignments/{assignId} で status/priority/assignedTo が更新できる

7. よくあるエラー & 対処
事象	原因	対処
401 x-user-id header is required	ヘッダ未設定	-H "x-user-id: $USER_ID" を付与
403 required roles: admin, staff	権限不足	user_roles に admin か staff を付与
404 Cannot POST .../assignments	ルート未マッピング/古いイメージ	docker compose up -d --build で再ビルド、logs で Mapped を確認
409 Duplicate slot	ユニーク制約（店×キャスト×開始）に重複	同じ assignedFrom では POST せず PATCH で更新
500 Internal server error	Prisma 例外など	docker compose logs -n 200 api で詳細を参照

8. トラブルシュート・コマンド
bash
コードをコピーする
# 直近200行ログ
docker compose logs -n 200 api

# ルートのマッピング確認
docker compose logs -n 200 api | grep -E "Mapped .*assignments"

# DB スキーマの列確認（例: users）
DENV bash -lc 'psql "$OWNER_DATABASE_URL" -At -c "
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_schema='\''public'\'' AND table_name='\''users'\'' ORDER BY ordinal_position;"'
9. 片付け（任意）
bash
コードをコピーする
# コンテナ停止
docker compose down
DB は Neon を使用しているため、データは残ります。初期化が必要なら手動で TRUNCATE / DROP を実施してください。

© 2025 Tiara API Development Team / Nagai
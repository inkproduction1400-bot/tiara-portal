# Assignments API 検証ドキュメント

Tiara API における「キャストのアサイン（出勤予定・割当）」機能の検証手順です。  
NestJS + Prisma にて実装され、`shops/:shopId/assignments` 配下にルーティングされています。

---

## 📘 1. 概要

| 要素 | 内容 |
|------|------|
| ベースパス | `/api/v1/shops/:shopId/assignments` |
| 対象モデル | `ShopAssignment` |
| 主キー | `id` (UUID) |
| ユニーク制約 | `(shopId, castId, assignedFrom)` |
| ステータス | `planned / assigned / working / completed / cancelled` |
| 認可 | `x-user-id` ヘッダ必須（admin または staff ロール） |

---

## ⚙️ 2. 前提

以下の変数を環境に設定しておきます。

```bash
USER_ID=<管理者の UUID>   # admin@example.com のID
SHOP_ID=<店舗ID>
CAST_ID=<キャストID>
API=http://localhost:4001
DATE=$(date -u +%F)
環境変数を .env から読みたい場合は次のようにします：

bash
コードをコピーする
alias DENV='npx dotenv -e .env --'
USER_ID=$(DENV bash -lc 'psql "$OWNER_DATABASE_URL" -At -c "SELECT id FROM users WHERE email='\''admin@example.com'\'' LIMIT 1;"')
🧱 3. 新規アサイン作成 (POST)
エンドポイント
POST /api/v1/shops/:shopId/assignments

リクエスト例
bash
コードをコピーする
curl -sS -X POST "$API/api/v1/shops/$SHOP_ID/assignments" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"castId\": \"$CAST_ID\",
    \"assignedFrom\": \"${DATE}T19:00:00Z\",
    \"priority\": 1
  }" | jq .
成功レスポンス例
json
コードをコピーする
{
  "id": "7b4784b8-3fea-42ee-803c-6d2b2b4ca20e",
  "shopId": "dcb32f1b-ccc4-4f90-868d-0f90e04f32fe",
  "castId": "3fc8eebf-9699-4bae-a98b-218b66df1e15",
  "assignedFrom": "2025-11-01T19:00:00.000Z",
  "assignedTo": null,
  "status": "planned",
  "priority": 1,
  "createdAt": "2025-11-01T12:18:04.210Z",
  "updatedAt": "2025-11-01T12:18:04.210Z"
}
エラー例（重複スロット）
同一 shopId + castId + assignedFrom で再度 POST すると：

bash
コードをコピーする
HTTP/1.1 409 Conflict
{
  "message": "Duplicate slot for this shop/cast/assignedFrom",
  "error": "Conflict",
  "statusCode": 409
}
🔍 4. 一覧取得 (GET)
エンドポイント
GET /api/v1/shops/:shopId/assignments?date=YYYY-MM-DD

リクエスト例
bash
コードをコピーする
curl -sS "$API/api/v1/shops/$SHOP_ID/assignments?date=$DATE" \
  -H "x-user-id: $USER_ID" | jq .
成功レスポンス例
json
コードをコピーする
[
  {
    "id": "7539f313-aa95-4c1a-b4bc-e72083b24fd8",
    "shopId": "dcb32f1b-ccc4-4f90-868d-0f90e04f32fe",
    "castId": "3fc8eebf-9699-4bae-a98b-218b66df1e15",
    "assignedFrom": "2025-11-01T18:00:00.000Z",
    "status": "planned",
    "priority": 1
  },
  {
    "id": "7b4784b8-3fea-42ee-803c-6d2b2b4ca20e",
    "shopId": "dcb32f1b-ccc4-4f90-868d-0f90e04f32fe",
    "castId": "3fc8eebf-9699-4bae-a98b-218b66df1e15",
    "assignedFrom": "2025-11-01T19:00:00.000Z",
    "assignedTo": "2025-11-01T21:00:00.000Z",
    "status": "assigned",
    "priority": 3
  }
]
✏️ 5. 更新 (PATCH)
エンドポイント
PATCH /api/v1/shops/:shopId/assignments/:id

更新項目
priority（整数）

status（planned / assigned / working / completed / cancelled）

assignedTo（日時）

例1: ステータスと優先度を更新
bash
コードをコピーする
ASSIGN_ID=<POSTで得たid>

curl -sS -X PATCH "$API/api/v1/shops/$SHOP_ID/assignments/$ASSIGN_ID" \
  -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
  -d '{"priority":3,"status":"assigned"}' | jq .
結果：

json
コードをコピーする
{
  "id": "7b4784b8-3fea-42ee-803c-6d2b2b4ca20e",
  "status": "assigned",
  "priority": 3
}
例2: 終了時刻を付与
bash
コードをコピーする
curl -sS -X PATCH "$API/api/v1/shops/$SHOP_ID/assignments/$ASSIGN_ID" \
  -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
  -d "{\"assignedTo\":\"${DATE}T21:00:00Z\"}" | jq .
🚫 6. エラー仕様一覧
ステータス	意味	対応方法
400	ValidationPipe によるリクエスト不正	型・必須パラメータを確認
401	x-user-id ヘッダがない	ヘッダを追加する
403	ロール不一致 (required roles: admin, staff)	ユーザに admin or staff ロールを付与
404	不存在のショップ/アサインID	ID誤り
409	ユニーク制約違反	同一スロット重複。PATCH で更新する
500	Prisma例外など内部エラー	docker compose logs api でスタック確認

🧩 7. Swagger UI 確認
環境	URL
開発	http://localhost:4001/docs
本番パス検証	http://localhost:4001/api/v1/docs

Swagger 上で shops/{shopId}/assignments を開き、
Try it out → Execute を押下して POST / GET / PATCH を順に確認できます。

💡 8. 補足Tips
8.1 便利なシェル関数
よく使う操作をシェルスクリプト化しておくと便利です。

bash
コードをコピーする
# scripts/assignments.sh (抜粋)
post_assign () {
  local date="$1" time="$2" prio="${3:-1}"
  curl -sS -X POST "$API/api/v1/shops/$SHOP_ID/assignments" \
    -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
    -d "{\"castId\":\"$CAST_ID\",\"assignedFrom\":\"${date}T${time}\",\"priority\":${prio}}" | jq .
}

list_assign () {
  local date="$1"
  curl -sS "$API/api/v1/shops/$SHOP_ID/assignments?date=$date" \
    -H "x-user-id: $USER_ID" | jq .
}

patch_assign () {
  local id="$1" payload="$2"
  curl -sS -X PATCH "$API/api/v1/shops/$SHOP_ID/assignments/$id" \
    -H "x-user-id: $USER_ID" -H "Content-Type: application/json" \
    -d "$payload" | jq .
}
呼び出し例：

bash
コードをコピーする
. scripts/assignments.sh
DATE=$(date -u +%F)
post_assign "$DATE" "19:00:00Z" 2
list_assign "$DATE"
✅ 9. 想定テストシナリオ
No	テスト内容	期待結果
1	新規アサイン（初回POST）	201 Created
2	同一条件で再POST	409 Conflict
3	PATCHでstatus更新	200 OK, status変更反映
4	PATCHでassignedTo追加	200 OK, 終了時刻反映
5	GETで両件取得	2件出力（18時/19時）
6	x-user-idなしでPOST	401 Unauthorized
7	一般ユーザでPOST	403 Forbidden
8	不正なUUID指定	400 Bad Request

🧾 10. 参考
NestJS Controller: src/assignments/assignments.controller.ts

Prisma Model: prisma/schema.prisma → model ShopAssignment

Business Logic: src/assignments/assignments.service.ts

Error Handling: P2002 (unique constraint) → 409 Conflict

© 2025 Tiara API Development Team / Nagai

yaml
コードをコピーする

---

これを `docs/assignments.md` としてプロジェクトに追加すれば、  
APIテスト担当者・後続開発者がすぐ再現できる完全な Runbook として機能します。